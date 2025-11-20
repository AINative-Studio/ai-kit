import { writeFile } from 'fs/promises';
import { join } from 'path';
import { execa } from 'execa';

/**
 * Build a Docker image
 */
export async function buildDockerImage(
  projectPath: string,
  imageName: string
): Promise<void> {
  // Create Dockerfile if it doesn't exist
  await createDockerfile(projectPath);

  // Build the image
  await execa('docker', ['build', '-t', imageName, '.'], {
    cwd: projectPath,
    stdio: 'inherit',
  });
}

/**
 * Create a Dockerfile
 */
async function createDockerfile(projectPath: string): Promise<void> {
  const dockerfile = `# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
`;

  await writeFile(join(projectPath, 'Dockerfile'), dockerfile);

  // Create .dockerignore
  const dockerignore = `node_modules
.next
.git
.env
.env.local
dist
*.log
.DS_Store
`;

  await writeFile(join(projectPath, '.dockerignore'), dockerignore);
}
