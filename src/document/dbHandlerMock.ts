/** 
 * The transaction method in TestDocDbHandler encapsulates the process of instantiating 
 * a JsonTransaction inside a handler function, providing a clean api for consumers of the class.
 * 
 * All methods are asynchronous, returning Promises, and thus can be used in async/await context.
 */

import { JsonTransaction } from '@/db/jsonMockDb/jsonMockDb'
import { DocumentError } from './errors'
import { RtsError } from '@/lib/errors'

export class JsonDbHandler implements IDbHandler {
  tableName: string
  constructor (tableName: string) {
    this.tableName = tableName
  }

  parseArray(expression: string) {
    // eslint-disable-next-line no-useless-escape
    const notStringListRegex = /^\(([\d\w\.]+)(,[\d\w\.]+)*\)$/
    const stringListRegex = /^\('[^']*'(,'[^']*')*\)$/
    const regex = new RegExp(`^(${notStringListRegex.source}|${stringListRegex.source})$`)
    if (!regex.test(expression)) {
      return null
    }

    const content = expression.slice(1, -1)
    const isStringExpression = content.startsWith('\'') && content.endsWith('\'')

    if (isStringExpression) {
      const elements = content.split(',').map(item => item.replace(/^'|'$/g, '').trim())
      return elements
    } else {
      const elements = content.split(',').map(item => item.trim())
      return elements
    }
  }

  async select(tx: JsonTransaction, selectors: Record<string, SelectorValue>) {
    let res = await tx.getAllRecords()
    for (const field in selectors) {
      const selector = selectors[field]
      if (typeof selector == 'object')
      {
        
        if (selector.op == 'in') {
          const values = this.parseArray(selector.val as string)
          if (!values)
            throw new RtsError('INTERNAL-ERROR', 'Json Database: Wrong array format', {})
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return res.filter((value: Record<string, any>) => values.includes(value[field]))
        }

        if (selector.op == '<')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res = res.filter((value: Record<string, any>) => value[field] < selector.val)
        else if (selector.op == '<=')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res = res.filter((value: Record<string, any>) => value[field] <= selector.val)
        else if (selector.op == '>')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res = res.filter((value: Record<string, any>) => value[field] > selector.val)
        else if (selector.op == '>=')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res = res.filter((value: Record<string, any>) => value[field] >= selector.val)
        else if (selector.op == 'is')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res = res.filter((value: Record<string, any>) => value[field] == selector.val)
        else throw new RtsError('INTERNAL-ERROR', 'Unknown database operation', {})
      }
      else 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res = res.filter((value: Record<string, any>) => value[field] == selectors[field])
    }
    return res
  }

  async getAll(tx: JsonTransaction) {
    const res = await tx.getAllRecords()
    return res
  }
  async getByName(tx: JsonTransaction, name: string) {
    const res = await tx.findUnique({where: {name}})
    if (!res)
      throw new RtsError('DOES-NOT-EXIST', `${this.tableName} with name ${name} does not exist`, {name, tableName: this.tableName})
    return res as IEntityFields
  }
  async getById(tx: JsonTransaction, id: number): Promise<IDocFields> {
    const res = await tx.findUnique({where: {id}})
    if (!res)
      throw new RtsError('DOES-NOT-EXIST', `${this.tableName} with id ${id} does not exist`, {id, tableName: this.tableName})
    // delete (res as {dataFields?: unknown}).dataFields
    return res as IDocFields
  }
  async createNew(tx: JsonTransaction, data: IUpdateDocFields): Promise<IDocFields> {
    data['createdAt'] = new Date(`${new Date}`)
    data['updatedAt'] = new Date(`${new Date}`)
    const res = await tx.create({data})
    return res
  }
  async update(tx: JsonTransaction, id: number, data: IUpdateDocFields): Promise<IDocFields> {
    data['updatedAt'] = new Date(`${new Date}`)
    const res = await tx.update({where: {id}, data})
    return res
  }
  async getAllDataFields(tx: JsonTransaction, id: number): Promise<Record<string, string>> {
    const row = await tx.findUnique({where: {id}})
    if (!row)
      throw DocumentError.DoesNotExist(id, this.tableName)
    return row.dataFields
  }
  async getDataField(tx: JsonTransaction, id: number, field: string): Promise<string> {
    const row = await tx.findUnique({where: {id}})
    if (!row)
      throw DocumentError.DoesNotExist(id, this.tableName)
    return row.dataFields[field]
  }
  async setDataField(tx: JsonTransaction, id: number, field: string, value: string): Promise<void> {
    const row = await tx.findUnique({where: {id}})
    if (!row!.dataFields) {
      row!.dataFields = {}
    }
    row!.dataFields[field] = value
    await tx.update({where: {id}, data: row!})
  }
  async transaction<T>(handler: (tx: unknown) => Promise<T>): Promise<T>
  {
    const tx = new JsonTransaction(this.tableName)
    try {
      await tx.saveState()
      return await handler(tx)
    } catch (e) {
      await tx.restoreState()
      throw e
    }
  }
}