import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type AreaMetric = {
  area_id: string;
  area_name: string;
  district: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  population: number;
  elderly_ratio: number;
  single_ratio: number;
  care_demand: number;
  medical_score: number;
  pharmacy_score: number;
  transit_score: number;
  care_score: number;
  overall_score: number;
  vulnerable_index: number;
  selection_note: string;
};

export type ServicePoint = {
  service_type: "medical" | "pharmacy" | "bus" | "care";
  lat: number;
  lng: number;
  name: string;
  district: string;
  area_name: string;
};

export type DataIssue = {
  severity: "info" | "warning" | "error";
  message: string;
};

export type DashboardData = {
  areas: AreaMetric[];
  points: ServicePoint[];
  issues: DataIssue[];
  source: "csv" | "sample" | "empty" | "error";
};

export type LoadScenario = "normal" | "empty" | "error";

export const DEFAULT_WEIGHTS = {
  medical_score: 0.3,
  pharmacy_score: 0.2,
  transit_score: 0.25,
  care_score: 0.25,
} as const;

export const dataScope = {
  title: "대표 생활권 10개 동",
  summary: "고령층 비중, 1인가구 비중, 생활서비스 접근 편차, 수정·중원·분당 권역 대표성을 기준으로 구성했습니다.",
  caveat: "동일 CSV 매핑으로 전체 행정동 전수 분석까지 확장할 수 있습니다.",
};

const areaFallback: AreaMetric[] = [
  {
    area_id: "D001",
    area_name: "태평1동",
    district: "수정구",
    x: 16,
    y: 22,
    lat: 37.446,
    lng: 127.127,
    population: 18340,
    elderly_ratio: 23,
    single_ratio: 39,
    care_demand: 68,
    medical_score: 58,
    pharmacy_score: 63,
    transit_score: 72,
    care_score: 49,
    overall_score: 60.3,
    vulnerable_index: 74,
    selection_note: "고령·1인가구 비중이 높은 수정구 구도심 생활권",
  },
  {
    area_id: "D002",
    area_name: "수진2동",
    district: "수정구",
    x: 33,
    y: 28,
    lat: 37.437,
    lng: 127.137,
    population: 20120,
    elderly_ratio: 20,
    single_ratio: 42,
    care_demand: 61,
    medical_score: 62,
    pharmacy_score: 66,
    transit_score: 75,
    care_score: 56,
    overall_score: 64.6,
    vulnerable_index: 66,
    selection_note: "1인가구와 대중교통 의존도가 높은 역세권 배후",
  },
  {
    area_id: "D003",
    area_name: "복정동",
    district: "수정구",
    x: 49,
    y: 18,
    lat: 37.462,
    lng: 127.128,
    population: 14750,
    elderly_ratio: 17,
    single_ratio: 35,
    care_demand: 54,
    medical_score: 71,
    pharmacy_score: 69,
    transit_score: 70,
    care_score: 59,
    overall_score: 67.5,
    vulnerable_index: 54,
    selection_note: "수정구 북부 경계 생활권으로 권역 편차 확인",
  },
  {
    area_id: "D004",
    area_name: "은행2동",
    district: "중원구",
    x: 22,
    y: 45,
    lat: 37.457,
    lng: 127.165,
    population: 22780,
    elderly_ratio: 25,
    single_ratio: 37,
    care_demand: 73,
    medical_score: 51,
    pharmacy_score: 57,
    transit_score: 60,
    care_score: 45,
    overall_score: 52.9,
    vulnerable_index: 79,
    selection_note: "고령·돌봄 수요와 접근성 부족이 함께 보임",
  },
  {
    area_id: "D005",
    area_name: "금광1동",
    district: "중원구",
    x: 39,
    y: 47,
    lat: 37.448,
    lng: 127.161,
    population: 25360,
    elderly_ratio: 22,
    single_ratio: 34,
    care_demand: 70,
    medical_score: 52,
    pharmacy_score: 60,
    transit_score: 58,
    care_score: 49,
    overall_score: 54.5,
    vulnerable_index: 72,
    selection_note: "중원구 주거 밀집권으로 의료·돌봄 편차 확인",
  },
  {
    area_id: "D006",
    area_name: "상대원1동",
    district: "중원구",
    x: 57,
    y: 43,
    lat: 37.436,
    lng: 127.169,
    population: 19010,
    elderly_ratio: 24,
    single_ratio: 33,
    care_demand: 75,
    medical_score: 56,
    pharmacy_score: 61,
    transit_score: 52,
    care_score: 47,
    overall_score: 53.6,
    vulnerable_index: 76,
    selection_note: "산업·주거 혼합권으로 교통·돌봄 보완 필요",
  },
  {
    area_id: "D007",
    area_name: "서현1동",
    district: "분당구",
    x: 31,
    y: 68,
    lat: 37.385,
    lng: 127.124,
    population: 26840,
    elderly_ratio: 13,
    single_ratio: 25,
    care_demand: 38,
    medical_score: 85,
    pharmacy_score: 78,
    transit_score: 82,
    care_score: 76,
    overall_score: 80.8,
    vulnerable_index: 45,
    selection_note: "접근성 양호 지역으로 격차 비교 기준점",
  },
  {
    area_id: "D008",
    area_name: "야탑3동",
    district: "분당구",
    x: 51,
    y: 63,
    lat: 37.409,
    lng: 127.138,
    population: 24120,
    elderly_ratio: 16,
    single_ratio: 31,
    care_demand: 57,
    medical_score: 73,
    pharmacy_score: 74,
    transit_score: 68,
    care_score: 62,
    overall_score: 69,
    vulnerable_index: 58,
    selection_note: "분당 중부 생활권의 교통·일상서비스 표본",
  },
  {
    area_id: "D009",
    area_name: "정자동",
    district: "분당구",
    x: 70,
    y: 58,
    lat: 37.391,
    lng: 127.098,
    population: 30890,
    elderly_ratio: 11,
    single_ratio: 22,
    care_demand: 34,
    medical_score: 70,
    pharmacy_score: 68,
    transit_score: 75,
    care_score: 55,
    overall_score: 67.3,
    vulnerable_index: 40,
    selection_note: "신도시 생활권의 서비스 밀도·돌봄 편차 비교",
  },
  {
    area_id: "D010",
    area_name: "구미동",
    district: "분당구",
    x: 66,
    y: 81,
    lat: 37.34,
    lng: 127.121,
    population: 21870,
    elderly_ratio: 19,
    single_ratio: 28,
    care_demand: 63,
    medical_score: 64,
    pharmacy_score: 67,
    transit_score: 61,
    care_score: 52,
    overall_score: 60.6,
    vulnerable_index: 63,
    selection_note: "분당 남부 경계의 돌봄·이동 접근성 점검",
  },
];

