import { Router } from 'express'
import { consultarAuditoria } from '../controllers/auditoria.controllers.js'
import { autenticar, autorizar } from '../middlewares/autenticacion.js'

const router = Router()

// La bitácora de auditoría solo la consulta el Administrador
router.get('/auditoria', autenticar, autorizar('Administrador'), consultarAuditoria)

export default router
