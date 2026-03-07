import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import type { TaskData } from '../types'
import { TaskLogger } from '../taskLogger'
import { TopUpGroup, TopUpGroupStatus } from '@/document/topUpGroup/topUpGroup'

export async function run(taskData: TaskData) {
  console.log('================== TopUpGroupMakePaid ================')
  if (!taskData.id) {
    await TaskLogger.log('TopUpGroupMakePaid', 'run','TopUpGroup id was not specified')
    return
  }
  const dbHandlerFabric = new DbHandlerFabric(taskData.dbType)
  const topUpGroup = new TopUpGroup(dbHandlerFabric)
  await topUpGroup.loadExisting(taskData.id)
  topUpGroup.fields.status = 'PAID' satisfies TopUpGroupStatus
  await topUpGroup.save()

  console.log({fields: topUpGroup.fields})
}