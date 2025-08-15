import { queryClient } from '@/db/drizzle/drizzle'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { PeriodicTaskInfo } from '@/document/periodicTaskInfo/periodicTaskInfo'
import { PeriodicTasks } from '@/periodic_tasks/periodicTasks'
import { closeTaskQueues } from '@/periodic_tasks/queue'

function doTests(mode: 'drizzle' | 'json') {

  const dbFabric =  new DbHandlerFabric(mode)

  describe('Periodic Tasks Info: mode ' + mode, () => {
    beforeEach(async () => {
    })
  
    afterAll(async () => {
      if (mode == 'drizzle')
        await queryClient.end()
      await closeTaskQueues()
    })

    describe('Create', () => {
      it('Should create Periodic Task', async () => {
        // await delay(1000)
        const periodicTaskInfo = new PeriodicTaskInfo(dbFabric)
        periodicTaskInfo.fields.active = false
        periodicTaskInfo.fields.name = 'TestTask'+Math.random().toFixed(10)
        periodicTaskInfo.fields.description = 'Test Periodic task'
        periodicTaskInfo.fields.title = 'Test Periodic task'
        periodicTaskInfo.dataFields.startStatus = 'NEW'
        periodicTaskInfo.dataFields.endStatus = 'NEW'
        periodicTaskInfo.dataFields.schedule = '*'
        await periodicTaskInfo.createNew()
        await periodicTaskInfo.loadExisting(periodicTaskInfo.fields.id)
        expect(periodicTaskInfo.fields.active).toBe(false)
        expect(periodicTaskInfo.fields.description).toBe('Test Periodic task')
        expect(periodicTaskInfo.dataFields.startStatus).toBe('NEW')
      })
    })

    describe('PeriodicTasks init', () => {
      it('Should have instance', async () => {
        const periodicTasks = PeriodicTasks.instance
        expect(periodicTasks).not.toBeFalsy()
      })
    })

  })


}

doTests('json')
// doTests('drizzle')