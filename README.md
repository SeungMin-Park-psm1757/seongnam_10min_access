# 성남 10분 생활필수 접근권 격차 지도

## 실행 링크

[홈페이지 바로가기](https://seungmin-park-psm1757.github.io/seongnam_10min_access/)

성남의 의료·약국·교통·돌봄 접근성을 생활권 단위로 비교해, 서비스가 “있는 곳”과 실제로 “닿기 쉬운 곳”의 차이를 보여주는 정책 시각화 대시보드입니다. 심사위원이 첫 화면에서 핵심 지표를 보고, 이어지는 화면에서 서비스별 격차와 정책 보완 방향을 확인할 수 있도록 구성했습니다.

## 핵심 결과

| 항목 | 결과 |
| --- | --- |
| 대표 생활권 평균 접근성 | 70점 |
| 서비스별 평균 | 의료 67점, 약국 71점, 교통 73점, 돌봄 71점 |
| 우선 점검 생활권 | 태평1동, 수진2동, 은행2동, 상대원1동, 구미동 |
| 의료·의약 보완 후보 | 수진2동, 복정동, 은행2동, 상대원1동 |
| 이동 접근 보완 후보 | 금광1동, 정자동 |
| 돌봄 접근 보완 후보 | 태평1동, 서현1동, 야탑3동, 구미동 |

해석의 중심은 “정보를 줄이는 것”이 아니라, 서비스별 차이와 지원수요가 겹치는 지점을 더 읽기 쉽게 드러내는 것입니다. 정책 제안은 단일 순위가 아니라 의료 접근, 이동 접근, 돌봄 접근, 복합 점검이라는 유형별 보완 방향으로 제시합니다.

## 데이터 기준

현재 화면은 가상 데이터가 아니라 공개 원천자료를 내려받아 `scripts/prepare-official-data.py`로 재산출한 CSV를 사용합니다.

- 산출 데이터: `data/accessibility_metrics.csv`, `data/service_points.csv`
- 감사용 산출물: `data/processed/accessibility_metrics_audit.csv`
- 데이터 메타데이터: `data/processed/data_manifest.json`
- 주요 출처: 공공데이터포털 성남시 의료기관·약국·노인종합복지관·인구·1인세대 현황, 경기교통정보센터 버스정류소 현황, OpenStreetMap 버스정류장 좌표

현재 점수는 위치 기반 근사 접근성입니다. 보행 네트워크, 경사, 횡단 여건, 실제 이동시간 데이터가 추가되면 10분 도달성 지표로 확장할 수 있습니다.

## 화면 구성

1. 한눈에 보기: 종합 접근성, 지도, 우선 점검 생활권
2. 무엇이 부족한가: 의료·약국·교통·돌봄별 접근성 비교
3. 어디가 우선인가: 접근 어려움과 지원수요의 중첩 확인
4. 어떻게 보완할까: 데이터 진단과 정책 보완 방향 연결

기존 보존 화면은 [보존 경로](https://seungmin-park-psm1757.github.io/seongnam_10min_access/v1/)에서 확인할 수 있습니다.

## 재현 방법

```bash
npm install
python scripts/prepare-official-data.py
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`을 엽니다.

Google Drive 동기화 폴더에서 `node_modules` 또는 `.next` 잠금 문제가 생기면 로컬 실행 스크립트를 사용할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-local.ps1 -Port 3100
```

## 캡처와 검수

```bash
npm run capture
node scripts/capture-v2-report.mjs
```

기본 화면 캡처는 `screenshots/{viewport}`에 저장됩니다. 발표용 PDF와 화면별 캡처는 `public/reports/` 아래에 생성됩니다. 캡처 manifest에는 캡처 URL, viewport, 생성 시각, 커밋 해시가 함께 기록됩니다.

## 문서

- `docs/data_sources.md`: 원천 데이터와 출처 URL
- `docs/DATA_MAPPING.md`: CSV 컬럼과 전처리 방식
- `docs/real_data_refresh_execution_prompt.md`: 실제 데이터 갱신 실행 프롬프트
- `docs/design_v2_notes.md`: 디자인 변경 이유와 전후 포인트
- `docs/v1_v2_comparison.md`: 기존 화면과 개선 화면 비교
- `docs/notebooklm_page_update_prompts.md`: 발표자료 페이지별 수정 프롬프트

## 주요 기술

- Next.js 16
- React 19
- TypeScript
- MapLibre GL
- Tailwind CSS
- Playwright
