import { DrizzleTableName } from '@/db/drizzle/schema'
import { DrizzleDbHandler } from './drizzleDbHandler'
import { JsonDbHandler } from './dbHandlerMock'

export type DbHandlerType = 'drizzle' | 'json'

export class DbHandlerFabric implements IDbHandlerFabric {
  #type: DbHandlerType
  constructor (type: DbHandlerType) {
    this.#type = type
  }  

  create(tableName: DrizzleTableName) {
    if (this.#type == 'drizzle')
      return new DrizzleDbHandler(tableName) as IDbHandler
    else
      return new JsonDbHandler(tableName) as IDbHandler
  }

}