const { spawn, spawnSync } = require('node:child_process')

const processes = [
  spawn(process.execPath, ['server.js'], { stdio: 'inherit', env: { ...process.env, PORT: process.env.API_PORT || '3001' } }),
  spawn(process.execPath, ['frontend/node_modules/next/dist/bin/next', 'dev', 'frontend'], { stdio: 'inherit', env: process.env }),
]

let stopping = false
function cleanup() {
  for (const child of processes) {
    if (!child.pid || child.exitCode !== null) continue
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
    } else {
      child.kill('SIGTERM')
    }
  }
}

function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  cleanup()
  process.exitCode = exitCode
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error(error.message)
    stop(1)
  })
  child.on('exit', (code) => {
    if (!stopping) stop(code || 0)
  })
}

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
process.on('exit', cleanup)
