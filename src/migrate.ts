import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { logger } from './lib/logger'

async function runOnDb(dbUrl: string) {

  const sql = postgres(dbUrl, { max: 1 })
  const db = drizzle(sql)
  
  console.log('Running migrations')
  await migrate(db, { migrationsFolder: 'drizzle' })
  console.log('done.')
  await sql.end()
  console.log('connection closed.')
}

async function run() {
  if (!process.env.DATABASE_URL) {
    logger.marked('## DATABASE_URL should be specified in .env')
    logger.marked('## migration canceled')
    return
  }
  await runOnDb(process.env.DATABASE_URL)
}

run().then(()=>{
  console.log('Migrations applied succefully')
}).catch((e)=>{
  console.error(e)
})


