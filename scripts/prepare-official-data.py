import csv
import json
import math
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw_official"
OUT = ROOT / "data"
CACHE = RAW / "geocode_cache.json"

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


def load_cache():
    if CACHE.exists():
        return json.loads(CACHE.read_text(encoding="utf-8"))
    return {}


def save_cache(cache):
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


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


def main():
    cache = load_cache()
    population = {strip_text(r["동"]): r for r in read_csv(RAW / "seongnam_population_households.csv")}
    singles = {strip_text(r["동별"]): r for r in read_csv(RAW / "seongnam_single_household.csv")}
    medical = read_csv(RAW / "seongnam_medical.csv")
    pharmacy = read_csv(RAW / "seongnam_pharmacy.csv")
    care_rows = read_csv(RAW / "seongnam_senior_welfare.csv", encoding="cp949")
    garages = read_csv(RAW / "seongnam_bus_garage.csv")

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
        transit_dist = nearest_distance(lat, lng, garage_points)
        med_point = representative_point(medical, "의료기관명", "의료기관주소(도로명)", district, prefix, cache)
        pharm_point = representative_point(pharmacy, "약국명칭", "약국소재지(도로명)", district, prefix, cache)
        if med_point:
            service_points.append({"service_type": "medical", "area_name": area_name, **med_point})
        if pharm_point:
            service_points.append({"service_type": "pharmacy", "area_name": area_name, **pharm_point})
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
                f"노인복지관 {item['care_distance_km']:.1f}km, 교통기반시설 {item['transit_distance_km']:.1f}km"
            ),
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

    point_fields = ["service_type", "lat", "lng", "name", "district", "area_name"]
    with (OUT / "service_points.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=point_fields)
        writer.writeheader()
        for point in service_points:
            writer.writerow({key: point.get(key, "") for key in point_fields})

    print(f"wrote {OUT / 'accessibility_metrics.csv'} ({len(area_rows)} areas)")
    print(f"wrote {OUT / 'service_points.csv'} ({len(service_points)} points)")


if __name__ == "__main__":
    main()
