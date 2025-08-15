import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { PeriodicTaskInfo } from '@/document/periodicTaskInfo/periodicTaskInfo'
import { TopUpGroupStatus } from '@/document/topUpGroup/topUpGroup'

async function createTopUpGroupsMakePaid(name: string, periodicTaskInfo: PeriodicTaskInfo) {
  periodicTaskInfo.fields.active = true
  periodicTaskInfo.fields.name = name
  periodicTaskInfo.fields.description = 'Proceeds topUpGroups from PAYMENT_PROCESSING to PAID status'
  periodicTaskInfo.fields.title = 'Proceeds topup to PAID status'
  periodicTaskInfo.dataFields.table = 'top_up_group'
  periodicTaskInfo.dataFields.startStatus = ''
  periodicTaskInfo.dataFields.endStatus = '' 
  periodicTaskInfo.dataFields.schedule = '1/30 * * * * *'
  await periodicTaskInfo.createNew()
}

async function createTopUpGroupsMakeDone(name: string, periodicTaskInfo: PeriodicTaskInfo) {
  periodicTaskInfo.fields.active = true
  periodicTaskInfo.fields.name = name
  periodicTaskInfo.fields.description = 'Proceeds topUpGroups frin PAID to DONE status'
  periodicTaskInfo.fields.title = 'Proceeds topup to DONE status'
  periodicTaskInfo.dataFields.table = 'top_up_group'
  periodicTaskInfo.dataFields.startStatus = ''
  periodicTaskInfo.dataFields.endStatus = '' 
  periodicTaskInfo.dataFields.schedule = '15/30 * * * * *'
  await periodicTaskInfo.createNew()
}

async function createTopUpGroupMakePaid(name: string, periodicTaskInfo: PeriodicTaskInfo) {
  periodicTaskInfo.fields.active = true
  periodicTaskInfo.fields.name = name
  periodicTaskInfo.fields.description = 'Transitions TopUpGroup from PAYMENT_PROCESSING to PAID status if possible'
  periodicTaskInfo.fields.title = 'Transitions TopUpGroup to PAID status'
  periodicTaskInfo.dataFields.table = 'top_up_group'
  periodicTaskInfo.dataFields.startStatus = 'PAYMENT_CREATED' satisfies TopUpGroupStatus
  periodicTaskInfo.dataFields.endStatus = 'PAYMENT_PROCESSING' satisfies TopUpGroupStatus
  periodicTaskInfo.dataFields.schedule = ''
  await periodicTaskInfo.createNew()
}

async function createTopUpGroupMakeDone(name: string, periodicTaskInfo: PeriodicTaskInfo) {
  periodicTaskInfo.fields.active = true
  periodicTaskInfo.fields.name = name
  periodicTaskInfo.fields.description = 'Transitions TopUpGroup from PAID to DONE status if possible'
  periodicTaskInfo.fields.title = 'Transitions TopUpGroup to DONE status'
  periodicTaskInfo.dataFields.table = 'top_up_group'
  periodicTaskInfo.dataFields.startStatus = 'PAYMENT_PROCESSING' satisfies TopUpGroupStatus
  periodicTaskInfo.dataFields.endStatus = 'PAID' satisfies TopUpGroupStatus
  periodicTaskInfo.dataFields.schedule = ''
  await periodicTaskInfo.createNew()
}

async function tryCreateTask(
  mode: 'drizzle' | 'json', 
  taskName: string, 
  fun: (name: string, periodicTaskInfo: PeriodicTaskInfo) => Promise<void>
) {
  const dbFabric = new DbHandlerFabric(mode)
  const taskInfo = new PeriodicTaskInfo(dbFabric)
  try {
    await taskInfo.loadExistingByName(taskName)
    console.log(`Periodic task ${taskName} already exist skipping`)
  }
  catch (e) {
    await fun(taskName, taskInfo)
    console.log(`Periodic task ${taskName} created`)
  }  
}

export async function init(mode: 'drizzle' | 'json') {
  await tryCreateTask(mode, 'TopUpGroupsMakePaid', createTopUpGroupsMakePaid)
  await tryCreateTask(mode, 'TopUpGroupsMakeDone', createTopUpGroupsMakeDone)
  await tryCreateTask(mode, 'TopUpGroupMakePaid', createTopUpGroupMakePaid)
  await tryCreateTask(mode, 'TopUpGroupMakeDone', createTopUpGroupMakeDone)
  
}