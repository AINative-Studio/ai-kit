import { join } from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';

export interface ProjectConfig {
  framework: string;
  typescript: boolean;
  features: string[];
  requiredEnvVars?: string[];
  testRunner?: string;
  devPort?: number;
  distDir?: string;
  entry?: string;
  dockerImage?: string;
  name?: string;
}

/**
 * Load the project configuration
 */
export async function loadProjectConfig(
  projectPath: string
): Promise<ProjectConfig> {
  const configPath = join(projectPath, 'aikit.config.ts');
  const altConfigPath = join(projectPath, 'aikit.config.js');

  let config: ProjectConfig = {
    framework: 'node',
    typescript: true,
    features: [],
  };

  if (existsSync(configPath)) {
    try {
      const module = await import(pathToFileURL(configPath).href);
      config = { ...config, ...module.default };
    } catch (error) {
      console.warn('Failed to load aikit.config.ts:', error);
    }
  } else if (existsSync(altConfigPath)) {
    try {
      const module = await import(pathToFileURL(altConfigPath).href);
      config = { ...config, ...module.default };
    } catch (error) {
      console.warn('Failed to load aikit.config.js:', error);
    }
  }

  // Load package.json for additional info
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = await import(pathToFileURL(packageJsonPath).href, {
        assert: { type: 'json' },
      });
      config.name = packageJson.default.name;
    } catch {
      // Ignore
    }
  }

  return config;
}

/**
 * Define a project configuration
 */
export function defineConfig(config: Partial<ProjectConfig>): ProjectConfig {
  return {
    framework: 'node',
    typescript: true,
    features: [],
    ...config,
  };
}
