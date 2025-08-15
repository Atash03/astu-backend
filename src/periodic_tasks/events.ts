import { EventEmitter } from 'node:events'

class PeriodicTasksEmitter extends EventEmitter {}

export const periodicTasksEvents = new PeriodicTasksEmitter()
