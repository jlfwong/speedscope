#!/usr/bin/env node

/**
 * Publish script for speedscope-widget npm package.
 *
 * Usage:
 *   node scripts/publish-widget.js [patch|minor|major|<version>] [--dry-run] [--registry <url>]
 *
 * Examples:
 *   node scripts/publish-widget.js patch
 *   node scripts/publish-widget.js 1.2.0
 *   node scripts/publish-widget.js patch --dry-run
 *   node scripts/publish-widget.js patch --registry https://registry.npmjs.org
 */

import {execSync} from 'child_process'
import {readFileSync} from 'fs'
import {resolve, dirname} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

function exec(cmd, opts = {}) {
  console.log(`> ${cmd}`)
  return execSync(cmd, {cwd: rootDir, stdio: 'inherit', ...opts})
}

function execCapture(cmd) {
  return execSync(cmd, {cwd: rootDir, encoding: 'utf-8'}).trim()
}

function readPkg() {
  return JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'))
}

// Parse arguments
const args = process.argv.slice(2)
let versionArg = null
let dryRun = false
let registry = null

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') {
    dryRun = true
  } else if (args[i] === '--registry') {
    registry = args[++i]
  } else if (!versionArg) {
    versionArg = args[i]
  }
}

if (!versionArg) {
  console.error('Usage: node scripts/publish-widget.js <patch|minor|major|version> [--dry-run] [--registry <url>]')
  process.exit(1)
}

// Step 1: Bump version
console.log('\n📦 Bumping version...')
const newVersion = execCapture(`npm version ${versionArg} --no-git-tag-version --no-commit-hooks`)
console.log(`Version: ${newVersion}`)

// Step 2: Build
console.log('\n🔨 Building widget...')
exec('npm run build')

// Step 3: Verify dist output
const pkg = readPkg()
console.log(`\n✅ Package: ${pkg.name}@${pkg.version}`)
console.log(`   Main:    ${pkg.main}`)

// Step 4: Show what will be published
console.log('\n📋 Files to publish:')
exec('npm pack --dry-run')

// Step 5: Publish
if (dryRun) {
  console.log('\n⏭️  Dry run — skipping publish.')
} else {
  console.log('\n🚀 Publishing to npm...')
  const registryFlag = registry ? ` --registry ${registry}` : ''
  exec(`npm publish${registryFlag}`)
  console.log(`\n✅ Published ${pkg.name}@${pkg.version} successfully!`)
}
