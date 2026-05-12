# 데이터 출처·산출 관리

이 프로젝트는 화면에 표시되는 점수와 정책 카드가 어떤 원천자료에서 왔는지 추적할 수 있도록, 전처리 단계에서 별도 산출물을 만든다.

## 산출 파일

| 파일 | 역할 |
| --- | --- |
| `data/accessibility_metrics.csv` | 화면의 생활권별 점수와 지원수요 지표 |
| `data/service_points.csv` | 지도에 표시하는 의료·약국·교통·돌봄 거점 |
| `data/processed/accessibility_metrics_audit.csv` | 점수 산정 전 원천 카운트, 거리, 수요 지표를 확인하는 감사용 표 |
| `data/processed/data_manifest.json` | 원천 파일명, 기준시점, 출처 URL, 행 수, 산출 일자, 가중치 기록 |

## 해석 기준

- `source_mode`가 `official_public_data`이면 공개 원천자료를 전처리한 산출값이다.
- `row_counts.areas`는 화면에 표시되는 대표 생활권 수를 뜻한다.
- `row_counts.service_points`는 지도 마커로 쓰인 서비스 거점 수를 뜻한다.
- `sources[].period`는 원천자료 기준시점 또는 다운로드 시점을 뜻한다.
- `notes`는 현재 분석의 한계와 추가 데이터 결합 시 확장 방향을 기록한다.

## 발표·심사 대응 문장

현재 대시보드는 성남시와 공공데이터포털 공개자료, 경기교통정보센터 정류소 정보, OpenStreetMap 정류장 좌표를 결합해 재산출한 결과를 사용한다. 점수는 위치 기반 근사 접근성 지표이며, 실제 보행 10분 도달성을 주장하려면 보행 네트워크와 이동시간 데이터가 추가되어야 한다.
