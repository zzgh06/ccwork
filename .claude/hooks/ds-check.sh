#!/bin/bash
# Design System PostToolUse 훅
# Edit/Write 도구 실행 직후 금지 패턴을 검사하고 위반 시 경고를 출력한다

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

# .tsx / .css 파일만 검사
[[ "$FILE" =~ \.(tsx|css)$ ]] || exit 0
[[ -f "$FILE" ]] || exit 0

VIOLATIONS=()

check() {
  local pattern=$1
  local message=$2
  if grep -qn "$pattern" "$FILE" 2>/dev/null; then
    while IFS= read -r line; do
      VIOLATIONS+=("  × $message")
      VIOLATIONS+=("    $line")
    done < <(grep -n "$pattern" "$FILE")
  fi
}

check "bg-white"        "bg-white 금지 → surface_container_lowest(#ffffff) 토큰 사용"
check "text-black"      "text-black 금지 → on_surface(#2b3437) 사용"
check "#000000"         "#000000 금지 → #2b3437 사용"
check "box-shadow: [0-9]" "기본 box-shadow 금지 → Ambient Shadow 규격(blur 24~40px, opacity 6%) 확인"

if [ ${#VIOLATIONS[@]} -gt 0 ]; then
  echo ""
  echo "[DS 위반 감지] $FILE"
  for v in "${VIOLATIONS[@]}"; do
    echo "$v"
  done
  echo ""
fi

exit 0
