import { danger, warn, message } from 'danger';

// Check for large PRs
const bigPRThreshold = 500;
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
  warn(
    `This PR is quite large (${
      danger.github.pr.additions + danger.github.pr.deletions
    } changes). Consider breaking it into smaller PRs for easier review.`
  );
}

// Check for PR description
if (!danger.github.pr.body || danger.github.pr.body.length < 50) {
  warn('Please provide a more detailed PR description.');
}

// Check for test files
const testFiles = danger.git.created_files.filter((file) =>
  file.includes('.test.')
);
const sourceFiles = danger.git.created_files.filter(
  (file) =>
    file.includes('src/') &&
    !file.includes('.test.') &&
    !file.includes('.d.ts') &&
    !file.includes('index.')
);

if (sourceFiles.length > 0 && testFiles.length === 0) {
  warn(
    'This PR adds new source files but no tests. Please consider adding tests for new functionality.'
  );
}

// Check for lock file changes
const lockFiles = danger.git.modified_files.filter((file) =>
  file.includes('pnpm-lock.yaml')
);
if (lockFiles.length > 0) {
  message('Lock file changes detected. Please verify dependency updates.');
}

// Check for breaking changes in commit messages
const commits = danger.git.commits;
const breakingChanges = commits.filter((commit) =>
  commit.message.toLowerCase().includes('breaking')
);
if (breakingChanges.length > 0) {
  warn(
    'This PR contains breaking changes. Please ensure CHANGELOG.md is updated accordingly.'
  );
}

// Check for bundle size impact
const packageJsonChanged = danger.git.modified_files.includes('package.json');
if (packageJsonChanged) {
  message(
    'package.json changed. Please verify that bundle size remains under 2MB limit.'
  );
}

// Check for TypeScript errors
const tsFiles = danger.git.created_files.filter(
  (file) => file.endsWith('.ts') || file.endsWith('.tsx')
);
if (tsFiles.length > 0) {
  message(
    'TypeScript files added. Please ensure `pnpm typecheck` passes before merging.'
  );
}
