import { DbHandlerFabric, DbHandlerType } from '../document/dbHandlerFabric'
import type { IPeriodicTaskModule, TaskData, bullJobData } from '@/periodic_tasks/types'
import { logMethod, logger } from '@/lib/logger'
import { InitError, RtsError } from '@/lib/errors'
import { periodicTasksEvents } from '@/periodic_tasks/events'
import { PeriodicTaskInfo } from '../document/periodicTaskInfo/periodicTaskInfo'
import { getTaskQueue } from './queue'
import { TaskLogger } from './taskLogger'

export class PeriodicTasks {
  #allTasks: PeriodicTaskInfo[] = []
  #tableTasks: Record<string, Record<string, PeriodicTaskInfo>> = {}
  dbType?: DbHandlerType
  static inited: boolean = false
  static #instance?: PeriodicTasks

  private constructor () {
  }

  static get instance(): PeriodicTasks {
    if (!this.#instance) 
      this.#instance = new PeriodicTasks
    return this.#instance
  }

  checkInited() {
    if (!PeriodicTasks.inited)
      throw new RtsError('INIT-ERROR', 'Periodic tasks was not initialized', {})
  }

  async getTableTasks() {
    this.checkInited()
    return this.#tableTasks
  }

  @logMethod('PERIODIC TASK')
  async runTask(taskName: string, data: TaskData) {
    await TaskLogger.log(taskName, 'periodicTasks.runTask', 'Started')
    
    try {
      this.checkInited()
      const path = './tasks/' + taskName + '.ts'    
      // eslint-disable-next-line @typescript-eslint/no-var-requires    
      const module: IPeriodicTaskModule = require(path)
      await TaskLogger.log(taskName, 'runTask', 'Running')
      await module.run(data)
      await TaskLogger.log(taskName, 'runTask', 'Done')
      logger.log('Task Done', {taskName})
    }
    catch(e) {
      await TaskLogger.log(taskName, 'runTask', 'Error: ' + e)
      logger.log('# Task failed', {taskName})
      // console.error('Periodic Task error: ', {e})
    }
  }

  static async handleStatusTransition(tableName: string, id: number, statuses: StatusPair) {
    await this.instance.handleStatusTransition(tableName, id, statuses)
  }

  @logMethod('PERIODIC TASK')
  async handleStatusTransition(tableName: string, id: number, statuses: StatusPair) {
    console.log({tableName, id, statuses})
    this.checkInited()
    const tableTasks = this.#tableTasks[tableName]

    let N = 0
    for (const taskName in tableTasks) {
      const task = tableTasks[taskName]
      if (this.isMatchStatus(task, statuses)) {
        N++
        console.log(N, {taskName})
        console.log('Starting task')
        
        await this.runTask(taskName, {id, dbType: this.dbType!})
        console.log('Task done')
      }
    }
    if (N > 0)
      console.log(`${N} tasks done`)
    else
      console.log('Nothing to do')
  }

  private isMatchStatus(task: PeriodicTaskInfo, statuses: StatusPair) {
    return ([statuses.oldStatus, '*'].includes(task.dataFields.startStatus || '')) &&
      (task.dataFields.endStatus == statuses.newStatus)
  }

  static async init(dbType: DbHandlerType) {
    const instance = this.instance
    await instance.init(dbType)
  }

  private async init(dbType: DbHandlerType) {
    logger.log('=== [ Tasks initialization ] ===')
    this.dbType = dbType
    const dbHandler = new DbHandlerFabric(this.dbType)
    const res = await PeriodicTaskInfo.getAll(dbHandler)
    this.#allTasks = res
    const allSchedules: Record<string, PeriodicTaskInfo> = {}
    for (const taskInfo of res) {
      if (!taskInfo.fields.active)
        continue
      if (taskInfo.dataFields.schedule) {
        if (allSchedules[taskInfo.dataFields.schedule]) {

          throw new InitError('DUPLICATE-SCHEDULE', 'Periodic tasks duplicate schedule', {
            schedule: taskInfo.dataFields.schedule,
            task1: taskInfo.fields,
            task2: allSchedules[taskInfo.dataFields.schedule].fields
          })
        }
        allSchedules[taskInfo.dataFields.schedule] = taskInfo
      }
    }

    for (const taskInfo of res) {
      if (!taskInfo.fields.active)
        continue
      logger.marked(`**TASK**: [\`${taskInfo.fields.name}\`] ${taskInfo.fields.title}`)
      if (taskInfo.dataFields.table) {
        const tableName = taskInfo.dataFields.table
        if (!this.#tableTasks[tableName])
          this.#tableTasks[tableName] = {}
        this.#tableTasks[tableName][taskInfo.fields.name] = taskInfo
      }

      if (taskInfo.dataFields.schedule) {
        // periodic task runs by schedule
        logger.log('*** Schedule task ***')
        const taskLogInfo = {
          name: taskInfo.fields.name, 
          description: taskInfo.fields.description, 
          schedule: taskInfo.dataFields.schedule}
        logger.log(taskLogInfo)
        const eventName = taskInfo.fields.name
        const jobData: bullJobData = {
          event: eventName,
          params: {}
        }
        const schedule = taskInfo.dataFields.schedule
        console.log({jobData, options: {repeat: {cron: schedule}}})
        await getTaskQueue('slow').add(jobData, {repeat: {cron: schedule}})
        
        periodicTasksEvents.on(eventName, async () => {
          logger.marked(`*EVENT:* **${eventName}**`)
          await this.runTask(taskInfo.fields.name, { dbType })
        })
      }
    }

    logger.marked('*Listening event DocStatusChange*')

    periodicTasksEvents.on('DocStatusChange', ({tableName, id, oldStatus, newStatus}) => {
      console.log('====================== DocStatusChange ======================')
      this.handleStatusTransition(tableName, id, {oldStatus, newStatus})
        .then(() => {
          console.log('DocStatusChange success')
        }).catch(() => {
          console.log('DocStatusChange Failed')
          //console.error(e)
        })
    })

    PeriodicTasks.inited = true
  }
}

