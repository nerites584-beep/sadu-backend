import express from 'express'
import config from './config/environments/index.js'
import routes from './routes/index.js'
import { aplicarMigraciones } from './config/db/migraciones.js'
import { verificarEntorno } from './config/environments/verificar.js'
import { cabecerasSeguridad, rutaNoEncontrada, manejadorErrores } from './middlewares/seguridad.js'

// Si falta una variable obligatoria (por ejemplo JWT_SECRET) el servidor no arranca
verificarEntorno()

const server = express()

server.disable('x-powered-by')   // no revelar que el servidor usa Express
server.use(cabecerasSeguridad)
server.use(express.json())
server.use(routes)

// Siempre al final: ruta inexistente y errores no controlados
server.use(rutaNoEncontrada)
server.use(manejadorErrores)

await aplicarMigraciones()

server.listen(config.port, () => {
    console.log(`Servidor SADU backend corriendo en el puerto ${config.port}`)
})

export default server
