import { Router } from 'express'
import { login } from '../controllers/index.js'

const router = Router()

// Ruta pública: es la puerta de entrada al sistema
router.post('/login', login)

export default router
