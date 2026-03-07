import { DocumentError } from './errors'
import { and, eq, sql } from 'drizzle-orm'
import { PgColumnBuilderBase } from 'drizzle-orm/pg-core'
import { TAnyDataTable, TAnyEntityTable, TTableWithNameFields } from '@/db/drizzle/table_types'
import { BaseDocDbHandler, DrizzleTx } from './dbHandler'
import { DrizzleTableName, drizzleTables } from '@/db/drizzle/schema'
import { RtsError } from '@/lib/errors'
import { camel2DbFormat } from '@/lib/stringUtils'



export type DrizzleFields = Record<string, PgColumnBuilderBase>

export class DrizzleDbHandler extends BaseDocDbHandler {
  #tableName: string
  get tableName() { return this.#tableName }
  async getAll(tx: DrizzleTx) {
    const rows = await tx.select().from(this.documentTable)
    return rows
  } 
  documentTable: TAnyEntityTable
  dataTable: TAnyDataTable
  constructor (tableName: DrizzleTableName) {
    super()
    this.#tableName = tableName
    this.documentTable = drizzleTables[tableName as DrizzleTableName] as TAnyEntityTable
    this.dataTable = drizzleTables[(tableName+'_data') as DrizzleTableName] as TAnyDataTable
  }

  formatDbValue(selectorValue: string | number | boolean) {
    if (typeof selectorValue == 'string')
      return `'${selectorValue}'`
    else if (typeof selectorValue == 'number')
      return `${selectorValue}`
    else if (typeof selectorValue == 'boolean')
      return `${selectorValue.toString()}`
    else
      throw new RtsError('UNKNOWN-TYPE', 'Unknown database type', {type: typeof selectorValue})
  }

  override async select(tx: DrizzleTx, selectors: Record<string, SelectorValue>) {
    const eqs: string[] = []
    for (const field in selectors) {
      const dbFieldName = camel2DbFormat(field)
      
      const selectorValue = selectors[field]

      let op = '='
      if (typeof selectorValue == 'object')
        op = selectorValue.op

      let value
      
      if (typeof selectorValue == 'object')
        value = this.formatDbValue(selectorValue.val)
      else
        value = this.formatDbValue(selectorValue)

      if (op == 'in')
        value = value.slice(1, -1)

      eqs.push(`${dbFieldName} ${op} ${value}`)
    }

    const whereString = eqs.join(' and ')
    const rows = await tx.select().from(this.documentTable).where(sql.raw(whereString))
    return rows
  }

  override async getByName(tx: DrizzleTx, name: string) {
    const tableName = this.#tableName
    console.log(`[getByName] table=${tableName}, name=${name}`)

    // Try the standard Drizzle query builder approach
    const rows = await tx.select().from(this.documentTable).where(sql.raw(`name = '${name}'`))
    console.log(`[getByName] drizzle query rows:`, JSON.stringify(rows))

    if (rows.length > 0)
      return rows[0]

    // Fallback: use raw SQL execute if the query builder returns nothing
    console.log(`[getByName] drizzle query returned 0 rows, trying raw execute fallback`)
    const rawResult = await tx.execute(sql`SELECT * FROM ${sql.raw(tableName)} WHERE name = ${name}`)
    console.log(`[getByName] raw execute result:`, JSON.stringify(rawResult))

    const row = rawResult[0]
    if (!row)
      throw DocumentError.DoesNotExist(-1, tableName)
    return row
  }

  override async getById(tx: DrizzleTx, id: number) {
    const [res] = await tx.select().from(this.documentTable).where(eq(this.documentTable.id, id))
    // console.log({res})
    if (!res)
      throw DocumentError.DoesNotExist(id, this.#tableName)
    return res
  }
  async createNew(tx: DrizzleTx, data: IDocFields) {
    // console.log({documentTable: this.documentTable})
    const [res] = await tx.insert(this.documentTable).values(data).returning()
    if (!res)
      throw new DocumentError('INTERNAL-ERROR', 'Cannot insert a row', {data})
    // console.log({res})
    return res
  }
  async update(tx: DrizzleTx, id: number, data: IDocFields) {
    const [res] = await tx.update(this.documentTable).set(data).where(eq(this.documentTable.id, id)).returning()
    return res
  }
  async setDataField(tx: DrizzleTx, id: number, field: string, value: string) {
    await tx.insert(this.dataTable)
      .values({docId: id, field, value})
      .onConflictDoUpdate({target: [this.dataTable.docId, this.dataTable.field], set: {value}})
      .returning()
  }
  async getDataField(tx: DrizzleTx, id: number, field: string) {
    const [row] = await tx.select()
      .from(this.dataTable)
      .where(and(eq(this.dataTable.docId, id), eq(this.dataTable.field, field)))
    if (!row)
      throw DocumentError.DoesNotExist(id, this.#tableName)
    return row.value
  }
  async getAllDataFields(tx: DrizzleTx, id: number) {
    const rows = await tx.select().from(this.dataTable).where(eq(this.dataTable.docId, id))
    const res = {} as Record<string, string>
    for (const row of rows) {
      res[row.field] = row.value
    }
    return res
  }  
}
