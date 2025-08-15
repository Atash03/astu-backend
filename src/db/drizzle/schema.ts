import { sql } from 'drizzle-orm'
import { pgTable, varchar, timestamp, text, integer, uniqueIndex, serial, boolean, char, numeric, index, pgView } from 'drizzle-orm/pg-core'
// import { sql } from "drizzle-orm"

export const topUpGroup = pgTable('top_up_group', {
  id: serial('id').primaryKey().notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  phoneNumber: varchar('phone_number'),
  rtsPaymentId: integer('rts_payment_id'),
  rtsPaymentReceipt: varchar('rts_payment_receipt'),
  rtsPaymentStatus: varchar('rts_payment_status'),
  amount: integer('amount').notNull(),
  description: varchar('description'),
  liteUserId: integer('lite_user_id').references(() => liteUser.id, {onDelete: 'restrict', onUpdate: 'cascade'}),
  status: varchar('status').notNull(),
  retries: integer('retries').default(0)
}, (table) => {
  return {
    IdxStatus: index('idx_top_up_group_status').on(table.status),
    IdxRtsPaymentStatus: index('idx_top_up_rts_payment_status').on(table.rtsPaymentStatus),
    IdxCreatedAt: index('idx_top_up_created_at').on(table.createdAt),
  }
})

export const topUpGroupData = pgTable('top_up_group_data', {
  docId: integer('doc_id').notNull().references(() => topUpGroup.id, { onDelete: 'restrict', onUpdate: 'cascade' } ),
  field: text('field').notNull(),
  value: text('value').notNull(),
}, (table) => {
  return {
    testDocIdFieldKey: uniqueIndex('top_up_group_doc_id_field_key').on(table.docId, table.field),
  }
})

