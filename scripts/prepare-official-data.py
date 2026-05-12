import csv
import json
import math
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw_official"
OUT = ROOT / "data"
PROCESSED = OUT / "processed"
CACHE = RAW / "geocode_cache.json"
OSM_BUS_STOPS = RAW / "osm_seongnam_bus_stops.json"

SOURCE_FILES = [
    {
        "name": "성남시 의료기관 현황",
        "file": "seongnam_medical.csv",
        "period": "2026-03-04",
        "url": "https://www.data.go.kr/data/15000890/fileData.do",
        "use": "동별 의료기관 수와 대표 의료 거점 좌표",
    },
    {
        "name": "성남시 약국 현황",
        "file": "seongnam_pharmacy.csv",
        "period": "2026-03-04",
        "url": "https://www.data.go.kr/data/15000848/fileData.do",
        "use": "동별 약국 수와 대표 약국 좌표",
    },
    {
        "name": "성남시 노인종합복지관 현황",
        "file": "seongnam_senior_welfare.csv",
        "period": "2025-06-05",
        "url": "https://www.data.go.kr/data/15000901/fileData.do",
        "use": "노인복지관 목록과 돌봄 접근 거리",
    },
    {
        "name": "경기교통정보센터 버스정류소 현황",
        "file": "gits_seongnam_bus_stop_count_2025.csv",
        "period": "2025",
        "url": "https://gits.gg.go.kr/gtdb/web/trafficDb/publicTransport/busStop.do",
        "use": "성남시 정류소 규모 교차 확인",
    },
    {
        "name": "OpenStreetMap 성남시 버스정류장 노드",
        "file": "osm_seongnam_bus_stops.json",
        "period": "2026-05-08 다운로드",
        "url": "https://overpass-api.de/",
        "use": "실제 버스정류장 좌표 기반 거리 산정",
    },
    {
        "name": "성남시 인구 및 세대 현황",
        "file": "seongnam_population_households.csv",
        "period": "2026-03-31",
        "url": "https://www.data.go.kr/data/15007386/fileData.do",
        "use": "인구, 고령층 비율, 세대 규모",
    },
    {
        "name": "성남시 1인세대 현황",
        "file": "seongnam_single_household.csv",
        "period": "2025-04-30",
        "url": "https://www.data.go.kr/data/15061108/fileData.do",
        "use": "1인가구와 고령 1인가구 비율",
    },
    {
        "name": "성남시 복지시설 좌표 PDF",
        "file": "seongnam_public_wifi_welfare_coordinates.pdf",
        "period": "공개 PDF 기준",
        "url": "https://www.seongnam.go.kr/contents/down/10458_6.pdf",
        "use": "노인복지관 좌표 보정",
    },
]

TARGET_AREAS = [
    ("D001", "태평1동", "수정구", "태평", 37.446, 127.127, 16, 22),
    ("D002", "수진2동", "수정구", "수진", 37.437, 127.137, 33, 28),
    ("D003", "복정동", "수정구", "복정", 37.462, 127.128, 49, 18),
    ("D004", "은행2동", "중원구", "은행", 37.457, 127.165, 22, 45),
    ("D005", "금광1동", "중원구", "금광", 37.448, 127.161, 39, 47),
    ("D006", "상대원1동", "중원구", "상대원", 37.436, 127.169, 57, 43),
    ("D007", "서현1동", "분당구", "서현", 37.385, 127.124, 31, 68),
    ("D008", "야탑3동", "분당구", "야탑", 37.409, 127.138, 51, 63),
    ("D009", "정자동", "분당구", "정자", 37.391, 127.098, 70, 58),
    ("D010", "구미동", "분당구", "구미", 37.340, 127.121, 66, 81),
]

WELFARE_COORDINATES = {
    # Coordinate supplement: Seongnam public Wi-Fi/facility coordinate PDF
    # https://www.seongnam.go.kr/contents/down/10458_6.pdf
    "수정노인종합복지관": {"lat": 37.451083507158, "lng": 127.152906546913},
    "수정중앙노인종합복지관": {"lat": 37.461634114491, "lng": 127.130466891844},
    "중원노인종합복지관": {"lat": 37.432207311291, "lng": 127.131537317533},
    "황송노인종합복지관": {"lat": 37.441984590870, "lng": 127.169193675279},
    "분당노인종합복지관": {"lat": 37.357512000000, "lng": 127.112390000000},
    "판교노인종합복지관": {"lat": 37.390259866526, "lng": 127.108656534823},
}


def read_csv(path, encoding="utf-8-sig"):
    with path.open("r", encoding=encoding, newline="") as file:
        return list(csv.DictReader(file))


def as_int(value):
    return int(str(value).replace(",", "").strip() or "0")


