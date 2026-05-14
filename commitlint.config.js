export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'test', 'chore', 'design', 'comment', 'remove', 'rename'
    ]],
    'subject-max-length': [2, 'always', 50],
  }
}
