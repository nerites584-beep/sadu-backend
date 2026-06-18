import { Router } from 'express'
import documentoRoutes from './documento.routes.js'
import usuarioRoutes from './usuario.routes.js'

const router = Router()

router.use(documentoRoutes)
router.use(usuarioRoutes)

export default router
