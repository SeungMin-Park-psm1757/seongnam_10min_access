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
| `transit_score` | 버스공영차고지 거리 기반 교통 대리 점수 |
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

## 전처리 메모

- 의료기관·약국은 공공데이터포털 CSV 주소의 구·법정동 문자열을 기준으로 대표 동에 매핑했다.
- 의료기관·약국 좌표는 도로명주소를 Nominatim으로 지오코딩해 생성했다. 지오코딩 실패 주소는 같은 동 후보 중 다음 주소를 사용했다.
- 노인복지관은 공공데이터포털 CSV의 시설 목록을 쓰고, 성남시 복지시설 좌표 PDF로 좌표를 보정했다.
- 교통은 버스정류장 전수 좌표가 아니라 공영차고지 거리 기반 대리 점수다. 정류장 좌표 확보 시 `transit_score`를 재산출해야 한다.
- 앱은 위도/경도가 성남시 주변 범위에서 벗어나거나 서비스 유형이 맞지 않는 행을 제외하고 데이터 상태 배너에 표시한다.

## 갱신 방법

```bash
python scripts/prepare-official-data.py
```

원천 CSV를 같은 파일명으로 갱신한 뒤 위 스크립트를 다시 실행하면 `data/accessibility_metrics.csv`와 `data/service_points.csv`가 재생성된다.
