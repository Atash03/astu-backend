import { periodicTaskLog } from '@/db/drizzle/schema'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { RtsError } from '@/lib/errors'
import { InferSelectModel } from 'drizzle-orm'

export type TaskLogCreateFields = Omit<InferSelectModel<typeof periodicTaskLog>, 'id' | 'createdAt'>
export type TaskLogFields = InferSelectModel<typeof periodicTaskLog>

export class TaskLogger {
  static #dbHandler: IDbHandler
  static #instance?: TaskLogger
  static #dbHandlerFabric?: DbHandlerFabric
  static inited = false
  
  private constructor () {
  }

  static async log(taskName: string, functionName: string, text: string) {
    if (!TaskLogger.inited)
      throw new RtsError('NOT-INITED', 'Task logger was not initialized', {})

    const data = { 
      taskName: taskName || '', 
      text: text || '', 
      functionName: functionName || ''
    } satisfies TaskLogCreateFields as Partial<IEntityFields>

    let res: {id: number}
    const dbHandler = TaskLogger.#dbHandler
    await dbHandler.transaction(async (tx) => {      
      res = await dbHandler.createNew(tx, data)
    })
    
    return res!.id
  }

  static init(dbHandlerFabric: DbHandlerFabric) {
    TaskLogger.#dbHandlerFabric = dbHandlerFabric
    TaskLogger.#dbHandler = dbHandlerFabric.create('periodic_task_log')
    TaskLogger.inited = true
    console.log('Periodic task logger initialized')
  }

  static getInstance() {
    if (!TaskLogger.#dbHandlerFabric)
      throw new Error('TaskLogger is not initialized')
    if (!TaskLogger.#instance)
      TaskLogger.#instance = new TaskLogger()
    return TaskLogger.#instance
  }
}