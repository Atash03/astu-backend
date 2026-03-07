import { logger } from '@/lib/logger'
import type { TaskData } from '../types'
import { TopUpGroup, TopUpGroupStatus } from '@/document/topUpGroup/topUpGroup'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { RtsError } from '@/lib/errors'
import { TaskLogger } from '../taskLogger'
import dayjs from 'dayjs'

const TOP_UP_GROUP_PAID_DELAY = Number.parseInt(process.env.TOP_UP_GROUP_PAID_DELAY!)
const MAX_TOPUP_RETRIES = Number.parseInt(process.env.MAX_TOPUP_RETRIES)

async function transitionToPaid(dbHandlerFabric: DbHandlerFabric, id: number) {
  let topUpGroup: TopUpGroup | undefined = undefined
  try {
    logger.log('Checking TopUpGroup: ', id)
    topUpGroup = new TopUpGroup(dbHandlerFabric)
    await topUpGroup.loadExisting(id)
    
    const maxDate = dayjs().subtract(TOP_UP_GROUP_PAID_DELAY + 1, 'second')
    const topUpGroupDate = dayjs(topUpGroup.fields.createdAt)

    console.log(`maxDate: ${maxDate}, topUpGroupDate: ${topUpGroupDate}`)
    
    if (topUpGroupDate > maxDate) {
      console.log('TopUpGroup too new. Skipping')
      return
    }

    topUpGroup.fields.status = 'PAID'
    await topUpGroup.save()
  } catch(e) {
    if (e instanceof RtsError)
      logger.log('Error while transitioning to PAID:', e.code, e.message, e.data)
    else
      logger.error(e)
    await TaskLogger.log('TopUpGroupsMakePaid', 'transitionToPaid', 'TopUpGroupsMakePaid Error: '+e)
    TopUpGroup.incRetriesCounter(id, dbHandlerFabric)
  } finally {
    if (topUpGroup) {
      logger.log('Result status: ', topUpGroup.fields.status)
      await TaskLogger.log('TopUpGroupsMakePaid', 'transitionToPaid', 'Result status: ' + topUpGroup.fields.status)
    }
  }
}

export async function run(taskData: TaskData) {
  logger.marked('** topUpGroupsMakePaid **')
  logger.log({taskData})

  const dbHandlerFabric = new DbHandlerFabric(taskData.dbType)
  const dbHandler = dbHandlerFabric.create('top_up_group')

  await dbHandler.transaction(async (tx) => {
    const status: TopUpGroupStatus = 'PAYMENT_PROCESSING'
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
      await transitionToPaid(dbHandlerFabric, row.id)
    }
    logger.log('topUpGroupMakePaid: done.')

  })
}
