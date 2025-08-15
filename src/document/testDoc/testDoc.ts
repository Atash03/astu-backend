import { DrizzleTableName } from '@/db/drizzle/schema'
import { Doc } from '../document'
import { TestDocAction, TestDocFields, TestDocStatus, testDocStatusActions } from './testDocTypes'

export type DataField = 'field1' | 'field2'

export class TestDoc extends Doc<TestDocFields> {
  getTableName(): DrizzleTableName {
    return 'test_document'
  }
  override get fields() {
    return super.fields as TestDocFields
  }
  override get dataFields() {
    return super.dataFields as Record<DataField, string>
  }
  async doAction(action: TestDocAction) {
    console.log('DOACTION:', action)
  }
  async onAfterChangeStatus(oldStatus: TestDocStatus, newStatus: TestDocStatus) {
    await super.onAfterChangeStatus(oldStatus, newStatus)
    console.log({oldStatus, newStatus})
  }
  async onBeforeSave() {
    await super.onBeforeSave()
    console.log('[Test Document] before save')
  }
  async onAfterSave() {
    await super.onAfterSave()
    console.log('[Test Document] after save')
  }  
  constructor (handler: IDbHandlerFabric) {
    super(handler)
    this.statusActions = testDocStatusActions
  }
}