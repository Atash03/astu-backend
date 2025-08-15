export type IPeriodicTask = (taskData: TaskData) => Promise<void>
export type IPeriodicTaskModule = { run: IPeriodicTask }

export type TaskData = {
  id?: number,
  dbType: 'drizzle' | 'json'
}

export type bullJobData = {event: string, params: unknown}
