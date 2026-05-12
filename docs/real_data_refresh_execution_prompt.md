# 실제 데이터 갱신 실행 프롬프트

아래 프롬프트는 최신 공개 데이터를 다시 내려받았을 때, 현재 대시보드의 수치와 캡처물을 일관되게 갱신하기 위한 실행 지시문이다.

```text
성남 10분 생활필수 접근권 격차 지도 프로젝트의 실제 데이터 갱신을 수행하라.

목표:
1. 원천 공개 데이터의 기준일과 출처 URL을 확인한다.
2. data/raw_official/의 원천 파일을 최신 파일로 교체한다.
3. python scripts/prepare-official-data.py를 실행해 다음 산출물을 재생성한다.
   - data/accessibility_metrics.csv
   - data/service_points.csv
   - data/processed/accessibility_metrics_audit.csv
   - data/processed/data_manifest.json
4. 산출값이 화면 수치와 일치하는지 검증한다.
   - 대표 생활권 평균 접근성
   - 의료, 약국, 교통, 돌봄 평균
   - 서비스별 부족 생활권 TOP 3
   - 산점도 선택 생활권의 종합 접근성, 접근 어려움, 지원수요
   - 정책 보완 유형별 생활권 목록
5. npm run lint와 npm run build를 실행한다.
6. node scripts/capture-v2-report.mjs를 실행해 발표용 캡처 PDF와 capture_manifest.json을 갱신한다.
7. README.md의 핵심 결과 표와 docs/notebooklm_page_update_prompts.md의 페이지별 수정 지시가 새 산출값과 일치하는지 확인한다.

주의:
- 가상 데이터를 보강하지 않는다.
- 원천 파일이 없거나 용량·접근 제한이 있으면 임의 대체하지 말고 제한 사항을 명시한다.
- 점수 산정 로직을 바꿀 때는 README, docs/DATA_MAPPING.md, 방법론 모달의 설명을 함께 갱신한다.
- “AI가 분석했다” 같은 표현은 쓰지 않고, 정책 보고서 문장으로 정리한다.
```

## 산출물 점검 기준

| 점검 항목 | 확인 방법 |
| --- | --- |
| 원천 데이터 기준일 | `data/processed/data_manifest.json`의 `sources` 확인 |
| 산출 수치 | `data/accessibility_metrics.csv`와 화면 KPI 비교 |
| 전처리 근거 | `data/processed/accessibility_metrics_audit.csv`의 원천 카운트·거리 확인 |
| 캡처 재현성 | `public/reports/v2-actual-data-captures/capture_manifest.json` 확인 |
| 발표자료 반영 | `docs/notebooklm_page_update_prompts.md`의 페이지별 지시 확인 |