const pointFallback: ServicePoint[] = [
  { service_type: "medical", lat: 37.438, lng: 127.136, name: "수정 열린의원", district: "수정구", area_name: "수진2동" },
  { service_type: "medical", lat: 37.447, lng: 127.158, name: "중원 동네의원", district: "중원구", area_name: "금광1동" },
  { service_type: "medical", lat: 37.385, lng: 127.123, name: "분당권 병원", district: "분당구", area_name: "서현1동" },
  { service_type: "pharmacy", lat: 37.445, lng: 127.126, name: "태평 약국", district: "수정구", area_name: "태평1동" },
  { service_type: "pharmacy", lat: 37.457, lng: 127.166, name: "은행 약국", district: "중원구", area_name: "은행2동" },
  { service_type: "pharmacy", lat: 37.341, lng: 127.122, name: "구미 약국", district: "분당구", area_name: "구미동" },
  { service_type: "bus", lat: 37.437, lng: 127.14, name: "수진역 정류장", district: "수정구", area_name: "수진2동" },
  { service_type: "bus", lat: 37.434, lng: 127.169, name: "상대원 정류장", district: "중원구", area_name: "상대원1동" },
  { service_type: "bus", lat: 37.394, lng: 127.111, name: "정자동 정류장", district: "분당구", area_name: "정자동" },
  { service_type: "care", lat: 37.456, lng: 127.164, name: "은행 돌봄센터", district: "중원구", area_name: "은행2동" },
  { service_type: "care", lat: 37.435, lng: 127.17, name: "상대원 돌봄센터", district: "중원구", area_name: "상대원1동" },
  { service_type: "care", lat: 37.341, lng: 127.121, name: "구미 돌봄센터", district: "분당구", area_name: "구미동" },
];

function csvPath(fileName: string) {
  return path.join(process.cwd(), "data", fileName);
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function readCsvObjects(fileName: string) {
  const fullPath = csvPath(fileName);
  if (!existsSync(fullPath)) return [];
  const [headers, ...rows] = parseCsv(readFileSync(fullPath, "utf8"));
  if (!headers) return [];
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), row[index]?.trim() ?? ""])),
  );
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isValidCoordinate(lat: number, lng: number) {
  return lat >= 37.3 && lat <= 37.5 && lng >= 127.05 && lng <= 127.2;
}

