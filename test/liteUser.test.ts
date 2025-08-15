import { queryClient } from '@/db/drizzle/drizzle'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { LiteUser } from '@/document/liteUser'
import { closeTaskQueues } from '@/periodic_tasks/queue'

const testPhoneNumber = '201992'

function doTests(mode: 'drizzle' | 'json') {
  const dbHandlerFabric =  new DbHandlerFabric(mode)

  describe('LiteUsers: mode ' + mode, () => {
    
    afterAll(async () => {
      if (mode == 'drizzle')
        await queryClient.end()
      await closeTaskQueues()
    })

    describe('createNew method should fill fields', () => {
      it('createNew', async () => {
        const doc = new LiteUser(dbHandlerFabric)
        doc.fields.mobilePhoneNumber = testPhoneNumber
        doc.fields.deviceId = '12345'
        await doc.createNew()

        const doc2 = new LiteUser(dbHandlerFabric)
        await doc2.loadExisting(doc.fields.id)

        expect(doc2.fields.deviceId).toEqual(doc.fields.deviceId)
        expect(doc2.fields.mobilePhoneNumber).toEqual(doc.fields.mobilePhoneNumber)
      })
    })
  })
}

doTests('json')
doTests('drizzle')