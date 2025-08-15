import { logger } from '@/lib/logger'
import { TaskData } from '../types'
import { TopUpGroup, TopUpGroupStatus } from '@/document/topUpGroup/topUpGroup'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { RtsError } from '@/lib/errors'
import { TaskLogger } from '../taskLogger'

const MAX_TOPUP_RETRIES = Number.parseInt(process.env.MAX_TOPUP_RETRIES)

async function transitionToDone(dbHandlerFabric: DbHandlerFabric, id: number) {
  let topUpGroup: TopUpGroup | undefined = undefined
  try {
    logger.log('Checking TopUpGroup: ', id)
    topUpGroup = new TopUpGroup(dbHandlerFabric)
    await topUpGroup.loadExisting(id)
    topUpGroup.fields.status = 'DONE'
    topUpGroup.sessionData.taskName = 'TopUpGroupsMakeDone'
    await topUpGroup.save()
  } catch(e) {
    if (e instanceof RtsError)
      logger.log('Error while transitioning to DONE:', e.code, e.message, e.data)
    else
      logger.error(e)
    await TaskLogger.log('TopUpGroupsMakeDone', 'transitionToDone', 'TopUpGroupsMakeDone Error: '+e)
    TopUpGroup.incRetriesCounter(id, dbHandlerFabric)
  } finally {
    if (topUpGroup) {
      logger.log('Result status: ', topUpGroup.fields.status)
      await TaskLogger.log('TopUpGroupsMakeDone', 'transitionToDone', 'Result status: ' + topUpGroup.fields.status)
    }
  }
}

export async function run(taskData: TaskData) {
  logger.marked('** topUpGroupsMakeDone **')
  logger.log({taskData})

  const dbHandlerFabric = new DbHandlerFabric(taskData.dbType)
  const dbHandler = dbHandlerFabric.create('top_up_group')

  await dbHandler.transaction(async (tx) => {
    const status: TopUpGroupStatus = 'PAID'
    const res = await dbHandler.select(tx, {
      status,
      retries: { op: '<', val: MAX_TOPUP_RETRIES }
    })

    if (res.length == 0) {
      logger.log(`No topUpGroups in ${status} status found`)
      logger.log('Nothing to do')
    }
    else
      logger.log(`There are ${res.length} topUpGroups to process`)
      
    for (const row of res) {
      await transitionToDone(dbHandlerFabric, row.id)
    }
    logger.log('topUpGroupMakeDone: done.')

  })
}