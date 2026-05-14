export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'body-min-lines': ({ body }) => {
          const lines = body ? body.split('\n').filter((line) => line.trim()).length : 0;
          return [lines >= 2, '본문은 최소 2줄 이상 작성해야 합니다'];
        },
      },
    },
  ],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'test', 'chore', 'design', 'comment', 'remove', 'rename'
    ]],
    'subject-max-length': [2, 'always', 50],
    'body-min-lines': [2, 'always'],
  }
}
