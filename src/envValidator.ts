import { RtsError } from './lib/errors'
import { logger } from './lib/logger'

export class EnvError extends RtsError {
  constructor (description: string) {
    const intro = 'Wrong .env format\n'
    super ('ENV-FORMAT', intro + description, {env: process.env})
  }
}

function throwEnvError(description: string) {  
  logger.marked(description)
  throw new EnvError(description)
}

function checkPositiveInt(fieldName: string) {
  const value = Number.parseInt(process.env[fieldName] || '')
  if ((!value) || (value < 0))
    throwEnvError(`** ${fieldName} **: Wrong format. Should be integer > 0. Found: '${process.env[fieldName]}'`)
}

function checkSet(fieldName: string) {
  if (!process.env[fieldName])
    throwEnvError(`** ${fieldName} ** should be specified`)
}

function checkValues(fieldName: string, values: string[]) {
  if (!values.includes(process.env[fieldName] || ''))
    throwEnvError(`** ${fieldName} ** should be one of ${values}`)
}

export function validateEnv() {
  console.log('')
  logger.marked('**Validating enviroment variables**')
  const env = process.env
  
  if (env.NODE_TLS_REJECT_UNAUTHORIZED != '0')
    throwEnvError('**NODE_TLS_REJECT_UNAUTHORIZED** should be **0**')

  checkSet('DATABASE_URL')
  checkSet('WHITE_SERVER_IP')
  checkSet('MSPAY_API_URL')
  checkSet('AGTS_DATA_API_URL')
  checkSet('AGTS_PAYMENT_API_URL')
  
  checkValues('LOGGING_ENABLED', ['ON', 'OFF'])
  checkValues('DB_MODE', ['drizzle', 'json'])
  checkValues('DB_TEST_MODE', ['drizzle', 'json'])
  checkValues('TEST_MODE', ['true', 'false'])
  checkValues('AGTS_PLUGIN_MODE', ['test', 'prod'])

  checkPositiveInt('TOP_UP_GROUP_DONE_DELAY')
  checkPositiveInt('TOP_UP_GROUP_PAID_DELAY')
  checkPositiveInt('TASK_TRANSITION_STATUS_DELAY')
  checkPositiveInt('MAX_TOPUP_RETRIES')
  console.log('Enviroment variables are OK') 
}