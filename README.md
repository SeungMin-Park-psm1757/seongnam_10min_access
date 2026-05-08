# 성남 10분 생활필수 접근권 격차 지도

## 실행 링크

- 제출용 v2: [https://seungmin-park-psm1757.github.io/seongnam_10min_access/v2/](https://seungmin-park-psm1757.github.io/seongnam_10min_access/v2/)
- 기존 보존 v1: [https://seungmin-park-psm1757.github.io/seongnam_10min_access/v1/](https://seungmin-park-psm1757.github.io/seongnam_10min_access/v1/)
- 기본 화면: [https://seungmin-park-psm1757.github.io/seongnam_10min_access/](https://seungmin-park-psm1757.github.io/seongnam_10min_access/)

성남시 생활필수 서비스가 단순히 존재하는지보다 시민이 실제로 이용하기 쉬운지를 비교하는 공모전 제출용 정책 시각화 대시보드입니다. 의료, 약국, 교통, 돌봄 접근성을 종합해 생활권별 격차와 정책 보완 방향을 제시합니다.

## 버전

- `/v1`: 기능 검증용 기존 버전입니다. 현재 상태는 Git 커밋 `v1: current dashboard before design refresh`와 태그 `v1-current`로 보존했습니다.
- `/v2`: 제출용 디자인 개선본입니다. 정보 구조와 기능은 유지하고 타이포그래피, 여백, 지도 명도, 카드 위계를 개선했습니다.
- `/`: 기본 진입 경로이며 v2와 동일한 화면을 보여줍니다.

v1은 기능 검증용, v2는 제출용 디자인 개선본입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`을 엽니다.

Google Drive 동기화 폴더에서 `node_modules` 또는 `.next` 잠금 문제가 생기면 로컬 실행 스크립트를 사용할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-local.ps1 -Port 3100
```

## 데이터 교체 방법

- 현재 데이터는 성남시·공공데이터포털 공개 CSV를 내려받아 `scripts/prepare-official-data.py`로 재산출했습니다.
- 산출 파일은 `data/accessibility_metrics.csv`와 `data/service_points.csv`입니다.
- 의료·약국·인구·1인가구·노인복지관은 성남시·공공데이터포털 공개 파일 기반입니다.
- 교통은 경기교통정보센터 성남시 정류소 집계와 OpenStreetMap 실제 버스정류장 좌표를 결합해 재산출했습니다.
- 민간 통신·카드 집계, 보행 네트워크 데이터가 추가되면 같은 컬럼 구조로 지표를 다시 계산할 수 있습니다.

```bash
python scripts/prepare-official-data.py
```

## 캡처

```bash
npm run capture
```

기본 산출물은 `screenshots/{viewport}` 폴더에 저장됩니다. v1/v2 비교 캡처는 환경변수로 경로를 나누어 실행할 수 있습니다.

```powershell
$env:APP_URL="http://127.0.0.1:3000/v1"; $env:SCREENSHOT_DIR="screenshots/v1-before"; npm run capture
$env:APP_URL="http://127.0.0.1:3000/v2"; $env:SCREENSHOT_DIR="screenshots/v2-after"; npm run capture
```

캡처 해상도는 `1920x1080`, `1600x900`, `1366x768`, `1280x720`입니다.

## 문서

- `docs/v1_design_review.md`: v1 디자인 평가
- `docs/design_v2_notes.md`: v2 디자인 변경 이유와 전후 포인트
- `docs/v1_v2_comparison.md`: v1/v2 접근 경로와 차이
- `docs/DATA_METHODOLOGY.md`: 데이터 산정 방식
- `docs/policy_actions.md`: 정책 보완 방향

## 주요 기술

- Next.js 16
- React 19
- TypeScript
- MapLibre GL
- Tailwind CSS
- Playwright
