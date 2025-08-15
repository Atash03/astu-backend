import { queryClient } from '@/db/drizzle/drizzle'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { closeTaskQueues } from '@/periodic_tasks/queue'
import { TaskLogFields, TaskLogger } from '@/periodic_tasks/taskLogger'

function doTests(mode: 'drizzle' | 'json') {

  const dbFabric = new DbHandlerFabric(mode)

  describe('Periodic Tasks Logger: mode ' + mode, () => {
    beforeEach(async () => {
    })
  
    afterAll(async () => {
      if (mode == 'drizzle')
        await queryClient.end()
      await closeTaskQueues()
    })

    describe('Log', () => {
      it('Should create log entry', async () => {
        TaskLogger.init(dbFabric)
        const id = await TaskLogger.log('TestTask', 'doTests', 'Test log message')
        const dbHandler = dbFabric.create('periodic_task_log')
        console.log('ID:',{id})

        await dbHandler.transaction(async (tx) => {
          const row = await dbHandler.getById(tx, id)
          expect((row as TaskLogFields & IEntityFields).text).toBe('Test log message')
        })

      })
    })
  })
}

doTests('json')
doTests('drizzle')
  