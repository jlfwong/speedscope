import {spawn, ChildProcess} from 'child_process'
import * as path from 'path'
import * as readline from 'readline'

type Lane = 'legacy' | 'experimental'

interface LaneConfig {
  engine: Lane
  label: string
  port: number
}

const REPO_ROOT = process.cwd()
const TSX_PATH = path.resolve(
  REPO_ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
)

const DEFAULT_HOST = '127.0.0.1'

function getNumericArg(name: string, fallback: number): number {
  const prefix = `--${name}=`
  const arg = process.argv.slice(2).find(entry => entry.startsWith(prefix))
  if (arg == null) {
    return fallback
  }

  const value = Number(arg.slice(prefix.length))
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected --${name} to be a positive integer, received "${arg}"`)
  }

  return value
}

function getStringArg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const arg = process.argv.slice(2).find(entry => entry.startsWith(prefix))
  return arg == null ? fallback : arg.slice(prefix.length)
}

function pipeLines(stream: NodeJS.ReadableStream | null, prefix: string) {
  if (stream == null) {
    return
  }

  const lineReader = readline.createInterface({input: stream})
  lineReader.on('line', line => {
    console.log(`[${prefix}] ${line}`)
  })
}

function startLane({engine, label, port}: LaneConfig, host: string): ChildProcess {
  const child = spawn(
    TSX_PATH,
    ['scripts/dev-server.ts', `--port=${port}`, `--host=${host}`, `--import-engine=${engine}`],
    {
      cwd: REPO_ROOT,
      detached: process.platform !== 'win32',
      env: process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  pipeLines(child.stdout, label)
  pipeLines(child.stderr, `${label}:err`)
  return child
}

async function main() {
  const legacyPort = getNumericArg('legacy-port', 8000)
  const experimentalPort = getNumericArg('experimental-port', 8001)
  const host = getStringArg('host', DEFAULT_HOST)

  if (legacyPort === experimentalPort) {
    throw new Error('Legacy and experimental ports must be different')
  }

  console.log(`Legacy UI: http://${host}:${legacyPort}`)
  console.log(`Experimental UI: http://${host}:${experimentalPort}`)
  console.log('Use the same profile in both tabs to compare visuals side by side.')

  const lanes: Array<{config: LaneConfig; child: ChildProcess}> = [
    {
      config: {engine: 'legacy', label: 'legacy', port: legacyPort},
      child: startLane({engine: 'legacy', label: 'legacy', port: legacyPort}, host),
    },
    {
      config: {engine: 'experimental', label: 'experimental', port: experimentalPort},
      child: startLane({engine: 'experimental', label: 'experimental', port: experimentalPort}, host),
    },
  ]

  let shuttingDown = false
  const shutdown = (signal: NodeJS.Signals | 'exit') => {
    if (shuttingDown) {
      return
    }
    shuttingDown = true
    for (const lane of lanes) {
      if (lane.child.exitCode == null && lane.child.signalCode == null) {
        const shutdownSignal = signal === 'exit' ? 'SIGTERM' : signal
        if (process.platform !== 'win32' && lane.child.pid != null) {
          try {
            process.kill(-lane.child.pid, shutdownSignal)
          } catch (error) {
            // Ignore missing-process errors during shutdown races.
          }
        } else {
          lane.child.kill(shutdownSignal)
        }
      }
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('exit', () => shutdown('exit'))

  for (const lane of lanes) {
    lane.child.on('exit', code => {
      if (shuttingDown) {
        return
      }

      console.error(
        `${lane.config.label} dev server exited unexpectedly with code ${code == null ? 'null' : code}`,
      )
      shutdown('SIGTERM')
      process.exitCode = code == null ? 1 : code
    })
  }

  await new Promise(() => {})
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
