import { DrizzleTableName, topUpPluginInfo } from '@/db/drizzle/schema'
import { RtsEntity } from '../document'
import { InferSelectModel } from 'drizzle-orm'

type TopUpPluginFields = InferSelectModel<typeof topUpPluginInfo>

export class TopUpPluginInfo extends RtsEntity<TopUpPluginFields> {
  getTableName(): DrizzleTableName {
    return 'top_up_plugin_info'
  }
  override get dataFields() { return this._dataFields! as Record<string, string> }
}