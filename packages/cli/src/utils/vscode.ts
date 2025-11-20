import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Create VS Code configuration files
 */
export async function createVSCodeConfig(
  projectPath: string,
  template: string
): Promise<void> {
  const vscodeDir = join(projectPath, '.vscode');
  await mkdir(vscodeDir, { recursive: true });

  // settings.json
  const settings = {
    'editor.formatOnSave': true,
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    'editor.codeActionsOnSave': {
      'source.fixAll.eslint': 'explicit',
    },
    'typescript.tsdk': 'node_modules/typescript/lib',
    'typescript.enablePromptUseWorkspaceTsdk': true,
    'files.exclude': {
      '**/.git': true,
      '**/.DS_Store': true,
      '**/node_modules': true,
      '**/.next': true,
      '**/dist': true,
    },
  };

  await writeFile(
    join(vscodeDir, 'settings.json'),
    JSON.stringify(settings, null, 2)
  );

  // extensions.json
  const extensions = {
    recommendations: [
      'esbenp.prettier-vscode',
      'dbaeumer.vscode-eslint',
      'bradlc.vscode-tailwindcss',
      'ms-vscode.vscode-typescript-next',
    ],
  };

  // Add framework-specific extensions
  if (template === 'vue-app') {
    extensions.recommendations.push('Vue.volar');
  } else if (template === 'svelte-app') {
    extensions.recommendations.push('svelte.svelte-vscode');
  }

  await writeFile(
    join(vscodeDir, 'extensions.json'),
    JSON.stringify(extensions, null, 2)
  );

  // launch.json for debugging
  const launch = {
    version: '0.2.0',
    configurations: [
      {
        type: 'node',
        request: 'launch',
        name: 'Debug',
        skipFiles: ['<node_internals>/**'],
        program: '${workspaceFolder}/src/index.ts',
        preLaunchTask: 'npm: dev',
        outFiles: ['${workspaceFolder}/dist/**/*.js'],
      },
    ],
  };

  await writeFile(
    join(vscodeDir, 'launch.json'),
    JSON.stringify(launch, null, 2)
  );
}
