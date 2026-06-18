import express from 'express'
import config from './config/environments/index.js'
import routes from './routes/index.js'

const server = express()

server.use(express.json())
server.use(routes)

server.listen(config.port, () => {
    console.log(`Servidor SADU backend corriendo en el puerto ${config.port}`)
})

export default server
