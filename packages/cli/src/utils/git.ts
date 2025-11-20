import { execa } from 'execa';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Initialize a git repository
 */
export async function initializeGit(projectPath: string): Promise<void> {
  await execa('git', ['init'], { cwd: projectPath });
  await execa('git', ['add', '-A'], { cwd: projectPath });

  try {
    await execa(
      'git',
      ['commit', '-m', 'Initial commit from AI Kit CLI'],
      { cwd: projectPath }
    );
  } catch {
    // Git commit might fail if user.name/email not configured
    // This is okay, we've still initialized the repo
  }
}

/**
 * Check if git is available
 */
export async function isGitAvailable(): Promise<boolean> {
  try {
    await execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git user name
 */
export async function getGitUserName(): Promise<string | null> {
  try {
    const result = await execa('git', ['config', 'user.name']);
    return result.stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Get git user email
 */
export async function getGitUserEmail(): Promise<string | null> {
  try {
    const result = await execa('git', ['config', 'user.email']);
    return result.stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Create .gitignore file
 */
export function createGitignore(projectPath: string, framework: string): void {
  const commonIgnores = `
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.log

# Production
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

  const frameworkIgnores: Record<string, string> = {
    nextjs: `
# Next.js
.next/
out/
*.tsbuildinfo
next-env.d.ts
`,
    vite: `
# Vite
dist/
*.local
`,
    express: `
# Express
dist/
`,
  };

  const gitignoreContent =
    commonIgnores + (frameworkIgnores[framework] || '');

  writeFileSync(join(projectPath, '.gitignore'), gitignoreContent.trim());
}
