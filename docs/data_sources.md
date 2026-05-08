# 데이터 출처 및 매핑 구조

## 1. 현재 반영 상태

현재 `data/accessibility_metrics.csv`와 `data/service_points.csv`는 샘플 입력값이 아니라, 성남시·공공데이터포털 공개 파일을 내려받아 `scripts/prepare-official-data.py`로 재산출한 결과다. 다만 교통 지표는 버스정류장 전수 좌표를 확보하지 못해 성남시 버스공영차고지 위치를 사용한 대리 지표로 남겨 두었다.

## 2. 실제 내려받은 원천 파일

| 구분 | 원천 데이터 | 기준시점 | 로컬 파일 | 활용 |
|---|---|---:|---|---|
| 의료 | 성남시 의료기관 현황 | 2026-03-04 | `data/raw_official/seongnam_medical.csv` | 동별 의료기관 수와 대표 의료 거점 좌표 |
| 약국 | 성남시 약국 현황 | 2026-03-04 | `data/raw_official/seongnam_pharmacy.csv` | 동별 약국 수와 대표 약국 좌표 |
| 돌봄 | 성남시 노인종합복지관 현황 | 2025-06-05 | `data/raw_official/seongnam_senior_welfare.csv` | 노인복지관 목록 |
| 돌봄 좌표 보정 | 성남시 복지시설 좌표 PDF | 공개 PDF 기준 | `data/raw_official/seongnam_public_wifi_welfare_coordinates.pdf` | 노인복지관 위도·경도 보정 |
| 교통 | 성남시 버스공영차고지 현황 | 2025-08-19 | `data/raw_official/seongnam_bus_garage.csv` | 교통 기반시설 대리 거리 |
| 인구 | 성남시 행정동별 인구·세대 현황 | 2026-03-31 | `data/raw_official/seongnam_population_households.csv` | 인구, 고령층 비율, 세대 규모 |
| 1인가구 | 성남시 행정동별 1인세대 현황 | 2025-04-30 | `data/raw_official/seongnam_single_household.csv` | 1인가구·고령 1인가구 비율 |

## 3. 출처 URL

- 성남시 공공데이터 활용 시각화 경진대회 공고: https://seongnam.go.kr/city/1000052/30001/bbsView.do?idx=381551
- 성남시 경진대회 접수 페이지: https://www.seongnam.go.kr/apply/view.do?appIdx=3665
- 공모전 민간데이터 제공 폴더: https://drive.google.com/drive/folders/1velrGk8ptGAG9Jdps5GODECUNjPsOQm7?usp=sharing
- 공공데이터포털 성남시 의료기관 현황: https://www.data.go.kr/data/15000890/fileData.do
- 공공데이터포털 성남시 약국 현황: https://www.data.go.kr/data/15000848/fileData.do
- 공공데이터포털 성남시 노인종합복지관 현황: https://www.data.go.kr/data/15000901/fileData.do
- 공공데이터포털 성남시 버스공영차고지 현황: https://www.data.go.kr/data/15061124/fileData.do
- 공공데이터포털 성남시 인구 및 세대 현황: https://www.data.go.kr/data/15007386/fileData.do
- 공공데이터포털 성남시 1인세대 현황: https://www.data.go.kr/data/15061108/fileData.do
- 성남시 복지시설 좌표 PDF: https://www.seongnam.go.kr/contents/down/10458_6.pdf
- 성남데이터넷: https://data.seongnam.go.kr/
- 공공데이터포털: https://www.data.go.kr/

## 4. 전처리 방식

- 대표 생활권 10개 동은 기존 v2 정보 구조를 유지하되, 동별 인구·고령층·1인가구 값은 공식 CSV에서 읽었다.
- 의료기관과 약국은 도로명주소의 구·법정동 문자열을 기준으로 대표 동에 매핑했다.
- 의료·약국 대표 마커는 주소를 OpenStreetMap Nominatim으로 지오코딩하고, 지오코딩 실패 시 같은 동 안의 다음 후보 주소를 순차 확인했다.
- 노인복지관은 공공데이터포털 CSV의 시설 목록을 사용하고, 성남시 복지시설 좌표 PDF로 위도·경도를 보정했다.
- 교통은 버스정류장 위치 API 접근이 차단되어, 현재는 버스공영차고지까지의 거리를 교통 기반시설 대리 지표로 사용했다.

## 5. 해석상 주의

현재 결과는 “공식 공개 데이터 기반의 정책 시각화 프로토타입”이다. 실제 보행 10분 도달성 분석으로 주장하려면 버스정류장 전수 좌표, 보행 네트워크, 경사·횡단 여건, 실제 이동시간 데이터가 추가되어야 한다. 공모전 제공 민간 통신·카드 데이터는 출처와 활용 가능성을 확인했지만, 현재 앱 CSV에는 원자료가 직접 반영되지 않았다.
