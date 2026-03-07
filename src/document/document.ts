import { DrizzleTableName } from '@/db/drizzle/schema'
import { DocumentError } from './errors'
import { logColors, logMethod, logger } from '@/lib/logger'
// import { periodicTasksEvents } from '@/periodic_tasks/events'
import { getTaskQueue } from '@/periodic_tasks/queue'
import type { bullJobData } from '@/periodic_tasks/types'
// import { PeriodicTasks } from './periodicTaskInfo/periodicTaskInfo'

const logDocumentMethod = logMethod('[DOCUMENT]', true, logColors.green)
const TASK_TRANSITION_STATUS_DELAY = Number.parseInt(process.env.TASK_TRANSITION_STATUS_DELAY || '5000')

/**
 * Base Entity class
 * By Entity we mean any document or directory stored in database
 * having id field
 * Handles creating, loading existing, changing and saving documents
 */
export abstract class RtsEntity<TDocFields extends IEntityFields=IEntityFields> {
  protected _fields: Partial<IEntityFields> = {}
  protected _initFields: Partial<IEntityFields> = {}
  protected _dataFields: Record<string, string> = {}
  protected _initDataFields: Record<string, string> = {}
  protected _dbFabric: IDbHandlerFabric
  protected _db: IDbHandler
  protected _sessionData: Partial<Record<never, string>> = {}
  abstract getTableName(): DrizzleTableName

  constructor (dbFabric: IDbHandlerFabric) {
    this._dbFabric = dbFabric
    this._db = dbFabric.create(this.getTableName())
  }

  /**
   * Creates new entity in database
   */
  @logDocumentMethod
  async createNew() {
    await this._db.transaction(async (tx: unknown) => {
      const row = await this._db.createNew(tx, this._fields) as TDocFields
      await this.saveDataFields(tx, row.id)
      const dataFields = await this._db.getAllDataFields(tx, row.id)
      this._fields = {...row}
      this._initFields = {...row}
      this._dataFields = {...dataFields}
      this._initDataFields = {...dataFields}
    })
  }

  protected async loadFromRow(tx: unknown, row: IEntityFields) {
    const dataFields = await this._db.getAllDataFields(tx, row.id)
    // logger.log({row})
    this._fields = {...row}
    this._initFields = {...row}
    this._dataFields = {...dataFields}
    this._initDataFields = {...dataFields}
  }

  /**
   * Loads existing entity
   * @param id entity id
   */
  async loadExisting(id: number) {
    await this._db.transaction(async (tx: unknown) => {
      const row = await this._db.getById(tx, id) as TDocFields
      await this.loadFromRow(tx, row)
    })
  }

  /**
   * Loads existing entity by name
   * @param name entity name
   */
  async loadExistingByName(name: string) {
    await this._db.transaction(async (tx) => {
      const row: IEntityFields = await this._db.getByName(tx, name)  
      await this.loadFromRow(tx, row)
    })
  }  

  async saveDataFields(tx: unknown, id: number) {
    // logger.log('datafields', this._dataFields)
    for (const dataField in this._dataFields) {
      const initValue = this._initDataFields[dataField]
      const newValue = this._dataFields[dataField]
      
      if (newValue !== initValue)
        await this._db.setDataField(tx, id, dataField, newValue)
    }
  }

  protected async onBeforeSave(): Promise<void> {}  
  protected async onAfterSave(): Promise<void> {}

  /**
   * Saves changed entity
   */
  @logDocumentMethod
  async save() {
    await this._db.transaction(async (tx: unknown) => {
      if (!this._initDataFields || !this._fields) 
        throw new DocumentError('WAS-NOT-CREATED', 'Document was not created or loaded', {})

      if (!this.fields.createdAt)
        this.fields.createdAt = new Date
      this.fields.updatedAt = new Date

      await this.onBeforeSave()
      const id = this._fields.id!
      await this._db.update(tx, this._fields.id!, this._fields)
      
      await this.saveDataFields(tx, id)
      await this.onAfterSave()

      const row = await this._db.update(tx, this._fields.id!, this._fields)
      await this.saveDataFields(tx, id)

      this._fields = {...row} as TDocFields
      this._initFields = {...row} as TDocFields
    })
  }

  /**
   * Returns entity's current fields as record<string, string>
   */
  get fields() { return this._fields! as TDocFields}

  /**
   * Returns initial entity's fields as record<string, string>
   * representing their state in databse
   * that could differ from already changed fields
   * (if an entity was not yet saved after being changed)
   */
  protected get initFields() { return this._initFields! as TDocFields}

  get dataFields() { return this._dataFields! as Record<never, string> }
  get initDataFields() { return this._initDataFields! as Record<never, string>}
}

/**
 * Base document class
 * By document we mean any entity with status field
 * and all the needed logic of status transitions
 * Handles creating and updating documents
 */
export abstract class Doc<TDocFields extends IDocFields=IDocFields> extends RtsEntity<TDocFields> {
  override _fields: Partial<IDocFields>
  override _initFields: Partial<IDocFields>
  statusActions?: Record<string, Record<string, string>>
  
  constructor (dbFabric: IDbHandlerFabric) {
    super(dbFabric)
    this._fields = { status: 'NEW' } 
    this._initFields = { status: 'NEW' } 
  }

  protected override async onAfterSave() {
    logger.log('[On Afer Save]')
    const oldStatus = this.initFields.status!
    const newStatus = this.fields.status!
    if (oldStatus != newStatus)
      await this.onAfterChangeStatus(oldStatus, newStatus)

    // await PeriodicTasks.handleStatusTransition(this)
    console.log('<emitting DocStatusChange>')
    // periodicTasksEvents.emit('DocStatusChange', this)

    const id = this.fields.id
    const tableName = this.getTableName()    
    const jobData: bullJobData = {
      event: 'DocStatusChange', 
      params: { tableName, id, oldStatus, newStatus }
    }
    await getTaskQueue('fast').add(jobData, {delay: TASK_TRANSITION_STATUS_DELAY})
  }

  /**
   * Does needed actions for document (used when status is being changed)
   * @param action name of the action like 'process', 'start', 'cancel' etc
   */
  protected abstract doAction(action: string): Promise<void> 

  /**
   * Handles status transitions (while document is being saved)
   * @param oldStatus old status
   * @param newStatus new status
   */
  protected async onAfterChangeStatus(oldStatus: string, newStatus: string) {
    if (!this.statusActions) {
      throw new DocumentError('INTERNAL-ERROR', 'Status actions are not defined', {})
    }

    logger.log({oldStatus, newStatus})
    if (!this.statusActions[oldStatus]) {
      throw new DocumentError('WRONG-STATUS-TRANSITION', `No actions for status ${oldStatus} are allowed`, {oldStatus})
    }
    const action = this.statusActions[oldStatus][newStatus]
    if (action === undefined)
      throw new DocumentError('WRONG-STATUS-TRANSITION', 'Unknown status transition', { oldStatus, newStatus })

    if (action === '')
      return

    await this.doAction(action)
  }

}