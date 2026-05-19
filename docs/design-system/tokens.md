# Design Tokens

## 서피스 계층 (Surface Hierarchy)

배경색 전환으로만 영역을 구분한다. 1px solid border는 사용하지 않는다.

| 토큰명                      | 색상값    | 용도                                             |
| --------------------------- | --------- | ------------------------------------------------ |
| `surface_container_lowest`  | `#ffffff` | 카드, 활성 작업 영역 — 가장 위에 "떠있는" 레이어 |
| `surface`                   | `#f8f9fa` | 기본 캔버스 (페이지 배경)                        |
| `surface_container_low`     | `#f1f4f6` | 사이드바, 내비게이션 배경                        |
| `surface_container`         | `#eaeff1` | 섹션 구분 배경                                   |
| `surface_container_high`    | `#e2e9ec` | Secondary 버튼 배경                              |
| `surface_container_highest` | `#dbe4e7` | Knowledge Token(Chip), 사이드바 Selected 상태    |

**레이어링 예시:**

```
페이지 배경 (#f8f9fa)
  └── 사이드바 (#f1f4f6)
        └── 선택된 항목 (#dbe4e7)
  └── 메인 섹션 (#eaeff1)
        └── 카드 / 입력 영역 (#ffffff)
```

## 텍스트 색상

| 토큰명               | 색상값    | 용도                  |
| -------------------- | --------- | --------------------- |
| `on_surface`         | `#2b3437` | 제목, 강조 텍스트     |
| `on_surface_variant` | `#586064` | 본문 장문, 메타데이터 |
| `on_tertiary`        | `#faf8ff` | Primary 버튼 텍스트   |

## 액센트 색상

| 토큰명               | 색상값    | 용도                                  |
| -------------------- | --------- | ------------------------------------- |
| `tertiary`           | `#0053dc` | CTA 전용 액센트 (절제해서 사용)       |
| `tertiary_container` | `#3e76fe` | Primary 버튼 그라디언트 끝 색상       |
| `outline_variant`    | `#abb3b7` | Ghost Border (opacity 15%에서만 사용) |

## Spacing

기본 리듬 단위: **1.4rem (spacing.4)**

| 토큰         | 값      | 용도                            |
| ------------ | ------- | ------------------------------- |
| `spacing.1`  | 0.35rem | 레이블 ↔ 입력창 간격            |
| `spacing.2`  | 0.7rem  | 헤드라인 ↔ 본문 간격            |
| `spacing.4`  | 1.4rem  | 목록 항목 간 기본 간격          |
| `spacing.10` | 3.5rem  | 주요 레이아웃 블록 간 섹션 간격 |

## Glass & Gradient 규칙

- **Glassmorphism (플로팅 요소):** `surface` (#f8f9fa) 80% opacity + `backdrop-filter: blur(12px)`
- **Primary CTA 그라디언트:** `tertiary` → `tertiary_container` (linear-gradient)
