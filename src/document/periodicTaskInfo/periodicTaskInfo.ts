import { InferSelectModel } from 'drizzle-orm'
import { RtsEntity } from '../document'
import { DrizzleTableName, periodicTaskInfo } from '@/db/drizzle/schema'

export type PeriodicTaskFields = InferSelectModel<typeof periodicTaskInfo>

type PeriodicTaskInfoDataFields = {
  schedule?: string
  startStatus?: string
  endStatus?: string
  table?: DrizzleTableName
}

export class PeriodicTaskInfo extends RtsEntity<PeriodicTaskFields> {
  
  static async getAll(dbFabric: IDbHandlerFabric) {
    const db = dbFabric.create('periodic_task_info')
    
    let rows: IEntityFields[] = []
    await db.transaction(async (tx: unknown) => {
      rows = await db.getAll(tx)
    })

    const infos: PeriodicTaskInfo[] = []
    for (const row of rows) {
      const info = new PeriodicTaskInfo(dbFabric)
      await info.loadExisting(row.id)
      infos.push(info)
    }
    return infos
  }

  getTableName(): DrizzleTableName {
    return 'periodic_task_info'
  }
  override get dataFields() { return this._dataFields! as PeriodicTaskInfoDataFields }
}


