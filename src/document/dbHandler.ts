import { con } from '@/db/drizzle/drizzle'
import { ExtractTablesWithRelations } from 'drizzle-orm'
import { PgTransaction } from 'drizzle-orm/pg-core'
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'

/**
 * Drizzle transaction type
 */
export type DrizzleTx = PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>


/**
 * Drizzle abstract DB Handler
 * Allows to get and update document in database
 */
export abstract class BaseDocDbHandler implements IDbHandler {
  async transaction<T>(handler: (tx: DrizzleTx) => Promise<T>) {
    return await con.transaction(async (tx) => {
      return await handler(tx)
    } )
    //await prisma.$transaction(handler)
  }
  abstract select(tx: unknown, selectors: Record<string, string | number | boolean>): Promise<IEntityFields[]>  
  abstract getAll(tx: DrizzleTx): Promise<IEntityFields[]>
  abstract getByName(tx: DrizzleTx, name: string): Promise<IEntityFields>
  abstract getById(tx: DrizzleTx, id: number): Promise<IEntityFields>
  abstract createNew(tx: DrizzleTx, data: IUpdateDocFields): Promise<IEntityFields>
  abstract update(tx: DrizzleTx, id: number, data: IUpdateDocFields): Promise<IEntityFields>
  abstract getAllDataFields(tx: unknown, id: number): Promise<Record<string, string>>
  abstract getDataField(tx: DrizzleTx, id: number, field: never): Promise<string>
  abstract setDataField(tx: DrizzleTx, id: number, field: never, value: string): Promise<void>
}