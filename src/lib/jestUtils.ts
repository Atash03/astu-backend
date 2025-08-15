export function jestIsRunning() {
  return process.env.JEST_WORKER_ID !== undefined
}