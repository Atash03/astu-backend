import express, { Express, Request, Response } from 'express'
import bodyParser from 'body-parser'
import { ApiError } from './api_types'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { TestDocApiHandler } from './testDoc_api_handler'
import { InitError, RtsError } from '@/lib/errors'
import { PeriodicTasks } from '@/periodic_tasks/periodicTasks'
import { periodicTasksEvents } from '@/periodic_tasks/events'
import type { bullJobData } from '@/periodic_tasks/types'
import { logger } from '@/lib/logger'
import { EnvError, validateEnv } from '@/envValidator'
import { queryClient } from '@/db/drizzle/drizzle'
import { closeTaskQueues, getTaskQueue } from '@/periodic_tasks/queue'
import { TaskLogger } from '@/periodic_tasks/taskLogger'
import { Queue } from 'bull'
import { TopUpApiHandler } from './topUp_api_handler'
import { TopUpGroupApiHandler } from './topUpGroup_api_handler'
import { ApiHistoryHandler } from './api_history_handler'
import { ApiHandler } from './api_handler'
import { ekassaApiHandler } from './eKassa_api_handler'

const TEST_MODE = (process.env.TEST_MODE != 'false') || true
const DB_MODE = process.env.DB_MODE || 'json'
const DB_TEST_MODE = process.env.DB_TEST_MODE || 'json'
const rtsDbMode = TEST_MODE ? DB_TEST_MODE : DB_MODE

const app: Express = express()
const port = process.env.PORT || 3001
const dbHandlerFabric = new DbHandlerFabric(rtsDbMode)

function initQueue(taskQueue: Queue) {
  logger.log('Initializing queue: ', taskQueue.name)
  taskQueue.process(async (job) => {
    try {
      console.log('---------- BULL TASK ----------')
      console.log({data: job.data})
      const data = job.data as bullJobData
      periodicTasksEvents.emit(data.event, data.params)
    } catch(e) {
      console.log(e)
    }
  }).then(() => {
    console.log('task Queue terminated')
  }).catch(e => {
    console.error(new Error('Cannot run task queue'))
    console.error(e)
  })
}

async function init() {
  try {
    validateEnv()
  } catch (e) {
    logger.marked('`Error while validating enviroment variables`', e)
    throw e
  }

  await getTaskQueue('fast').empty()
  await getTaskQueue('slow').empty()

  TaskLogger.init(dbHandlerFabric)
  await PeriodicTasks.init(rtsDbMode)

  initQueue(getTaskQueue('fast'))
  initQueue(getTaskQueue('slow'))
}

const apiHandlerNames = ['testDoc', 'topUp', 'topUpGroup', 'history', 'ekassa'] as const
type ApiHandlerName = typeof apiHandlerNames[number]

const apiHandlers = {
  'testDoc': TestDocApiHandler,
  'topUp': TopUpApiHandler,
  'topUpGroup': TopUpGroupApiHandler,
  'history': ApiHistoryHandler,
  'ekassa': ekassaApiHandler
} satisfies Record<ApiHandlerName, {new(h: DbHandlerFabric):  ApiHandler<unknown>}>

function isApiHandlerName (str: string): str is ApiHandlerName {
  return ([...apiHandlerNames] as string[]).includes(str) 
}

app.use(bodyParser.json())

const errorHandler = (error: Error, _1: Request, res: Response, next: () => void) => {
  if (error instanceof SyntaxError) {
    res.send({errorCode: 'WRONG-FORMAT', error: 'Wrong json format: ' + error})
  } else {
    next()
  }
}

app.use(errorHandler)

app.get('/', (req: Request, res: Response) => {
  res.send('RTS')
})

function getTokenFromRequest(req: Request) {
  const authStr = req.headers.authorization
  if (!authStr)
    return undefined

  const [validationType, token] = authStr.split(' ')
  if (validationType != 'Bearer')
    throw new RtsError('WRONG-VALIDATION-TYPE', 'Only bearer authentication supported', {})
  return token
}

app.post('/:docName', async (req: Request, res: Response) => {
  const docType = req.params['docName']
  console.log('[Request]', docType)

  try {
    if (!isApiHandlerName(docType))
    // if (!apiHandlerNames.includes(docType))
      throw new ApiError('WRONG-FORMAT', 'Wrong document type', { docName: docType })
      
    const apiHandler = new apiHandlers[docType](dbHandlerFabric)
    
    const token = getTokenFromRequest(req)
    apiHandler.token = token
    const payload = req.body
    const apiResp = await apiHandler.handleApiRequest(payload)
    // const fields = {...doc.fields}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    /// delete (fields as any) ['dataFields'] // One more crutch
    // res.send({docType, fields, dataFields: doc.dataFields})
    res.send(apiResp)
  }

  catch(e) {
    if (e instanceof RtsError) {
      console.log(e.message, e.data)
      res.send({errorCode: e.code, error: e.message, data: e.data})
    }
    else if (e instanceof Error) {
      console.log({e})
      res.send({error: 'internal error', data: e.message})
    }
    else {
      console.log({e})
      res.send({error: 'internal error', data: e})
    }
  }
})

init().then(() => {
  logger.marked('**Server initialization complete.**')
  app.listen(port, () => {
    logger.marked(`Server is running at **http://localhost:${port}**`)
  })
  
}).catch(e => {
  if (e instanceof InitError)
    console.log(e.message, e.data)
  else if (!(e instanceof EnvError))
    console.error(e)

  queryClient.end().then(()=>{
    console.log('Db connection closed')
  }).catch(()=>{
    console.log('Cannot close db connection')
  })
  closeTaskQueues().then(()=>{
    console.log('Task queue closed')
  }).catch(()=>{
    console.log('Cannot close task qeue')
  })
})
