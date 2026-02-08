#!/usr/bin/env tsx

/**
 * CDN Bundle Build Script
 *
 * Builds optimized CDN bundles for AI Kit packages with:
 * - Minification
 * - Source maps
 * - Integrity hashes (SRI)
 * - Size optimization validation
 * - Bundle analysis
 *
 * Issues #65, #130 - CDN bundle generation and distribution
 *
 * Usage:
 *   pnpm build:cdn              # Build all CDN bundles
 *   pnpm build:cdn --package core   # Build specific package
 *   pnpm build:cdn --analyze    # Include bundle analysis
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { createHash } from 'crypto'
import { join, relative } from 'path'

interface BundleInfo {
  path: string
  size: number
  gzipSize: number
  integrity: string
}

interface PackageConfig {
  name: string
  path: string
  hasCdn: boolean
}

const PACKAGES: PackageConfig[] = [
  { name: 'core', path: 'packages/core', hasCdn: true },
  { name: 'react', path: 'packages/react', hasCdn: true },
  { name: 'vue', path: 'packages/vue', hasCdn: true },
  { name: 'svelte', path: 'packages/svelte', hasCdn: false },
]

// Size limits (in KB)
const SIZE_LIMITS = {
  'core.min.js': 50,
  'streaming.min.js': 15,
  'agents.min.js': 30,
  'react.min.js': 40,
  'vue.min.js': 25,
}

function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
  }
  const reset = '\x1b[0m'
  console.log(`${colors[type]}${message}${reset}`)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function calculateIntegrity(filePath: string): string {
  const content = readFileSync(filePath)
  const hash = createHash('sha384').update(content).digest('base64')
  return `sha384-${hash}`
}

function getGzipSize(filePath: string): number {
  try {
    const result = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf-8' })
    return parseInt(result.trim(), 10)
  } catch (error) {
    log(`Warning: Could not calculate gzip size for ${filePath}`, 'warning')
    return 0
  }
}

function analyzeBundles(distPath: string): BundleInfo[] {
  const bundles: BundleInfo[] = []
  const cdnPath = join(distPath, 'cdn')

  try {
    const files = readdirSync(cdnPath)

    for (const file of files) {
      if (file.endsWith('.js') && !file.endsWith('.map')) {
        const filePath = join(cdnPath, file)
        const stats = statSync(filePath)

        bundles.push({
          path: file,
          size: stats.size,
          gzipSize: getGzipSize(filePath),
          integrity: calculateIntegrity(filePath),
        })
      }
    }
  } catch (error) {
    // CDN folder doesn't exist yet
  }

  return bundles
}

function validateBundleSizes(bundles: BundleInfo[]): boolean {
  let hasErrors = false

  log('\nBundle Size Validation:', 'info')
  log('─'.repeat(80), 'info')

  for (const bundle of bundles) {
    const limit = SIZE_LIMITS[bundle.path]
    if (!limit) continue

    const sizeKB = bundle.size / 1024
    const limitKB = limit
    const percentage = (sizeKB / limitKB) * 100

    if (sizeKB > limitKB) {
      log(`  ERROR: ${bundle.path} exceeds size limit`, 'error')
      log(`    Size: ${formatBytes(bundle.size)} (${sizeKB.toFixed(2)} KB)`, 'error')
      log(`    Limit: ${limitKB} KB`, 'error')
      log(`    Exceeded by: ${(sizeKB - limitKB).toFixed(2)} KB (${(percentage - 100).toFixed(1)}%)`, 'error')
      hasErrors = true
    } else {
      log(`  PASS: ${bundle.path}`, 'success')
      log(`    Size: ${formatBytes(bundle.size)} (${percentage.toFixed(1)}% of limit)`, 'info')
      log(`    Gzipped: ${formatBytes(bundle.gzipSize)}`, 'info')
    }
  }

  return !hasErrors
}

function generateIntegrityFile(packagePath: string, bundles: BundleInfo[]): void {
  const integrityData: Record<string, { integrity: string; size: number; gzipSize: number }> = {}

  for (const bundle of bundles) {
    integrityData[bundle.path] = {
      integrity: bundle.integrity,
      size: bundle.size,
      gzipSize: bundle.gzipSize,
    }
  }

  const outputPath = join(packagePath, 'dist', 'cdn', 'integrity.json')
  writeFileSync(outputPath, JSON.stringify(integrityData, null, 2))
  log(`  Generated integrity file: ${relative(process.cwd(), outputPath)}`, 'success')
}

function buildPackage(pkg: PackageConfig, analyze: boolean = false): void {
  log(`\nBuilding CDN bundles for @ainative/ai-kit-${pkg.name}...`, 'info')
  log('─'.repeat(80), 'info')

  const packagePath = join(process.cwd(), pkg.path)

  try {
    // Build CDN bundles
    log('  Running tsup with CDN configuration...', 'info')
    execSync('pnpm build:cdn', {
      cwd: packagePath,
      stdio: 'inherit',
    })

    // Analyze bundles
    const bundles = analyzeBundles(packagePath)

    if (bundles.length === 0) {
      log('  No bundles generated', 'warning')
      return
    }

    // Validate sizes
    const sizeCheckPassed = validateBundleSizes(bundles)

    // Generate integrity hashes
    generateIntegrityFile(packagePath, bundles)

    // Summary
    log('\nBundle Summary:', 'info')
    log('─'.repeat(80), 'info')
    for (const bundle of bundles) {
      log(`  ${bundle.path}`, 'info')
      log(`    Size: ${formatBytes(bundle.size)}`, 'info')
      log(`    Gzipped: ${formatBytes(bundle.gzipSize)}`, 'info')
      log(`    Integrity: ${bundle.integrity.substring(0, 50)}...`, 'info')
    }

    if (!sizeCheckPassed) {
      throw new Error('Bundle size validation failed')
    }

    log(`\nSuccessfully built CDN bundles for ${pkg.name}`, 'success')

  } catch (error) {
    log(`\nFailed to build CDN bundles for ${pkg.name}`, 'error')
    if (error instanceof Error) {
      log(error.message, 'error')
    }
    process.exit(1)
  }
}

function main() {
  const args = process.argv.slice(2)
  const packageFilter = args.find(arg => arg.startsWith('--package='))?.split('=')[1]
  const analyze = args.includes('--analyze')

  log('AI Kit CDN Bundle Builder', 'info')
  log('═'.repeat(80), 'info')

  const packagesToBuild = PACKAGES.filter(pkg => {
    if (!pkg.hasCdn) return false
    if (packageFilter && pkg.name !== packageFilter) return false
    return true
  })

  if (packagesToBuild.length === 0) {
    log('No packages to build', 'warning')
    return
  }

  log(`Building ${packagesToBuild.length} package(s)`, 'info')
  if (analyze) {
    log('Bundle analysis enabled', 'info')
  }

  for (const pkg of packagesToBuild) {
    buildPackage(pkg, analyze)
  }

  log('\n' + '═'.repeat(80), 'success')
  log('All CDN bundles built successfully!', 'success')
  log('\nNext steps:', 'info')
  log('  1. Test bundles in examples/cdn/', 'info')
  log('  2. Verify integrity hashes', 'info')
  log('  3. Publish to npm for CDN distribution', 'info')
}

main()
