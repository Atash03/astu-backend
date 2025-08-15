import { queryClient } from '@/db/drizzle/drizzle'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { TopUp } from '@/document/topUp/topUp'
import { getAgtsApi } from '@/document/topUpPlugins/agtsPlugin/agts-api/agtsApiFabric'
import { RtsError } from '@/lib/errors'
import { closeTaskQueues } from '@/periodic_tasks/queue'
import { TopUpServiceType } from '@/web_server/request_types'

const testPhoneNumber = '201992'

function doTests(mode: 'drizzle' | 'json') {
  const dbHandlerFabric =  new DbHandlerFabric(mode)

  describe('TopUp class: mode ' + mode, () => {
    
    afterAll(async () => {
      if (mode == 'drizzle')
        await queryClient.end()
      await closeTaskQueues()
    })

    describe('createNew method should fill fields', () => {
      it('createNew', async () => {
        const doc = new TopUp(dbHandlerFabric)
        doc.fields.amount = 0
        doc.fields.status = 'NEW'
        doc.fields.serviceType = 'inet'
        doc.fields.pluginInfoName = 'AgtsTopUp'
        doc.fields.phoneNumber = testPhoneNumber
        await doc.createNew()
      
        const doc2 = new TopUp(dbHandlerFabric)
        await doc2.loadExisting(doc.fields.id)
      
        expect(doc2.fields).toMatchObject(doc.fields)
      })
    })

    describe('Save in DONE Status', () => {
      it('should save in DONE status and increase balance', async () => {
        const api = getAgtsApi()
        const services = await api.getServices({phone: testPhoneNumber})
        const service = services.inet
        const initBalance = service?.balance || 0

        const doc = new TopUp(dbHandlerFabric)
        doc.fields.amount = 0
        doc.fields.status = 'NEW'
        doc.fields.phoneNumber = testPhoneNumber
        doc.fields.pluginInfoName = 'AgtsTopUp'
        doc.fields.internalReceipt = '12345'
        doc.fields.serviceType = 'inet'
        doc.fields.amount = 1
        await doc.createNew()
      
        const doc2 = new TopUp(dbHandlerFabric)
        await doc2.loadExisting(doc.fields.id)
        doc2.fields.status = 'DONE'
        await doc2.save()

        const doc3 = new TopUp(dbHandlerFabric)
        await doc3.loadExisting(doc.fields.id)

        const services2 = await api.getServices({phone: testPhoneNumber})
        const service2 = services2.inet
        const afterBalance = service2?.balance || 0

        expect(doc3.fields.status).toBe('DONE')
        expect(afterBalance.toFixed(2)).toBe((initBalance + 0.01).toFixed(2))
      })
    })

    describe('Save TopUp with wrong service', () => {
      it('should throw an Error', async () => {
        const doc = new TopUp(dbHandlerFabric)
        doc.fields.amount = 0
        doc.fields.status = 'NEW'
        doc.fields.phoneNumber = testPhoneNumber
        doc.fields.pluginInfoName = 'AgtsTopUp'
        doc.fields.internalReceipt = '12345'
        doc.fields.serviceType = 'wrongservicecode' as TopUpServiceType
        doc.fields.amount = 1
        let expectedErrorHappend = false

        try {
          await doc.createNew()
        } catch (e) {
          if ((e instanceof RtsError) && (e.code == 'SERVICE-NOT-ENABLED')) {
            expectedErrorHappend = true
          } else throw e
        }

        expect(expectedErrorHappend).toBe(true)
      })
    })
  })
}

doTests('json')
doTests('drizzle')