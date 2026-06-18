import { createPool } from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.join(__dirname, `../../environments/${process.env.NODE_ENV}.env`)
})

export const pool = createPool({
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME
})
