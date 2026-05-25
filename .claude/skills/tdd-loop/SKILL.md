---
name: tdd-loop
description: |
  GitHub 이슈 번호를 받아 TDD 풀 사이클(7단계)을 순서대로 실행하는 컨테이너 스킬.
  test-scenarios → tdd-red → tdd-green → ac-verifier → tdd-refactor → security-review → create-pr
  순서로 각 스킬/에이전트를 그대로 호출한다. 각 단계 내부의 승인 게이트는 그대로 작동한다.

  다음 상황에서 반드시 이 스킬을 사용한다:
  - "/tdd-loop <이슈번호>" 형태로 직접 호출할 때
  - "이슈 N번 TDD 전체 사이클 돌려줘", "TDD 풀 사이클", "이슈 처음부터 끝까지" 등을 언급할 때
  - "test-scenarios부터 PR까지 한 번에 진행", "TDD 루프 시작"을 언급할 때
---

# tdd-loop — TDD 풀 사이클 컨테이너

## 입력

`$ARGUMENTS`로 GitHub 이슈 번호를 받는다.

```
/tdd-loop 5
```

---

## 컨테이너의 역할

이 스킬은 **순서 보장**만 담당한다.

- 각 단계는 기존 스킬/에이전트를 그대로 호출한다.
- 각 스킬 내부의 사용자 승인 게이트는 그대로 작동한다(사용자가 응답해야 다음 진행).
- 컨테이너 자체는 "다음 단계로 넘어갈까요?" 같은 추가 게이트를 만들지 않는다.
- 단계 실패 시 어디서 멈췄는지 명확히 출력하고 즉시 중단한다.

---

## 0단계 — 사전 점검

아래 세 가지를 순서대로 확인한다. 하나라도 실패하면 이유를 출력하고 중단한다.

### 0-1. 이슈 확인

```bash
gh issue view $ARGUMENTS --repo zzgh06/ccwork
```

이슈 본문과 AC를 확인한다. 이슈가 없거나 접근 불가하면 중단한다.

### 0-2. 워킹트리 청결 확인

```bash
git status --short
```

미커밋 변경사항이 있으면 아래 메시지를 출력하고 **중단**한다:

```
[tdd-loop 중단] 미커밋 변경사항이 있습니다.
커밋하거나 stash한 뒤 다시 실행해주세요.
```

### 0-3. 브랜치 확인 및 분기

```bash
git branch --list
git branch --show-current
```

**현재 브랜치가 `feature/<spec>` 형태인지 확인한다.**

- 현재 브랜치가 `feature/<spec>`이 아니면:

  ```
  [tdd-loop 중단] feature/<spec> 브랜치에서 실행해야 합니다.
  현재 브랜치: <현재 브랜치명>
  ```

  출력하고 중단한다.

- `feat/<issue-slug>` 브랜치가 이미 존재하면 동일 이슈 재실행으로 간주하고 사용자에게 확인한다:

  ```
  [확인 필요] feat/<issue-slug> 브랜치가 이미 존재합니다.
  a) 해당 브랜치로 체크아웃해 이어서 진행
  b) 중단 (수동으로 브랜치 정리 후 재실행)
  선택하세요 (a/b):
  ```

  사용자 응답을 기다린다.

- 브랜치가 없으면 `feature/<spec>`에서 분기 후 체크아웃한다:
  ```bash
  git checkout -b feat/<issue-slug>
  ```
  이슈 slug는 이슈 제목을 소문자 케밥케이스로 변환해 사용한다(예: 이슈 제목 "태그 표시" → `feat/5-태그-표시`).

사전 점검 완료 후 진행 메시지를 출력한다:

```
[tdd-loop] 이슈 #$ARGUMENTS — 사전 점검 통과. 브랜치: feat/<issue-slug>
단계 순서: test-scenarios → tdd-red → tdd-green → ac-verifier → tdd-refactor → security-review → create-pr
```

---

## 1단계 — test-scenarios

```
[tdd-loop] 1/7 test-scenarios 시작
```

`/test-scenarios $ARGUMENTS` 를 호출한다.

이 스킬은 내부적으로 두 번의 사용자 승인 게이트를 가진다:

