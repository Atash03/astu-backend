import { queryClient } from '@/db/drizzle/drizzle'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { closeTaskQueues } from '@/periodic_tasks/queue'

function doTests(mode: 'drizzle' | 'json') {
  const dbHandlerFabric =  new DbHandlerFabric(mode)
  describe('Drizzle Db handler ', () => {
    beforeEach(async () => {
    })

    afterAll(async () => {
      await queryClient.end()
      await closeTaskQueues()
    })    
    
    describe('Select method', () => {
      it('should return an array', async () => {
        const dbHandler: IDbHandler = dbHandlerFabric.create('test_document')
        await dbHandler.transaction(async (tx) => {
          const status = 'UPDATED'
          const res = await dbHandler.select(tx, {status})
          expect(res).not.toBeFalsy()
        })
      })
    })

    describe('Select method with IN operator', () => {
      it('should return an array', async () => {
        const dbHandler: IDbHandler = dbHandlerFabric.create('periodic_task_info')
        await dbHandler.transaction(async (tx) => {
          
          const res1 = await dbHandler.select(tx, { 
            name: { 
              op: 'in', 
              val: "('TopUpGroupsMakeDone')"
            } 
          })
          console.log({res: res1})
          expect(res1.length).toBe(1)

          const res2 = await dbHandler.select(tx, { 
            name: { 
              op: 'in', 
              val: "('TopUpGroupsMakeDone','TopUpGroupsMakePaid','abc')"
            } 
          })
          console.log({res: res2})
          expect(res2.length).toBe(2)
        })
      })
    })

  })
}

doTests('drizzle')
doTests('json')