def strip_text(value):
    return str(value or "").strip()


def clean_address(value):
    text = strip_text(value)
    text = re.sub(r",.*", "", text)
    text = re.sub(r"\([^)]*\)", "", text)
    text = re.sub(r"\s+\d+층.*", "", text)
    text = re.sub(r"\s+\d+호.*", "", text)
    text = re.sub(r"(\d+)\s*번길", r"\1번길", text)
    return text


def haversine(lat1, lon1, lat2, lon2):
    radius = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def minmax_score(value, values, invert=False, floor=45, ceil=95):
    lo, hi = min(values), max(values)
    if hi == lo:
        return round((floor + ceil) / 2)
    ratio = (value - lo) / (hi - lo)
    if invert:
        ratio = 1 - ratio
    return round(floor + (ceil - floor) * ratio)


def nearest_distance(lat, lng, points):
    if not points:
        return 9.9
    return min(haversine(lat, lng, p["lat"], p["lng"]) for p in points)


def nearest_point(lat, lng, points):
    if not points:
        return None
    return min(points, key=lambda point: haversine(lat, lng, point["lat"], point["lng"]))


def load_cache():
    if CACHE.exists():
        return json.loads(CACHE.read_text(encoding="utf-8"))
    return {}


def save_cache(cache):
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def raw_row_count(source):
    path = RAW / source["file"]
    if not path.exists():
        return 0
    if path.suffix.lower() == ".json":
        payload = json.loads(path.read_text(encoding="utf-8"))
        return len(payload.get("elements", []))
    if path.suffix.lower() == ".pdf":
        return None
    encoding = "cp949" if source["file"] == "seongnam_senior_welfare.csv" else "utf-8-sig"
    return len(read_csv(path, encoding=encoding))


def source_manifest():
    records = []
    for source in SOURCE_FILES:
        path = RAW / source["file"]
        records.append({
            **source,
            "local_path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "exists": path.exists(),
            "rows": raw_row_count(source),
        })
    return records


