# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

React 19 + TypeScript + Vite 기반 노트 앱 실습 프로젝트. CRUD 기능과 JSON Server를 백엔드로 사용하는 학습용 코드베이스.

## 개발 명령어

```bash
npm run dev        # 프론트(5173) + JSON Server(3001) 동시 실행
npm run server     # JSON Server만 단독 실행
npm run build      # 프로덕션 빌드 (tsc + vite build)
npm run lint       # ESLint --fix
npm run format     # Prettier 포맷
npm test           # Vitest 단일 실행
npm run test:watch # Vitest watch 모드
```

앱: http://localhost:5173 / API: http://localhost:3001/notes

## 아키텍처

### 폴더 구조

```
ccwork/
├── db.json                      # JSON Server 데이터 저장소
├── src/
│   ├── main.tsx                 # 앱 진입점
│   ├── App.tsx                  # 루트 컴포넌트 (선택 상태 소유)
│   ├── index.css                # Tailwind 글로벌 스타일
│   ├── test-setup.ts            # Vitest + jest-dom 설정
│   ├── api/
│   │   └── notes.ts             # REST API 함수
│   ├── components/
│   │   ├── Layout.tsx           # 헤더 + 사이드바/메인 슬롯
│   │   ├── NoteList.tsx         # 노트 목록 (사이드바)
│   │   ├── NoteItem.tsx         # 노트 카드 단위
│   │   └── NoteEditor.tsx       # 생성/편집 폼 (메인)
│   ├── context/
│   │   └── NotesContext.tsx     # 전역 상태 + useNotes() 훅
│   └── types/
│       └── note.ts              # Note 인터페이스
```

### 데이터 흐름

```
db.json (JSON Server REST API)
  ↓ fetch (CRUD)
src/api/notes.ts          — 순수 API 함수 (fetchNotes, createNote, updateNote, deleteNote)
  ↓
src/context/NotesContext.tsx — notes 상태 + 에러/로딩 관리, useNotes() 훅 노출
  ↓
컴포넌트 (useNotes() 호출)
```

- 전역 상태는 React Context만 사용 (Zustand 미사용)
- API 레이어(`src/api/`)는 Context에서만 호출하고, 컴포넌트는 직접 호출하지 않음

### UI 구조

`App.tsx`가 선택된 노트 ID(`selectedNoteId`)와 생성 모드(`isCreating`)를 소유하고 두 상태를 `NoteList` / `NoteEditor`에 props로 내려줌.

```
App (selectedNoteId, isCreating 상태 소유)
└── Layout (사이드바 + 메인 슬롯)
    ├── NoteList  → NoteItem (사이드바)
    └── NoteEditor            (메인)
```

### 타입

`src/types/note.ts`의 `Note` 인터페이스가 유일한 도메인 타입. `tags` 필드는 의도적으로 미구현(강의 실습용).

## 구현 패턴

### 컴포넌트 패턴

- **Named export** 사용 (`export function NoteItem`) — App.tsx만 예외적으로 default export
- Props 타입은 파일 상단에 `interface XxxProps`로 선언
- 로딩/에러/빈 상태는 early return으로 처리 후 정상 렌더를 마지막에 배치 (`NoteList.tsx` 참고)
- 이벤트 버블링 차단이 필요한 경우 `e.stopPropagation()` 인라인 처리 (`NoteItem` 삭제 버튼)

### 상태관리 방식

상태를 3단계로 분리해서 관리:

| 레이어       | 상태                           | 위치              |
| ------------ | ------------------------------ | ----------------- |
| 서버 데이터  | `notes`, `loading`, `error`    | `NotesContext`    |
| UI 선택 상태 | `selectedNoteId`, `isCreating` | `App.tsx`         |
| 폼 입력      | `title`, `content`, `saving`   | `NoteEditor` 로컬 |

- Context는 `XxxProvider` + `useXxx()` 훅 쌍으로 구성, 훅 내부에서 null guard로 Provider 밖 사용 감지
- API 응답 결과로 상태 갱신 (낙관적 업데이트 없음)

### API 호출 패턴

- `src/api/notes.ts`는 side effect 없는 순수 async 함수만 포함
- 모든 함수는 `res.ok` 체크 후 실패 시 `throw new Error(...)` 처리
- `createdAt` / `updatedAt` 타임스탬프는 API 함수 내에서 `new Date().toISOString()`으로 생성 (서버 미생성)
- Context에서 `import * as api from '../api/notes'` namespace import로 호출

### 네이밍 패턴

- 컴포넌트 내부 이벤트 핸들러: `handleXxx` (`handleSave`, `handleSelectNote`)
- Props로 전달하는 콜백: `onXxx` (`onSelect`, `onDelete`, `onDone`)
- Context 메서드 및 API 함수: `fetch/create/update/delete` 동사로 통일

## 일관성 문제

1. **에러 메시지 언어 불일치**: API 에러는 영어(`'Failed to fetch notes'`), 컴포넌트 `console.error`는 해당 에러 객체를 그대로 출력
2. **eslint-disable 억제**: `NoteEditor.tsx:27`의 `useEffect` deps 배열에 `selectedNote`가 누락된 채 `eslint-disable-line`으로 경고를 억제 중 — 노트 전환 시 폼이 동기화되지 않을 수 있는 잠재적 버그

## 커밋 규칙

`commitlint` + husky `commit-msg` 훅으로 커밋 메시지 형식을 강제한다. 설정 파일: `commitlint.config.js`

### 허용 타입

`feat` `fix` `docs` `style` `refactor` `test` `chore` `design` `comment` `remove` `rename`

### 제약 조건

- 제목: `타입: 내용` 형식 필수, 최대 50자
- 본문: 최소 2줄 이상 필수

### 예시

```
feat: 로그인 기능 추가

- JWT 토큰 기반 인증 구현
- 로그인 폼 유효성 검사 추가
```

## 기술 스택

- **스타일**: Tailwind CSS v4 (`@tailwindcss/vite` 플러그인, CSS 변수 기반 테마)
- **테스트**: Vitest + @testing-library/react, 설정은 `src/test-setup.ts`
- **백엔드**: json-server v1 beta (`db.json` 직접 편집 가능)
