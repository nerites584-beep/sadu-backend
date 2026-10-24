import { Router } from 'express'
import authRoutes from './auth.routes.js'
import documentoRoutes from './documento.routes.js'
import usuarioRoutes from './usuario.routes.js'
import reporteRoutes from './reporte.routes.js'
import { pool } from '../config/db/basedatos.js'

const router = Router()

// Verificación de estado para el hosting: confirma que el servicio y la base de datos responden
router.get('/salud', async (req, res) => {
    try {
        await pool.query('SELECT 1')
        res.json({ estado: 'ok', servicio: 'sadu-backend', basedatos: 'conectada' })
    } catch {
        res.status(503).json({ estado: 'error', servicio: 'sadu-backend', basedatos: 'sin conexión' })
    }
})

router.use(authRoutes)
router.use(documentoRoutes)
router.use(usuarioRoutes)
router.use(reporteRoutes)

export default router