- 시그니처 검토 승인
- 시나리오 검토 승인

두 게이트를 모두 통과해야 다음 단계로 진행한다.

---

## 2단계 — tdd-red

```
[tdd-loop] 2/7 tdd-red 시작
```

`/tdd-red $ARGUMENTS` 를 호출한다.

완료 기준: 새 테스트가 모두 실패하고, 기존 테스트가 모두 통과한다(`npm test` 확인).

---

## 3단계 — tdd-green

```
[tdd-loop] 3/7 tdd-green 시작
```

`/tdd-green $ARGUMENTS` 를 호출한다.

완료 기준: `npm test` 전체 통과.

---

## 4단계 — ac-verifier

```
[tdd-loop] 4/7 ac-verifier 실행 중
```

`@ac-verifier $ARGUMENTS` 에이전트를 실행한다.

결과 처리:

- **AC 충족**: 5단계로 진행한다.
- **AC 갭 발견**: 갭 내용을 출력하고 중단한다.
  ```
  [tdd-loop 중단] ac-verifier가 AC 미충족을 보고했습니다.
  갭: <내용>
  /tdd-green $ARGUMENTS 로 돌아가 구현을 보완한 뒤 다시 실행해주세요.
  ```

---

## 5단계 — tdd-refactor

```
[tdd-loop] 5/7 tdd-refactor 시작
```

`/tdd-refactor $ARGUMENTS` 를 호출한다.

완료 기준: 리팩토링 후 `npm test` 전체 통과.

---

## 6단계 — security-review

```
[tdd-loop] 6/7 security-review 시작
```

`/security-review $ARGUMENTS` 를 호출한다.

결과 처리:

- **CRITICAL / HIGH 항목 없음**: 7단계로 진행한다.
- **CRITICAL 또는 HIGH 항목 발견**: 항목을 출력하고 중단한다.
  ```
  [tdd-loop 중단] security-review에서 CRITICAL/HIGH 항목이 발견되었습니다.
  커밋 전 반드시 수정해주세요.
  수정 후 /security-review $ARGUMENTS 를 재실행하고 통과하면 /create-pr 을 직접 실행해주세요.
  ```

---

## 7단계 — create-pr

```
[tdd-loop] 7/7 create-pr 시작
```

`/create-pr` 을 호출한다.

PR 생성 시 아래 조건을 확인한다:

- 커밋 메시지가 commitlint를 통과하는지 확인 (`npx commitlint --from HEAD~1`)
- PR base 브랜치: `feature/<spec>`
- PR 본문에 `Closes #$ARGUMENTS` 포함

PR이 생성되면 해당 이슈에 PR 링크 코멘트를 남긴다:

```bash
gh issue comment $ARGUMENTS --body "PR 생성: <PR URL>"
```

---

## 완료 출력

모든 단계를 통과하면 아래 요약을 출력한다:

```
[tdd-loop 완료] 이슈 #$ARGUMENTS

✅ 1/7 test-scenarios  — 시그니처 + 시나리오 확정
✅ 2/7 tdd-red         — 실패 테스트 작성
✅ 3/7 tdd-green       — 전체 테스트 통과
✅ 4/7 ac-verifier     — AC 충족 확인
✅ 5/7 tdd-refactor    — 구조 개선
✅ 6/7 security-review — 타입·보안 통과
✅ 7/7 create-pr       — PR 생성 완료

PR: <PR URL>
```

---

## 중단 시 재개 방법

중단된 단계부터 해당 스킬을 직접 호출해 재개한다.

| 중단 지점    | 재개 명령                                  |
| ------------ | ------------------------------------------ |
| 0단계 (사전) | 문제 해결 후 `/tdd-loop $ARGUMENTS` 재실행 |
| 1단계        | `/test-scenarios $ARGUMENTS`               |
| 2단계        | `/tdd-red $ARGUMENTS`                      |
| 3단계        | `/tdd-green $ARGUMENTS`                    |
| 4단계 (갭)   | `/tdd-green $ARGUMENTS`                    |
| 5단계        | `/tdd-refactor $ARGUMENTS`                 |
| 6단계 (보안) | `/security-review $ARGUMENTS`              |
| 7단계        | `/create-pr`                               |
