import { queryClient } from '@/db/drizzle/drizzle'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { TopUp } from '@/document/topUp/topUp'
// import { TopUp } from '@/document/topUp/topUp'
import { TopUpGroup } from '@/document/topUpGroup/topUpGroup'
import { closeTaskQueues } from '@/periodic_tasks/queue'

const testPhoneNumber = '201992'

function doTests(mode: 'drizzle' | 'json') {
  const dbHandlerFabric =  new DbHandlerFabric(mode)

  describe('TopUp class: mode ' + mode, () => {
    
    afterAll(async () => {
      if (mode == 'drizzle')
        await queryClient.end()
      await closeTaskQueues()
    })

    describe('createNew', () => {
      it('createNew method should fill fields', async () => {
        const doc = new TopUpGroup(dbHandlerFabric)
        doc.fields.amount = 1
        doc.fields.status = 'NEW'
        doc.fields.description = 'Test description'
        await doc.createNew()
      
        const doc2 = new TopUpGroup(dbHandlerFabric)
        await doc2.loadExisting(doc.fields.id)
      
        expect(doc2.fields).toMatchObject(doc.fields)
      })
    })

    describe('TopUpGroup CreatePayment', () => {
      it('Should save topUpGroup in PAYMENT_CREATED status', async () => {
        const group = new TopUpGroup(dbHandlerFabric)
        group.fields.amount = 1
        group.fields.status = 'NEW'
        group.fields.description = 'Test description'
        await group.createNew()
        
        const topUp = new TopUp(dbHandlerFabric)
        topUp.fields.topUpGroupId = group.fields.id
        topUp.fields.amount = 1
        topUp.fields.phoneNumber = testPhoneNumber
        topUp.fields.serviceType = 'inet'
        topUp.fields.pluginInfoName = 'AgtsTopUp'
        await topUp.createNew()
  
        await group.loadExisting(group.fields.id)
        group.sessionData.bankPluginInfoName = 'Rysgal'
        group.sessionData.vendorName = 'TestVendor'
        group.sessionData['card.pan'] = '6711910006687856'
        group.sessionData['card.cvc'] = '652'
        group.sessionData['card.month'] = '7'
        group.sessionData['card.year'] = '24'
        group.sessionData['card.holder'] = ''
        group.fields.status = 'PAYMENT_CREATED'
        await group.save()
  
        const group2 = new TopUpGroup(dbHandlerFabric)
        await group2.loadExisting(group.fields.id)
      
        expect(group2.fields.status).toBe('PAYMENT_CREATED')
      })
    }) 

    describe('Life cycle till PAYMENT_PROCESSING', () => {
      it('Should create save topUpGroup in PAYMENT_PROCESSING status', async () => {
        const group = new TopUpGroup(dbHandlerFabric)
        group.fields.amount = 1
        group.fields.status = 'NEW'
        group.fields.description = 'Test description'
        await group.createNew()
        
        const topUp = new TopUp(dbHandlerFabric)
        topUp.fields.topUpGroupId = group.fields.id
        topUp.fields.amount = 1
        topUp.fields.phoneNumber = testPhoneNumber
        topUp.fields.serviceType = 'inet'
        topUp.fields.pluginInfoName = 'AgtsTopUp'
        await topUp.createNew()
  
        await group.loadExisting(group.fields.id)
        group.sessionData.bankPluginInfoName = 'Rysgal'
        group.sessionData.vendorName = 'TestVendor'
        group.sessionData['card.pan'] = '6711910006687856'
        group.sessionData['card.cvc'] = '652'
        group.sessionData['card.month'] = '7'
        group.sessionData['card.year'] = '24'
        group.sessionData['card.holder'] = ''
        group.fields.status = 'PAYMENT_CREATED'
        await group.save()

        group.sessionData.otpCode = '12345'
        group.fields.status = 'PAYMENT_PROCESSING'
        await group.save()
  
        const group3 = new TopUpGroup(dbHandlerFabric)
        await group3.loadExisting(group.fields.id)
      
        expect(group3.fields.status).toBe('PAYMENT_PROCESSING')
      })
    })    
  })
}

doTests('json')
doTests('drizzle')