import { Router } from 'express'
import authRoutes from './auth.routes.js'
import documentoRoutes from './documento.routes.js'
import usuarioRoutes from './usuario.routes.js'

const router = Router()

router.use(authRoutes)
router.use(documentoRoutes)
router.use(usuarioRoutes)

export default router
