import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { TaskData } from '../types'
import { TaskLogger } from '../taskLogger'
import { TopUpGroup, TopUpGroupStatus } from '@/document/topUpGroup/topUpGroup'

export async function run(taskData: TaskData) {
  console.log('================== TopUpGroupMakeDone ================')
  if (!taskData.id) {
    await TaskLogger.log('TopUpGroupMakeDone', 'run', 'TopUpGroup id was not specified')
    return
  }
  const dbHandlerFabric = new DbHandlerFabric(taskData.dbType)
  const topUpGroup = new TopUpGroup(dbHandlerFabric)
  await topUpGroup.loadExisting(taskData.id)
  topUpGroup.fields.status = 'DONE' satisfies TopUpGroupStatus
  topUpGroup.sessionData.taskName = 'TopUpGroupMakeDone'
  await topUpGroup.save()

  console.log({fields: topUpGroup.fields})
}