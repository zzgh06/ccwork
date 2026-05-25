# Typography

폰트는 **Inter** 단독 사용. 스케일과 굵기 조절로 계층을 만든다.

## 타이포그래피 스케일

| 단계          | 크기    | 굵기 | letter-spacing | line-height | 용도                              |
| ------------- | ------- | ---- | -------------- | ----------- | --------------------------------- |
| `display-lg`  | 3.5rem  | 700  | -0.02em        | —           | 랜딩 페이지 핵심 문구             |
| `headline-md` | 1.75rem | 600  | 0              | 1.4         | TIL 항목 제목                     |
| `body-lg`     | 1rem    | 400  | 0              | —           | 본문 (색상: `on_surface_variant`) |
| `label-md`    | 0.75rem | 500  | +0.05em        | —           | 메타데이터 — 항상 UPPERCASE       |

## 적용 규칙

- **장문 본문**은 `on_surface_variant` (#586064) 사용 → 눈의 피로 감소
- **강조** 시에만 `on_surface` (#2b3437) 전환
- **`label-md`**는 반드시 `text-transform: uppercase`와 `letter-spacing: 0.05em` 적용
- **`display-lg`**는 `-0.02em` letter-spacing으로 타이트한 고급스러운 느낌 유지
- **`headline-md`**는 `line-height: 1.4`로 읽기 편안한 여백 확보
