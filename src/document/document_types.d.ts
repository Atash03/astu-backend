interface IEntityFields {
  id: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Basic fields that are common for all documents
 */
interface IDocFields {
  id: number
  status: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Fields available for update in any document table
 */
type IUpdateDocFields = Partial<IDocFields>

/**
 * Fields available for update in any document table
 */
type IUpdateEntity = Partial<IEntityFields>

type SelectorValue = 
  string | number | boolean | {
    op: '<' | '>' | '<=' | '>=' | 'is' | 'in',
    val: string | number | boolean 
  }

/**
 * Base interface for database handlers
 * Type of tx (instead of unknown) should be specified inside implementations
 * of this interface
 * (for example DrizzleTx for Drizzle, could be anythng else for other handlers and mocks)
 */
interface IDbHandler {
  transaction<T>(handler: (tx: unknown) => Promise<T>): Promise<T>
  select(tx: unknown, selectors: Record<string, SelectorValue>): Promise<IEntityFields[]>
  getAll(tx: unknown): Promise<IEntityFields[]>
  getByName(tx: unknown, name: string): Promise<IEntityFields>
  getById(tx: unknown, id: number): Promise<IEntityFields>
  createNew(tx: unknown, data: IUpdateEntity): Promise<IEntityFields>
  update(tx: unknown, id: number, data: IUpdateEntity): Promise<IEntityFields>
  getAllDataFields(tx: unknown, id: number): Promise<Record<string, string>>
  getDataField(tx: unknown, id: number, field: string): Promise<string>
  setDataField(tx: unknown, id: number, field: string, value: string): Promise<void>
}

interface IDbHandlerFabric {
  create(tableName: string): IDbHandler
}
