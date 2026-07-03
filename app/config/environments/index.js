import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Si no se define NODE_ENV se usa el entorno de desarrollo por defecto
const entorno = process.env.NODE_ENV || 'developer'

dotenv.config({
    path: path.join(__dirname, `${entorno}.env`)
})

const config = {
    port: process.env.PORT
}

export default config
