# Design System Rules — Do's & Don'ts

## Do's ✅

- **여백을 구조 요소로 사용한다.** 확신이 없으면 여백을 늘린다.
- **서피스 계층 전환**으로 영역을 구분한다 (사이드바 배경 ≠ 메인 배경).
- **사이드바 Selected 상태**는 `surface_container_highest` (#dbe4e7)로 표현한다.
- **`tertiary` 액센트**는 CTA(의도적 액션)에만 단독으로 사용한다.
- **`label-md`** 텍스트는 항상 UPPERCASE + letter-spacing 0.05em으로 렌더링한다.
- **본문 장문**은 `on_surface_variant` (#586064)를 사용해 눈의 피로를 줄인다.
- **Inter** 폰트만 사용한다.
- **Glassmorphism**은 실제로 떠있는 플로팅 요소(모달, 드롭다운)에만 적용한다.
- **Ghost Border**는 접근성 대응이 꼭 필요한 경우에만 `outline_variant` 15% opacity로 사용한다.
- **Ambient Shadow**는 `blur: 24~40px`, `opacity: 6%`를 지킨다.

## Don'ts ❌

- **순수 검정(#000000) 텍스트 사용 금지** → `on_surface` (#2b3437)를 사용한다.
- **1px solid border로 영역 분리 금지** → 배경색 전환으로만 구분한다.
- **사이드바와 메인 영역 사이 border 금지** → `surface_container_low` ↔ `surface` 색상 차이만 사용한다.
- **기본 box-shadow 사용 금지** — 표준 카드에는 그림자를 쓰지 않는다. Ambient Shadow 규격을 따른다.
- **목록 항목 사이 divider(구분선) 사용 금지** → `spacing.4` 간격만으로 구분한다.
- **기능적 명확성 없는 아이콘 사용 금지** — 이 시스템은 타이포그래피 중심이다.
- **`tertiary` 액센트를 장식 목적으로 남용 금지** — 버튼, 포커스 링, 핵심 링크에만 사용한다.
- **`surface_container_lowest` (#ffffff)를 배경 캔버스로 사용 금지** — 최상위 카드 레이어에만 예약되어 있다.
- **Tailwind 기본 색상 클래스 직접 사용 금지** (e.g., `bg-white`, `text-black`) → 디자인 토큰 색상값으로 커스텀 클래스를 정의해서 사용한다.
