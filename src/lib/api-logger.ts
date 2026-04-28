const isDev = process.env.NODE_ENV === 'development'

export interface ApiLogContext {
  method: string
  path: string
  timestamp: string
  duration?: number
  status?: number
  error?: string
  request?: Record<string, unknown>
  response?: Record<string, unknown>
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

function getStatusColor(status: number): string {
  if (status >= 500) return colors.red
  if (status >= 400) return colors.yellow
  if (status >= 300) return colors.blue
  return colors.green
}

export function logApiRequest(context: ApiLogContext) {
  if (!isDev) return

  const statusStr = context.status
    ? `${getStatusColor(context.status)}${context.status}${colors.reset}`
    : '...'

  const durationStr = context.duration ? ` (${context.duration}ms)` : ''

  console.log(
    `${colors.bright}[API]${colors.reset} ${context.method.padEnd(6)} ${context.path} ${statusStr}${colors.dim}${durationStr}${colors.reset}`,
  )

  if (context.request) {
    console.log(`${colors.cyan}  ↓ Request:${colors.reset}`, context.request)
  }

  if (context.response) {
    console.log(`${colors.green}  ↑ Response:${colors.reset}`, context.response)
  }

  if (context.error) {
    console.log(`${colors.red}  ✗ Error: ${context.error}${colors.reset}`)
  }
}

export function createRequestLogger(method: string, path: string) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  return {
    success: (status: number, request?: Record<string, unknown>, response?: Record<string, unknown>) => {
      logApiRequest({
        method,
        path,
        timestamp,
        status,
        duration: Date.now() - startTime,
        request,
        response,
      })
    },
    error: (status: number, error: string, request?: Record<string, unknown>, response?: Record<string, unknown>) => {
      logApiRequest({
        method,
        path,
        timestamp,
        status,
        error,
        duration: Date.now() - startTime,
        request,
        response,
      })
    },
  }
}
