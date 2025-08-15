import { queryClient } from './db/drizzle/drizzle'
import { logger } from './lib/logger'
import { init as initPeriodicTasks } from './periodic_tasks/init'
import { init as initTopUpPlugins} from '@/document/topUpPlugins/init'

async function init(){
  await initPeriodicTasks('drizzle')
  await initPeriodicTasks('json')
  await initTopUpPlugins('drizzle')
  await initTopUpPlugins('json')

  await queryClient.end()
}

init().then(()=>{
  logger.log('Initialized succefully')
}).catch((e)=>{
  logger.error(e)
})