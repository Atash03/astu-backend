import { InferSelectModel } from 'drizzle-orm'
import { RtsEntity } from './document'
import { liteUser } from '@/db/drizzle/schema'

export type LiteUserFields = InferSelectModel<typeof liteUser>

export class LiteUser extends RtsEntity {
  getTableName() {
    return 'lite_users' as const
  }

  override get fields() {
    return super.fields as LiteUserFields
  }

}