const scoreFieldLabels: Record<string, string> = {
  medical_score: "의료 점수",
  pharmacy_score: "약국 점수",
  transit_score: "교통 점수",
  care_score: "돌봄 점수",
};

function scoreIssue(areaName: string, key: string, value: number): DataIssue | null {
  if (value >= 0 && value <= 100) return null;
  return { severity: "warning", message: `${areaName} ${scoreFieldLabels[key] ?? key} 확인 필요` };
}

function defaultOverall(medical: number, pharmacy: number, transit: number, care: number) {
  return (
    medical * DEFAULT_WEIGHTS.medical_score +
    pharmacy * DEFAULT_WEIGHTS.pharmacy_score +
    transit * DEFAULT_WEIGHTS.transit_score +
    care * DEFAULT_WEIGHTS.care_score
  );
}

export function calculateWeightedScore(
  area: AreaMetric,
  weights: Record<"medical_score" | "pharmacy_score" | "transit_score" | "care_score", number>,
) {
  return (
    area.medical_score * weights.medical_score +
    area.pharmacy_score * weights.pharmacy_score +
    area.transit_score * weights.transit_score +
    area.care_score * weights.care_score
  );
}

export function loadDashboardData(scenario: LoadScenario = "normal"): DashboardData {
  if (scenario === "empty") {
    return {
      areas: [],
      points: [],
      issues: [{ severity: "info", message: "표시할 CSV 데이터가 없습니다." }],
      source: "empty",
    };
  }

  if (scenario === "error") {
    return {
      areas: [],
      points: [],
      issues: [{ severity: "error", message: "좌표 또는 점수 오류가 있습니다." }],
      source: "error",
    };
  }

  const areaRows = readCsvObjects("accessibility_metrics.csv");
  const pointRows = readCsvObjects("service_points.csv");
  const issues: DataIssue[] = [];

  const areas =
    areaRows.length > 0
      ? areaRows.flatMap((row): AreaMetric[] => {
          const medical = numberValue(row.medical_score);
          const pharmacy = numberValue(row.pharmacy_score);
          const transit = numberValue(row.transit_score);
          const care = numberValue(row.care_score);
          const lat = numberValue(row.lat, Number.NaN);
          const lng = numberValue(row.lng, Number.NaN);
          const areaName = String(row.area_name || "이름 없음");
          const areaIssues = [
            scoreIssue(areaName, "medical_score", medical),
            scoreIssue(areaName, "pharmacy_score", pharmacy),
            scoreIssue(areaName, "transit_score", transit),
            scoreIssue(areaName, "care_score", care),
          ].filter((issue): issue is DataIssue => Boolean(issue));

          if (!areaName || !isValidCoordinate(lat, lng)) {
            issues.push({ severity: "error", message: `${areaName} 좌표 제외` });
            return [];
          }

          issues.push(...areaIssues);

          return [{
            area_id: String(row.area_id),
            area_name: areaName,
            district: String(row.district),
            x: numberValue(row.x),
            y: numberValue(row.y),
            lat,
            lng,
            population: numberValue(row.population),
            elderly_ratio: numberValue(row.elderly_ratio),
            single_ratio: numberValue(row.single_ratio),
            care_demand: numberValue(row.care_demand),
            medical_score: medical,
            pharmacy_score: pharmacy,
            transit_score: transit,
            care_score: care,
            overall_score: numberValue(row.overall_score, defaultOverall(medical, pharmacy, transit, care)),
            vulnerable_index: numberValue(row.vulnerable_index),
            selection_note: String(row.selection_note || "고령·1인가구·접근성 편차 기준 대표 동"),
          }];
        })
      : areaFallback;

  const points =
    pointRows.length > 0
      ? pointRows.flatMap((row): ServicePoint[] => {
          const serviceType = String(row.service_type) as ServicePoint["service_type"];
          const lat = numberValue(row.lat, Number.NaN);
          const lng = numberValue(row.lng, Number.NaN);

          if (!["medical", "pharmacy", "bus", "care"].includes(serviceType) || !isValidCoordinate(lat, lng)) {
            issues.push({ severity: "warning", message: `${String(row.name || "서비스 위치")} 제외` });
            return [];
          }

          return [{
            service_type: serviceType,
            lat,
            lng,
            name: String(row.name),
            district: String(row.district),
            area_name: String(row.area_name),
          }];
        })
      : pointFallback;

  if (areaRows.length === 0) {
    issues.push({ severity: "info", message: "대표 표본 데이터를 표시 중입니다." });
  }

  return {
    areas,
    points,
    issues,
    source: areaRows.length > 0 ? "csv" : "sample",
  };
}
