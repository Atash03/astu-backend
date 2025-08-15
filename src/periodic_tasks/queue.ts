import BullQueue, { Queue, QueueOptions } from 'bull'
import dayjs from 'dayjs'

const queueOptions: QueueOptions = {
  redis: {
    port: 6379,
    host: 'localhost',
  },
}

export const QueueNames = {
  fast: 'agtsbackend_tasks_fast_' + dayjs().format('YYMMDD-HH:mm:ss'),
  slow: 'agtsbackend_tasks_slow_' + dayjs().format('YYMMDD-HH:mm:ss')
} as const

type QueueName = keyof typeof QueueNames
let taskQueues: Record<QueueName, Queue> | undefined

export function getTaskQueue(name: QueueName) {
  if (!taskQueues)
    taskQueues = {
      fast: new BullQueue(QueueNames.fast, queueOptions),
      slow: new BullQueue(QueueNames.slow, queueOptions)
    }
  return taskQueues[name]
}

export async function closeTaskQueues() {
  for (const queueName in taskQueues)
    await taskQueues[queueName as QueueName].close()
  taskQueues = undefined
}