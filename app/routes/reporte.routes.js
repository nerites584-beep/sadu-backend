import { Router } from 'express'
import { consultarReporte, exportarReporte } from '../controllers/index.js'
import { autenticar, autorizar } from '../middlewares/autenticacion.js'

const router = Router()

// Resumen para el dashboard: cualquier usuario autenticado
// Exportación del listado (CSV y PDF): Administrador o Funcionario
router.get('/reporte',          autenticar, consultarReporte)
router.get('/reporte/exportar', autenticar, autorizar('Administrador', 'Funcionario'), exportarReporte)

export default router
