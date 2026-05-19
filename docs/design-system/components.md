# Components

## 버튼

| 종류      | 배경                                         | 텍스트                  | Border | 모서리                    |
| --------- | -------------------------------------------- | ----------------------- | ------ | ------------------------- |
| Primary   | `tertiary` → `tertiary_container` 그라디언트 | `on_tertiary` (#faf8ff) | 없음   | `border-radius: 0.375rem` |
| Secondary | `surface_container_high` (#e2e9ec)           | `on_surface` (#2b3437)  | 없음   | `border-radius: 0.375rem` |
| Ghost     | 없음                                         | `tertiary` (#0053dc)    | 없음   | —                         |

- Ghost 버튼 hover: `tertiary` (#0053dc) 2% opacity 배경 적용

## 카드 & 목록

- 항목 간 구분선 금지 — `spacing.4` (1.4rem) 간격으로만 구분
- hover: 배경을 `surface` (#f8f9fa) → `surface_container_low` (#f1f4f6) 전환

## 입력 필드 (Input)

```
기본:  surface_container_lowest (#ffffff) 배경
       + Ghost Border (1px solid rgba(171,179,183,0.15))
포커스: 1px solid tertiary (#0053dc) 테두리로 전환
레이블: label-md 스타일, 입력창 위 spacing.1 (0.35rem) 간격
```

## Knowledge Token (Chip / 태그)

태그, 토픽 라벨에 사용하는 커스텀 칩:

```
배경:   surface_container_highest (#dbe4e7)
텍스트: on_surface_variant (#586064)
모서리: border-radius: 9999px (full)
Border: 없음
```

## Elevation & Depth

### Tonal Layering (기본)

그림자 대신 배경색 차이로 "떠있는" 느낌을 표현한다.

```
surface_container (#eaeff1) 섹션 위에
surface_container_lowest (#ffffff) 카드를 올려놓으면
자연스러운 종이 겹침 효과가 생긴다.
```

### Ambient Shadow (플로팅 요소 전용)

New Post 팝오버, 모달 등 실제로 떠있어야 하는 요소에만:

```css
box-shadow: 0 8px 40px rgba(43, 52, 55, 0.06);
/* blur: 24px~40px / opacity: 6% / 색상: on_surface 기반 */
```

### Ghost Border (접근성 대응 시 유일한 예외)

유사한 배경끼리 맞닿아 구분이 필요한 경우에만:

```css
border: 1px solid rgba(171, 179, 183, 0.15);
/* outline_variant (#abb3b7) at 15% opacity */
```
