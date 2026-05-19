# Design System — The Digital Atelier

> 이 디렉토리는 노트 앱의 모든 스타일 작업 기준이 되는 디자인 시스템 문서다.
> 스타일 작업 시 `design-system` 스킬이 자동으로 이 파일들을 로드한다.

---

## 철학: The Curated Archive

**Soft Minimalism** + **Intentional Asymmetry** 원칙을 따른다.
콘텐츠를 테두리 박스에 가두지 않고, 세련된 뉴트럴 톤의 레이어 위에 부유하게 한다.
타이포그래피가 숨 쉬고, 정보가 주인공이 된다.

---

## 파일 구조

| 파일                               | 내용                       | 참조 시점                      |
| ---------------------------------- | -------------------------- | ------------------------------ |
| [`tokens.md`](./tokens.md)         | 색상·서피스·간격 토큰 전체 | CSS 변수 설정, Tailwind config |
| [`typography.md`](./typography.md) | 타이포그래피 스케일        | 텍스트·폰트 스타일링           |
| [`components.md`](./components.md) | 버튼·카드·Input·Chip 패턴  | UI 컴포넌트 작업               |
| [`rules.md`](./rules.md)           | Do/Don't 전체 목록         | 코드 리뷰, 스타일 검수         |

---

## 핵심 원칙 (빠른 참조)

- **No-Line Rule**: border 금지, 배경색 전환으로만 영역 구분
- **Tonal Layering**: `#ffffff` → `#f8f9fa` → `#f1f4f6` → `#eaeff1` → `#dbe4e7` 5단계 계층
- **Accent 절제**: `#0053dc` (tertiary)는 CTA에만 사용
- **Typography-first**: Inter 단독, 아이콘 최소화
- **No default shadow**: Ambient Shadow (blur 24~40px, opacity 6%) 또는 Tonal Layering만 허용