export const topUp = pgTable('top_up', {
  id: serial('id').primaryKey().notNull(),
  topUpGroupId: integer('top_up_group_id').references(() => topUpGroup.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  pluginInfoName: varchar('plugin_info_name').references(() => topUpPluginInfo.name),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  phoneNumber: varchar('phone_number'),
  serviceType: varchar('service_type'),
  internalReceipt: varchar('internal_receipt'),
  providerReceipt: varchar('provider_receipt'),
  amount: integer('amount').notNull(),
  status: varchar('status').notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => {
  return {
    idxTopUpGroupId: index('topup_group_id_idx').on(table.topUpGroupId),
    IdxCreatedAt: index('idx_top_up_created_at_idx').on(table.createdAt),
  }
})

export const topUpData = pgTable('top_up_data', {
  docId: integer('doc_id').notNull().references(() => topUp.id, { onDelete: 'restrict', onUpdate: 'cascade' } ),
  field: text('field').notNull(),
  value: text('value').notNull(),
}, (table) => {
  return {
    testDocIdFieldKey: uniqueIndex('top_up_data_doc_id_field_key').on(table.docId, table.field),
  }
})

export const testDocument = pgTable('test_document', {
  id: serial('id').primaryKey().notNull(),
  description: text('description'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
})

export const testDocumentData = pgTable('test_document_data', {
  docId: integer('doc_id').notNull().references(() => testDocument.id, { onDelete: 'restrict', onUpdate: 'cascade' } ),
  field: text('field').notNull(),
  value: text('value').notNull(),
},
(table) => {
  return {
    testDocIdFieldKey: uniqueIndex('test_document_data_doc_id_field_key').on(table.docId, table.field),
  }
})

export const periodicTaskLog = pgTable('periodic_task_log', {
  id: serial('id').primaryKey().notNull(),
  taskName: text('task_name').notNull(),
  functionName: text('function_name'),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
})

export const periodicTaskInfo = pgTable('periodic_task_info', {
  id: serial('id').primaryKey().notNull(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  active: boolean('active').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull()
},
(table) => {
  return {
    nameKey: uniqueIndex('periodic_task_name_key').on(table.name),
  }
})

export const periodicTaskInfoData = pgTable('periodic_task_info_data', {
  docId: integer('doc_id').notNull().references(() => periodicTaskInfo.id, { onDelete: 'cascade', onUpdate: 'cascade' } ),
  field: text('field').notNull(),
  value: text('value').notNull(),
},
(table) => {
  return {
    periodicTaskIdFieldKey: uniqueIndex('periodic_task_data_field_key').on(table.docId, table.field),
  }
})

export const topUpPluginInfo = pgTable('top_up_plugin_info', {
  id: serial('id').primaryKey().notNull(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  active: boolean('active').notNull(),
  plugin: text('plugin').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
},
(table) => {
  return {
    nameKey: uniqueIndex('topup_plugin_info_name_key').on(table.name),
  }
})

export const topUpPluginInfoData = pgTable('top_up_plugin_info_data', {
  docId: integer('doc_id').notNull().references(() => topUpPluginInfo.id, { onDelete: 'restrict', onUpdate: 'cascade' } ),
  field: text('field').notNull(),
  value: text('value').notNull(),
},
(table) => {
  return {
    topUpPluginInfoIdFieldKey: uniqueIndex('topup_plugin_info_data_doc_id_field_key').on(table.docId, table.field),
  }
})


/**********************************************************************************************/
/******************************* [ OLD DATABASE ] *********************************************/
/**********************************************************************************************/


export const prismaMigrations = pgTable('_prisma_migrations', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  checksum: varchar('checksum', { length: 64 }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
  migrationName: varchar('migration_name', { length: 255 }).notNull(),
  logs: text('logs'),
  rolledBackAt: timestamp('rolled_back_at', { withTimezone: true, mode: 'string' }),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  appliedStepsCount: integer('applied_steps_count').default(0).notNull(),
})

export const admins = pgTable('admins', {
  id: serial('id').primaryKey().notNull(),
  email: varchar('email').default('').notNull(),
  encryptedPassword: varchar('encrypted_password').default('').notNull(),
  resetPasswordToken: varchar('reset_password_token'),
  resetPasswordSentAt: timestamp('reset_password_sent_at', { precision: 3, mode: 'string' }),
  rememberCreatedAt: timestamp('remember_created_at', { precision: 3, mode: 'string' }),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
  return {
    emailKey: uniqueIndex('admins_email_key').on(table.email),
    resetPasswordTokenKey: uniqueIndex('admins_reset_password_token_key').on(table.resetPasswordToken),
  }
})

export const arInternalMetadata = pgTable('ar_internal_metadata', {
  key: varchar('key').primaryKey().notNull(),
  value: varchar('value'),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
})

export const gtsUsers = pgTable('gts_users', {
  id: serial('id').primaryKey().notNull(),
  email: varchar('email').default('').notNull(),
  encryptedPassword: varchar('encrypted_password').default('').notNull(),
  resetPasswordToken: varchar('reset_password_token'),
  resetPasswordSentAt: timestamp('reset_password_sent_at', { precision: 3, mode: 'string' }),
  rememberCreatedAt: timestamp('remember_created_at', { precision: 3, mode: 'string' }),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
  return {
    emailKey: uniqueIndex('gts_users_email_key').on(table.email),
    resetPasswordTokenKey: uniqueIndex('gts_users_reset_password_token_key').on(table.resetPasswordToken),
  }
})

// ================================= AstuLite / EKassa ====================================

export const liteBanks = pgTable('lite_banks', {
  id: serial('id').primaryKey().notNull(),
  bank: text('bank').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  cvcRequired: boolean('cvc_required').default(true).notNull(),
},
(table) => {
  return {
    bankKey: uniqueIndex('lite_banks_bank_key').on(table.bank),
  }
})

export const liteNotifications = pgTable('lite_notifications', {
  id: serial('id').primaryKey().notNull(),
  titleRu: text('title_ru').notNull(),
  titleTm: text('title_tm').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  textTm: text('text_tm').notNull(),
  textRu: text('text_ru').notNull(),
  dateTillShow: timestamp('date_till_show', { precision: 3, mode: 'string' }),
})

export const liteOtp = pgTable('lite_otp', {
  id: serial('id').primaryKey().notNull(),
  code: char('code', { length: 4 }).notNull(),
  deviceId: text('device_id').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  mobilePhoneNumber: text('mobile_phone_number').notNull(),
}, (table) => {
  return {
    idxLiteOtpDeviceId: index('idx_lite_otp_device_id').on(table.deviceId)
  }
})

export const liteServices = pgTable('lite_services', {
  id: serial('id').primaryKey().notNull(),
  service: text('service').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
},
(table) => {
  return {
    serviceKey: uniqueIndex('lite_services_service_key').on(table.service),
  }
})

export const liteUser = pgTable('lite_users', {
  id: serial('id').primaryKey().notNull(),
  mobilePhoneNumber: varchar('mobile_phone_number').notNull(),
  deviceId: varchar('device_id').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
},
(table) => {
  return {
    mobilePhoneNumberDeviceIdKey: uniqueIndex('lite_users_mobile_phone_number_device_id_key').on(table.mobilePhoneNumber, table.deviceId),
  }
})

export const liteUserData = pgTable('lite_users_data', {
  docId: integer('doc_id').notNull().references(() => liteUser.id, { onDelete: 'restrict', onUpdate: 'cascade' } ),
  field: text('field').notNull(),
  value: text('value').notNull(),
})

// ========================================================================================

export const topupTransactionDetails = pgTable('topup_transaction_details', {
  id: serial('id').primaryKey().notNull(),
  topupTransactionId: integer('topup_transaction_id').references(() => topupTransactions.id, { onDelete: 'set null', onUpdate: 'cascade' } ),
  serviceType: varchar('service_type'),
  contractNumber: varchar('contract_number'),
  billingReceipt: varchar('billing_receipt'),
  amount: integer('amount'),
  status: integer('status'),
  errorCode: varchar('error_code'),
  providerReceipt: varchar('provider_receipt'),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
})

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey().notNull(),
  title: varchar('title'),
  message: varchar('message'),
  messageRead: integer('message_read'),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' } ),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
  return {
    userIdKey: uniqueIndex('notifications_user_id_key').on(table.userId),
  }
})

export const topupTransactions = pgTable('topup_transactions', {
  id: serial('id').primaryKey().notNull(),
  phoneNumber: varchar('phone_number'),
  orderNumber: varchar('order_number'),
  orderId: varchar('order_id'),
  cardNumber: varchar('card_number'),
  cardHolder: varchar('card_holder'),
  cardExpireDate: varchar('card_expire_date'),
  depositedAmount: numeric('deposited_amount', { precision: 10, scale:  2 }),
  totalAmount: integer('total_amount'),
  status: integer('status'),
  errorCode: varchar('error_code'),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
  actionCode: varchar('action_code'),
  bankName: varchar('bank_name'),
  description: varchar('description'),
  liteUserId: integer('lite_user_id'),
  paymentRequestId: varchar('payment_request_id'),
  deletedAt: timestamp('deleted_at', { precision: 3, mode: 'string' }),
},
(table) => {
  return {
    orderIdKey: uniqueIndex('topup_transactions_order_id_key').on(table.orderId),
  }
})

export const users = pgTable('users', {
  id: serial('id').primaryKey().notNull(),
  phoneNumber: varchar('phone_number'),
  passwordDigest: varchar('password_digest'),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
  return {
    phoneNumberKey: uniqueIndex('users_phone_number_key').on(table.phoneNumber),
  }
})

export const issuedTrans = pgView('issued_trans', {
  id: serial('id').primaryKey().notNull(),
  issueType: varchar('issue_type'),
  phoneNumber: varchar('phone_number'),
  orderNumber: varchar('order_number'),
  orderId: varchar('order_id'),
  cardNumber: varchar('card_number'),
  cardHolder: varchar('card_holder'),
  cardExpireDate: varchar('card_expire_date'),
  depositedAmount: numeric('deposited_amount', { precision: 10, scale:  2 }),
  totalAmount: integer('total_amount'),
  status: integer('status'),
  errorCode: varchar('error_code'),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
  actionCode: varchar('action_code'),
  bankName: varchar('bank_name'),
  description: varchar('description'),
  liteUserId: integer('lite_user_id'),
  paymentRequestId: varchar('payment_request_id'),
  deletedAt: timestamp('deleted_at', { precision: 3, mode: 'string' }),
}).as(sql`
    -- 1
    SELECT 'STATUS_5' AS issue_type,
          t.*
    FROM topup_transactions t
    WHERE (t.status = 5
          AND t.lite_user_id IS NULL)
    UNION ALL 
    --2

    SELECT 'STATUS_130' AS issue_type,
          t.*
    FROM topup_transactions t
    WHERE t.id in
        (SELECT t.id
        FROM topup_transactions t
        LEFT JOIN topup_transaction_details d ON d.topup_transaction_id = t.id
        WHERE (d.status = 130
                AND t.lite_user_id IS NOT NULL) )
    UNION ALL 
    --3 Wrong sum

    SELECT 'WRONG-SUM' AS issue_type,
          t.*
    FROM topup_transactions t
    WHERE t.id in
        (SELECT t.id
        FROM topup_transactions t
        LEFT JOIN topup_transaction_details d ON d.topup_transaction_id = t.id
        GROUP BY t.id,
                  t.total_amount
        HAVING t.total_amount - sum(d.amount) > 0)
    UNION ALL 
    
    --4 No-Provider-Receipt

    SELECT 'NO-RECEIPT' AS issue_type,
          t.*
    FROM topup_transactions t
    WHERE t.id in
        (SELECT t.id
        FROM topup_transactions t
        LEFT JOIN topup_transaction_details d ON d.topup_transaction_id = t.id
        WHERE t.status = 2
          AND d.provider_receipt IS NULL )
`)

/**********************************************************************************************/
/**********************************************************************************************/

export const drizzleTables = {
  test_document: testDocument,
  test_document_data: testDocumentData,
  top_up_group: topUpGroup,
  top_up_group_data: topUpGroupData,
  top_up: topUp,
  top_up_data: topUpData,
  periodic_task_info: periodicTaskInfo,
  periodic_task_info_data: periodicTaskInfoData,
  periodic_task_log: periodicTaskLog,
  top_up_plugin_info: topUpPluginInfo,
  top_up_plugin_info_data: topUpPluginInfoData,
  lite_users: liteUser,
  lite_users_data: liteUserData,
} as const

export type DrizzleTableName = keyof typeof drizzleTables
