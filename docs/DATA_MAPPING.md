# 데이터 매핑 문서

이 앱은 `data/` 폴더의 CSV를 서버에서 읽어 대시보드를 렌더링한다. 실제 공공데이터 파일명이 확정되면 아래 표준 컬럼으로 전처리한 뒤 같은 파일명으로 교체하면 된다.

## `data/accessibility_metrics.csv`

| 컬럼 | 의미 |
| --- | --- |
| `area_id` | 동 또는 분석 격자의 고유 ID |
| `area_name` | 표시 이름 |
| `district` | 구 이름 |
| `x`, `y` | 버블·행렬 등 보조 시각화 배치용 예비 좌표 |
| `lat`, `lng` | MapLibre 기반 성남 지도에 표시할 동 중심 좌표 |
| `population` | 인구 규모 |
| `elderly_ratio` | 65세 이상 비율 |
| `single_ratio` | 1인 가구 비율 |
| `care_demand` | 돌봄 수요 대리 지표 |
| `medical_score` | 의료기관 10분 접근 점수 |
| `pharmacy_score` | 약국 10분 접근 점수 |
| `transit_score` | 대중교통 10분 접근 점수 |
| `care_score` | 돌봄·복지 거점 10분 접근 점수 |
| `overall_score` | 의료 0.3, 약국 0.2, 교통 0.25, 돌봄 0.25 가중 종합 점수 |
| `vulnerable_index` | 취약계층 중첩 지수 |

## `data/service_points.csv`

| 컬럼 | 의미 |
| --- | --- |
| `service_type` | `medical`, `pharmacy`, `bus`, `care` 중 하나 |
| `lat`, `lng` | 원본 생활서비스 거점 좌표 |
| `name` | 생활서비스 거점명 |
| `district` | 구 이름 |
| `area_name` | 연결할 동 이름 |

## 지도 메모

- 지도는 `MapLibre GL`과 OpenStreetMap raster tile을 사용한다.
- 동 경계 GeoJSON이 준비되면 현재 동 중심 원형 레이어를 행정동 polygon choropleth로 교체할 수 있다.
- 현재 원형은 실제 좌표 위에 올린 10분 접근권 상대 범위이며, 생활서비스 마커는 `service_points.csv` 좌표를 그대로 사용한다.
- 앱은 위도/경도가 성남시 주변 범위에서 벗어나거나 서비스 유형이 맞지 않는 행을 제외하고 데이터 상태 배너에 표시한다.
- 검토용 상태는 `/?scenario=empty`, `/?scenario=error`에서 확인할 수 있다.

## 산식 메모

- 서비스별 점수는 10분 안 접근 가능성을 0~100으로 표준화한다.
- 네트워크 시간이 있으면 시간 기반, 없으면 같은 기준의 근접도·버퍼 지표로 대체한다.
- 정책 우선순위는 `(100 - 종합접근점수) * 0.6 + 취약계층중첩지수 * 0.4`로 정렬한다.
- 화면 문구는 절대적 결핍이 아니라 상대 격차와 보완 우선순위를 설명하도록 제한한다.
