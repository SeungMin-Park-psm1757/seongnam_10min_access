# 성남 10분 생활필수 접근권 격차 지도

성남시 생활필수 서비스가 단순히 존재하는지를 넘어, 시민이 실제로 이용하기 쉬운지를 비교하는 공모전 제출용 정책 대시보드입니다. 의료·약국·교통·돌봄 접근성을 종합해 우선 점검 생활권과 정책 보완 방향을 제시합니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`을 엽니다.

Google Drive 동기화 폴더에서 `node_modules` 또는 `.next` 파일 잠금 문제가 생기면 임시 로컬 폴더 실행 방식을 사용합니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-local.ps1 -Port 3100
```

## 데이터 교체 방법

- 기본 데이터는 `data/accessibility_metrics.csv`와 `data/service_points.csv`를 사용합니다.
- 같은 컬럼 구조로 CSV를 교체하면 화면과 지표가 그대로 갱신됩니다.
- 현재 구조는 CSV 교체 방식으로 데이터 갱신이 가능합니다.
- 행정동·격자·권역 단위 데이터로 확장할 수 있습니다.
- 추가 민간 통신·카드 집계 데이터가 제공되면 지원수요와 이용 강도 지표를 재산출할 수 있습니다.
- 정책 담당자가 최신 공공데이터를 주기적으로 교체해 같은 산식으로 반복 활용할 수 있습니다.

## 캡처 생성 방법

서버를 켠 뒤 실행합니다.

```bash
npm run capture
```

생성물은 `screenshots/{viewport}` 폴더에 저장됩니다.

캡처 항목:

- `01_first_screen.png`
- `02_map_screen.png`
- `03_service_screen.png`
- `04_scatter_screen.png`
- `05_policy_screen.png`
- `06_methodology_modal.png`

Playwright 브라우저가 없다면 한 번만 실행합니다.

```bash
npx playwright install chromium
```

## 사용 라이브러리

- Next.js 16
- React 19
- TypeScript
- MapLibre GL
- Tailwind CSS
- Playwright

## 주요 파일 구조

```text
src/                         Next.js 앱, 지도, 차트, 정책 카드 컴포넌트
data/                        CSV 교체형 입력 데이터
docs/                        발표자료/PDF용 문서 초안
screenshots/                 Playwright 캡처 결과
playwright/                  제출 검수 안내
scripts/                     캡처, QA, 시연영상 스크립트
README.md                    실행·교체·캡처 안내
METHODOLOGY.md               분석 방법론 요약
DATA_SOURCES.md              데이터 출처 요약
LIMITATIONS.md               한계와 확장 요약
SLIDE_OUTLINE.md             발표자료 구성안
```

## 접근성

- 지도와 산점도에 `aria-label`, 설명 텍스트, 키보드 포커스를 제공합니다.
- 색상만으로 구분하지 않고 범례명, 점수, 동 이름, 정책 유형 라벨을 함께 제공합니다.
- 발표 모드에서는 지도 컨트롤과 불필요한 인터랙션 안내를 숨깁니다.
