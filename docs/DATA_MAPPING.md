# 데이터 매핑 문서

이 앱은 `data/` 폴더의 CSV를 서버에서 읽어 대시보드를 렌더링한다. 현재 CSV는 `scripts/prepare-official-data.py`로 공식 공개 파일을 전처리해 생성했다.

## `data/accessibility_metrics.csv`

| 컬럼 | 의미 |
| --- | --- |
| `area_id` | 대표 생활권 고유 ID |
| `area_name` | 표시 이름 |
| `district` | 구 이름 |
| `x`, `y` | 버블·행렬 등 보조 시각화 배치용 좌표 |
| `lat`, `lng` | 지도에 표시할 대표 동 중심 좌표 |
| `population` | 공식 인구 CSV의 동별 인구 |
| `elderly_ratio` | 65세 이상 인구 비율 |
| `single_ratio` | 1인세대 비율 |
| `care_demand` | 고령층, 1인세대, 고령 1인세대를 결합한 지원수요 지표 |
| `medical_score` | 동별 의료기관 수를 0~100 범위로 표준화한 접근성 점수 |
| `pharmacy_score` | 동별 약국 수를 0~100 범위로 표준화한 접근성 점수 |
| `transit_score` | 실제 버스정류장 좌표와의 거리 기반 교통 접근 점수 |
| `care_score` | 가장 가까운 노인복지관까지의 거리 기반 돌봄 접근 점수 |
| `overall_score` | 의료 0.3, 약국 0.2, 교통 0.25, 돌봄 0.25 가중 종합 점수 |
| `vulnerable_index` | 고령층·1인세대·지원수요를 결합한 취약성 지표 |
| `selection_note` | 원천 데이터 기반 해석 메모 |

## `data/service_points.csv`

| 컬럼 | 의미 |
| --- | --- |
| `service_type` | `medical`, `pharmacy`, `bus`, `care` 중 하나 |
| `lat`, `lng` | 서비스 거점 좌표 |
| `name` | 서비스 거점명 |
| `district` | 구 이름 |
| `area_name` | 대표 동과 연결되는 경우 동 이름 |

## `data/processed/accessibility_metrics_audit.csv`

| 컬럼 | 의미 |
| --- | --- |
| `medical_count` | 대표 동 주소 문자열에 매핑된 의료기관 수 |
| `pharmacy_count` | 대표 동 주소 문자열에 매핑된 약국 수 |
| `nearest_care_distance_km` | 대표 동 중심점에서 가장 가까운 노인복지관까지의 직선거리 |
| `nearest_bus_stop_distance_km` | 대표 동 중심점에서 가장 가까운 버스정류장까지의 직선거리 |
| `overall_score` | 화면에 표시되는 종합 접근성 점수 |

## `data/processed/data_manifest.json`

전처리 산출물의 기준을 기록하는 메타데이터 파일이다. 원천 파일명, 기준시점, 출처 URL, 원천 행 수, 산출 일자, 가중치, 점수 구간, 해석상 주의사항을 포함한다.

## 전처리 메모

- 의료기관·약국은 공공데이터포털 CSV 주소의 구·법정동 문자열을 기준으로 대표 동에 매핑했다.
- 의료기관·약국 좌표는 도로명주소를 Nominatim으로 지오코딩해 생성했다. 지오코딩 실패 주소는 같은 동 후보 중 다음 주소를 사용했다.
- 노인복지관은 공공데이터포털 CSV의 시설 목록을 쓰고, 성남시 복지시설 좌표 PDF로 좌표를 보정했다.
- 교통은 OpenStreetMap에서 내려받은 실제 버스정류장 좌표와 대표 동 중심점의 거리를 기준으로 산정했다.
- 앱은 위도/경도가 성남시 주변 범위에서 벗어나거나 서비스 유형이 맞지 않는 행을 제외하고 데이터 상태 배너에 표시한다.

## 갱신 방법

```bash
python scripts/prepare-official-data.py
```

원천 CSV를 같은 파일명으로 갱신한 뒤 위 스크립트를 다시 실행하면 `data/accessibility_metrics.csv`와 `data/service_points.csv`가 재생성된다.
동시에 `data/processed/accessibility_metrics_audit.csv`와 `data/processed/data_manifest.json`도 함께 갱신된다.
