# DATA_SOURCES

- 상세 출처 표는 `docs/data_sources.md`와 `docs/02_data_sources_and_preprocessing.md`를 기준으로 한다.
- 실제 반영 데이터: 성남시 의료기관, 약국, 노인종합복지관, 행정동별 인구·세대, 1인세대 공개 CSV와 실제 버스정류장 좌표
- 좌표 보정: 의료·약국은 주소 지오코딩, 노인복지관은 성남시 복지시설 좌표 PDF
- 교통: 경기교통정보센터 성남시 정류소 집계와 OpenStreetMap 버스정류장 좌표를 함께 사용
- 추가 민간데이터 제공 시 통신·카드 집계 데이터로 지표 재산출 가능
