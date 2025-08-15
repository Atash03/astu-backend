import { queryClient } from '@/db/drizzle/drizzle'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { TestDoc } from '@/document/testDoc/testDoc'
import { closeTaskQueues } from '@/periodic_tasks/queue'

let docId: number = 1

function doTests(mode: 'drizzle' | 'json') {
  const dbHandlerFabric =  new DbHandlerFabric(mode)

  describe('TestDoc class: mode ' + mode, () => {
    
    afterAll(async () => {
      if (mode == 'drizzle')
        await queryClient.end()
      await closeTaskQueues()
    })

    describe('createNew method should fill fields', () => {
      it('createDoc', async () => {
        const doc = new TestDoc(dbHandlerFabric)
        await doc.createNew()
        doc.fields.description = (new Date).toString()
        doc.fields.status = 'NEW'
        await doc.save()
      
        const doc2 = new TestDoc(dbHandlerFabric)
        await doc2.loadExisting(doc.fields.id)
    
        expect(doc2.fields).toMatchObject(doc.fields)
      })
    })
    
    describe('createNew method', () => {
      it('should create a new document', async () => {
        const doc = new TestDoc(dbHandlerFabric)
        await doc.createNew()

        expect(typeof doc.fields.id).toBe('number')
        docId = doc.fields.id

        expect(doc.fields.status).toBe('NEW')
        expect(doc.fields.description).toBeFalsy()
      })
    })

    describe('loadExisting method', () => {
      it('should load an existing document', async () => {
        const doc = new TestDoc(dbHandlerFabric)

        await doc.loadExisting(docId)

        expect(doc.fields.id).toBe(docId)
        expect(doc.fields.status).toBe('NEW')
        expect(doc.fields.description).toBeFalsy()
      })
    })

    describe('fields property', () => {
      it('should be able to edit fields of the document', async () => {
        const doc = new TestDoc(dbHandlerFabric)
        await doc.loadExisting(docId)
        doc.fields.description = 'Test description'
        doc.fields.status = 'UPDATED'

        expect(doc.fields.description).toBe('Test description')
        expect(doc.fields.status).toBe('UPDATED')
      })
    })

    describe('save method', () => {
      it('should save the changes to the document', async () => {
        const doc = new TestDoc(dbHandlerFabric)
        await doc.createNew()
        doc.fields.description = 'Test description 2'
        doc.fields.status = 'NEW'
        doc.dataFields['field1'] = 'value1'
        await doc.save()

        const doc2 = new TestDoc(dbHandlerFabric)
        await doc2.loadExisting(doc.fields.id)
        doc2.fields.status = 'UPDATED'
        doc2.dataFields['field2'] = 'value2'
        await doc2.save()

        expect(doc2.fields.description).toBe('Test description 2')
        expect(doc2.fields.status).toBe('UPDATED')

        expect(doc2.dataFields['field1']).toBe('value1')
        expect(doc2.dataFields['field2']).toBe('value2')
      })
    })
  })
}

doTests('json')
doTests('drizzle')