def geocode(address, cache):
    if address in cache:
        return cache[address]
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"format": "json", "limit": "1", "q": address}
    )
    request = urllib.request.Request(url, headers={"User-Agent": "codex-seongnam-access/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if not payload:
        cache[address] = None
    else:
        cache[address] = {"lat": float(payload[0]["lat"]), "lng": float(payload[0]["lon"])}
    save_cache(cache)
    time.sleep(1.1)
    return cache[address]


def rows_for_prefix(rows, address_key, district, prefix):
    return [
        row
        for row in rows
        if strip_text(row.get("구별")) == district and prefix in strip_text(row.get(address_key))
    ]


def representative_point(rows, name_key, address_key, district, prefix, cache):
    candidates = rows_for_prefix(rows, address_key, district, prefix)
    for row in candidates[:8]:
        address = clean_address(row[address_key])
        point = geocode(address, cache)
        if point:
            return {
                "lat": point["lat"],
                "lng": point["lng"],
                "name": strip_text(row[name_key]),
                "district": district,
                "address": address,
            }
    return None


def load_osm_bus_stops():
    if not OSM_BUS_STOPS.exists():
        return []
    payload = json.loads(OSM_BUS_STOPS.read_text(encoding="utf-8"))
    points = []
    seen = set()
    for element in payload.get("elements", []):
        lat = element.get("lat")
        lng = element.get("lon")
        if lat is None or lng is None:
            continue
        lat = float(lat)
        lng = float(lng)
        if not (37.32 <= lat <= 37.49 and 127.07 <= lng <= 127.19):
            continue
        key = (round(lat, 7), round(lng, 7))
        if key in seen:
            continue
        seen.add(key)
        tags = element.get("tags", {})
        name = strip_text(tags.get("name") or tags.get("ref") or "버스정류장")
        points.append({
            "lat": lat,
            "lng": lng,
            "name": name,
            "district": "성남시",
        })
    return points


def main():
    PROCESSED.mkdir(parents=True, exist_ok=True)
    cache = load_cache()
    population = {strip_text(r["동"]): r for r in read_csv(RAW / "seongnam_population_households.csv")}
    singles = {strip_text(r["동별"]): r for r in read_csv(RAW / "seongnam_single_household.csv")}
    medical = read_csv(RAW / "seongnam_medical.csv")
    pharmacy = read_csv(RAW / "seongnam_pharmacy.csv")
    care_rows = read_csv(RAW / "seongnam_senior_welfare.csv", encoding="cp949")
    garages = read_csv(RAW / "seongnam_bus_garage.csv")
    bus_stop_points = load_osm_bus_stops()

    care_points = []
    for row in care_rows:
        name = strip_text(row["복지관명"])
        address = clean_address(row["소재지"])
        point = WELFARE_COORDINATES.get(name) or geocode(address, cache)
        if point:
            care_points.append({
                "lat": point["lat"],
                "lng": point["lng"],
                "name": name,
                "district": "성남시",
                "address": address,
            })

    garage_points = [
        {
            "lat": float(row["위도"]),
            "lng": float(row["경도"]),
            "name": strip_text(row["차고지명"]),
            "district": strip_text(row["시군구"]),
        }
        for row in garages
        if strip_text(row.get("위도")) and strip_text(row.get("경도"))
    ]

    metrics_base = []
    service_points = []
    for area_id, area_name, district, prefix, lat, lng, x, y in TARGET_AREAS:
        pop_row = population[area_name]
        single_row = singles[area_name]
        pop = as_int(pop_row["인구수_계"])
        elderly = as_int(pop_row["65세 이상_계"])
        single = as_int(single_row["1인세대수_계"])
        older_single = as_int(single_row["65세 이상(계)"])
        med_count = len(rows_for_prefix(medical, "의료기관주소(도로명)", district, prefix))
        pharm_count = len(rows_for_prefix(pharmacy, "약국소재지(도로명)", district, prefix))
        care_dist = nearest_distance(lat, lng, care_points)
        transit_points = bus_stop_points or garage_points
        transit_dist = nearest_distance(lat, lng, transit_points)
        med_point = representative_point(medical, "의료기관명", "의료기관주소(도로명)", district, prefix, cache)
        pharm_point = representative_point(pharmacy, "약국명칭", "약국소재지(도로명)", district, prefix, cache)
        if med_point:
            service_points.append({"service_type": "medical", "area_name": area_name, **med_point})
        if pharm_point:
            service_points.append({"service_type": "pharmacy", "area_name": area_name, **pharm_point})
        bus_point = nearest_point(lat, lng, bus_stop_points)
        if bus_point:
            service_points.append({"service_type": "bus", "area_name": area_name, **bus_point})
        metrics_base.append({
            "area_id": area_id,
            "area_name": area_name,
            "district": district,
            "x": x,
            "y": y,
            "lat": lat,
            "lng": lng,
            "population": pop,
            "elderly_ratio": round(elderly / pop * 100, 1),
            "single_ratio": round(single / pop * 100, 1),
            "older_single_ratio": round(older_single / pop * 100, 1),
            "medical_count": med_count,
            "pharmacy_count": pharm_count,
            "care_distance_km": care_dist,
            "transit_distance_km": transit_dist,
        })

    for point in care_points:
        # keep representative welfare points near the selected living areas
        if any(haversine(point["lat"], point["lng"], area["lat"], area["lng"]) < 3.8 for area in metrics_base):
            service_points.append({"service_type": "care", "area_name": "", **point})
    if not bus_stop_points:
        for point in garage_points:
            service_points.append({"service_type": "bus", "area_name": "", **point})

    med_counts = [m["medical_count"] for m in metrics_base]
    pharm_counts = [m["pharmacy_count"] for m in metrics_base]
    care_dists = [m["care_distance_km"] for m in metrics_base]
    transit_dists = [m["transit_distance_km"] for m in metrics_base]
    elderly_ratios = [m["elderly_ratio"] for m in metrics_base]
    single_ratios = [m["single_ratio"] for m in metrics_base]
    older_single_ratios = [m["older_single_ratio"] for m in metrics_base]

    area_rows = []
    audit_rows = []
    for item in metrics_base:
        medical_score = minmax_score(item["medical_count"], med_counts, floor=48, ceil=92)
        pharmacy_score = minmax_score(item["pharmacy_count"], pharm_counts, floor=48, ceil=92)
        transit_score = minmax_score(item["transit_distance_km"], transit_dists, invert=True, floor=48, ceil=88)
        care_score = minmax_score(item["care_distance_km"], care_dists, invert=True, floor=48, ceil=88)
        care_demand = round(
            0.45 * minmax_score(item["elderly_ratio"], elderly_ratios, floor=0, ceil=100)
            + 0.35 * minmax_score(item["older_single_ratio"], older_single_ratios, floor=0, ceil=100)
            + 0.20 * minmax_score(item["single_ratio"], single_ratios, floor=0, ceil=100)
        )
        vulnerable_index = round(
            0.45 * minmax_score(item["elderly_ratio"], elderly_ratios, floor=0, ceil=100)
            + 0.35 * minmax_score(item["single_ratio"], single_ratios, floor=0, ceil=100)
            + 0.20 * care_demand
        )
        overall = medical_score * 0.3 + pharmacy_score * 0.2 + transit_score * 0.25 + care_score * 0.25
        area_rows.append({
            "area_id": item["area_id"],
            "area_name": item["area_name"],
            "district": item["district"],
            "x": item["x"],
            "y": item["y"],
            "lat": item["lat"],
            "lng": item["lng"],
            "population": item["population"],
            "elderly_ratio": item["elderly_ratio"],
            "single_ratio": item["single_ratio"],
            "care_demand": care_demand,
            "medical_score": medical_score,
            "pharmacy_score": pharmacy_score,
            "transit_score": transit_score,
            "care_score": care_score,
            "overall_score": round(overall, 1),
            "vulnerable_index": vulnerable_index,
            "selection_note": (
                f"공식 CSV 기반: 의료 {item['medical_count']}곳, 약국 {item['pharmacy_count']}곳, "
                f"노인복지관 {item['care_distance_km']:.1f}km, 정류장 {item['transit_distance_km']:.1f}km"
            ),
        })
        audit_rows.append({
            "area_id": item["area_id"],
            "area_name": item["area_name"],
            "district": item["district"],
            "population": item["population"],
            "elderly_ratio": item["elderly_ratio"],
            "single_ratio": item["single_ratio"],
            "older_single_ratio": item["older_single_ratio"],
            "medical_count": item["medical_count"],
            "pharmacy_count": item["pharmacy_count"],
            "nearest_care_distance_km": round(item["care_distance_km"], 3),
            "nearest_bus_stop_distance_km": round(item["transit_distance_km"], 3),
            "care_demand": care_demand,
            "vulnerable_index": vulnerable_index,
            "medical_score": medical_score,
            "pharmacy_score": pharmacy_score,
            "transit_score": transit_score,
            "care_score": care_score,
            "overall_score": round(overall, 1),
        })

    area_fields = [
        "area_id", "area_name", "district", "x", "y", "lat", "lng", "population",
        "elderly_ratio", "single_ratio", "care_demand", "medical_score",
        "pharmacy_score", "transit_score", "care_score", "overall_score",
        "vulnerable_index", "selection_note",
    ]
    with (OUT / "accessibility_metrics.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=area_fields)
        writer.writeheader()
        writer.writerows(area_rows)

    audit_fields = [
        "area_id", "area_name", "district", "population", "elderly_ratio",
        "single_ratio", "older_single_ratio", "medical_count", "pharmacy_count",
        "nearest_care_distance_km", "nearest_bus_stop_distance_km", "care_demand",
        "vulnerable_index", "medical_score", "pharmacy_score", "transit_score",
        "care_score", "overall_score",
    ]
    with (PROCESSED / "accessibility_metrics_audit.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=audit_fields)
        writer.writeheader()
        writer.writerows(audit_rows)

    point_fields = ["service_type", "lat", "lng", "name", "district", "area_name"]
    with (OUT / "service_points.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=point_fields)
        writer.writeheader()
        for point in service_points:
            writer.writerow({key: point.get(key, "") for key in point_fields})

    metadata = {
        "title": "성남 10분 생활필수 접근권 격차 지도",
        "source_mode": "official_public_data",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "analysis_unit": "대표 생활권 10개 동",
        "method_version": "official-public-data-2026-05",
        "outputs": [
            "data/accessibility_metrics.csv",
            "data/service_points.csv",
            "data/processed/accessibility_metrics_audit.csv",
            "data/processed/data_manifest.json",
        ],
        "weights": {
            "medical_score": 0.30,
            "pharmacy_score": 0.20,
            "transit_score": 0.25,
            "care_score": 0.25,
        },
        "score_bands": [
            {"label": "우선 점검 필요", "range": "0-57"},
            {"label": "주의 관찰", "range": "58-69"},
            {"label": "대체로 양호", "range": "70-100"},
        ],
        "row_counts": {
            "areas": len(area_rows),
            "service_points": len(service_points),
            "osm_bus_stop_nodes": len(bus_stop_points),
            "care_points": len(care_points),
        },
        "sources": source_manifest(),
        "notes": [
            "현재 점수는 위치 기반 근사 접근성 지표입니다.",
            "보행 네트워크, 경사, 횡단 여건, 실제 이동시간을 결합하면 10분 도달성 지표로 확장할 수 있습니다.",
            "공모전 민간 통신·카드 데이터는 활용 가능 출처를 확인했지만, 현재 대시보드 CSV 산출에는 직접 반영하지 않았습니다.",
        ],
    }
    (PROCESSED / "data_manifest.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"wrote {OUT / 'accessibility_metrics.csv'} ({len(area_rows)} areas)")
    print(f"wrote {OUT / 'service_points.csv'} ({len(service_points)} points)")
    print(f"wrote {PROCESSED / 'accessibility_metrics_audit.csv'}")
    print(f"wrote {PROCESSED / 'data_manifest.json'}")


if __name__ == "__main__":
    main()
