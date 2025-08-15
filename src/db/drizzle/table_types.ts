import { HasDefault, NotNull } from 'drizzle-orm'
import { pgTable, PgTextBuilder, PgSerialBuilderInitial, PgIntegerBuilder, PgTimestampBuilderInitial } from 'drizzle-orm/pg-core'

type PgTextBuilderInitial<TName extends string, TEnum extends [string, ...string[]]> = PgTextBuilder<{
  name: TName
  dataType: 'string'
  columnType: 'PgText'
  data: TEnum[number]
  enumValues: TEnum
  driverParam: string
}>;

type PgIntegerBuilderInitial<TName extends string> = PgIntegerBuilder<{
  name: TName;
  dataType: 'number';
  columnType: 'PgInteger';
  data: number;
  driverParam: number | string;
  enumValues: undefined;
}>;

export type BaseEntityFields = {
  id: NotNull<NotNull<PgSerialBuilderInitial<'id'>>>
  createdAt: NotNull<HasDefault<PgTimestampBuilderInitial<'created_at'>>>
  updatedAt: NotNull<HasDefault<PgTimestampBuilderInitial<'updated_at'>>>
}

export type EntityWithNameFields = {
  id: NotNull<NotNull<PgSerialBuilderInitial<'id'>>>
  name: NotNull<PgTextBuilderInitial<'name', [string, ...string[]]>>
  createdAt: NotNull<HasDefault<PgTimestampBuilderInitial<'created_at'>>>
  updatedAt: NotNull<HasDefault<PgTimestampBuilderInitial<'updated_at'>>>
}
export type TTableWithNameFields = ReturnType<typeof pgTable<string, EntityWithNameFields>>

export type TAnyEntityTable = ReturnType<typeof pgTable<string, BaseEntityFields>>

export type BaseDocumentFields = {
  id: NotNull<NotNull<PgSerialBuilderInitial<'id'>>>
  status: NotNull<PgTextBuilderInitial<'status', [string, ...string[]]>>
  createdAt: NotNull<HasDefault<PgTimestampBuilderInitial<'created_at'>>>
  updatedAt: NotNull<HasDefault<PgTimestampBuilderInitial<'updated_at'>>>
}
export type TAnyDocumentTable = ReturnType<typeof pgTable<string, BaseDocumentFields>>


export type BaseDataFields = {
  docId: NotNull<PgIntegerBuilderInitial<'doc_id'>>
  field: NotNull<PgTextBuilderInitial<'field', [string, ...string[]]>>
  value: NotNull<PgTextBuilderInitial<'value', [string, ...string[]]>>
}
export type TAnyDataTable = ReturnType<typeof pgTable<string, BaseDataFields>>