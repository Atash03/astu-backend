import { drizzle} from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// function jestIsRunning() {
//   return process.env.JEST_WORKER_ID !== undefined
// }

const DB_URL = process.env.DATABASE_URL

console.log('Drizzle DATABASE_URL', DB_URL)
export const queryClient = postgres(DB_URL as string)
export const con = drizzle(queryClient)