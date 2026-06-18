import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.join(__dirname, `${process.env.NODE_ENV}.env`)
})

const config = {
    port: process.env.PORT
}

export default config
