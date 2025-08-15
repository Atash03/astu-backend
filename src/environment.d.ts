/* eslint-disable no-unused-vars */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LOGGING_ENABLED: 'ON' | 'OFF'
      LOG_LEVEL: string
      DATABASE_URL: string
      DB_MODE: 'drizzle' | 'json'
      DB_TEST_MODE: 'drizzle' | 'json'
      TEST_MODE: 'true' | 'false'
      WHITE_SERVER_IP: string
      MSPAY_API_URL: string
      TOP_UP_GROUP_PAID_DELAY: string
      TOP_UP_GROUP_DONE_DELAY: string
      TASK_TRANSITION_STATUS_DELAY: string
      AGTS_PLUGIN_MODE: 'test' | 'prod'
      AGTS_DATA_API_URL: string
      AGTS_PAYMENT_API_URL: string
      MAX_TOPUP_RETRIES: string
      WEBTOKEN_SECRET_KEY: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
