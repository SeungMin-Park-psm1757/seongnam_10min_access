# 07. 소스코드와 접근성

- 프레임워크: Next.js, React, TypeScript
- 지도: MapLibre GL, OpenStreetMap 배경지도
- 캡처: Playwright 기반 자동 캡처 스크립트
- 데이터 구조: `data/accessibility_metrics.csv`, `data/service_points.csv` 교체형 구조
- 주요 코드: `src/app/page.tsx`, `src/components/AccessMap.tsx`, `src/components/NeedAccessExplorer.tsx`
- 접근성 보완: 지도와 산점도에 `aria-label`, 설명 텍스트, 키보드 포커스 제공
- 색상 보완: 색상뿐 아니라 범례명, 점수 라벨, 유형명, 숫자 정보를 함께 제공
- 색각 대응: 정책지도형 저채도 팔레트와 명도 차이를 확보하고 텍스트 라벨을 병행
- 키보드 이동: 네비게이션, 민감도 버튼, 산정 방식 모달, 산점도 버튼을 키보드로 접근 가능
- 발표 모드: 불필요한 지도 컨트롤과 인터랙션 안내를 숨겨 발표 캡처에 집중
