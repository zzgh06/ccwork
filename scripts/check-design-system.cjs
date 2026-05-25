const fs = require('fs');

const RULES = [
  { pattern: /bg-white/g,          message: 'bg-white 금지 → surface_container_lowest(#ffffff) 토큰 사용' },
  { pattern: /text-black/g,        message: 'text-black 금지 → on_surface(#2b3437) 사용' },
  { pattern: /#000000/g,           message: '#000000 금지 → #2b3437 사용' },
  { pattern: /box-shadow:\s*\d/g,  message: '기본 box-shadow 금지 → Ambient Shadow 규격(blur 24~40px, opacity 6%) 확인' },
];

const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(chunks.join(''));
  } catch {
    process.exit(0);
  }

  const filePath = input.tool_input?.file_path ?? '';

  if (!filePath.match(/\.(tsx|css)$/)) process.exit(0);
  if (!fs.existsSync(filePath)) process.exit(0);

  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const violations = [];

  for (const { pattern, message } of RULES) {
    lines.forEach((line, i) => {
      if (pattern.test(line)) {
        violations.push(`  × ${message}\n    ${i + 1}: ${line.trim()}`);
      }
      pattern.lastIndex = 0;
    });
  }

  if (violations.length > 0) {
    console.error(`[DS 위반 감지] ${filePath}`);
    violations.forEach(v => console.error(v));
    process.exit(2);
  }

  process.exit(0);
});
