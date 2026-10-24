import { Router } from 'express'
import { consultarCatalogos, insertarCatalogo, cambiarEstadoCatalogo } from '../controllers/catalogo.controllers.js'
import { autenticar, autorizar } from '../middlewares/autenticacion.js'

const router = Router()

// Consultar catálogos: cualquier usuario autenticado (llenan formularios y filtros)
router.get('/catalogo', autenticar, consultarCatalogos)

// Agregar, activar o desactivar valores: solo Administrador
router.post('/catalogo/:clase',      autenticar, autorizar('Administrador'), insertarCatalogo)
router.patch('/catalogo/:clase/:id', autenticar, autorizar('Administrador'), cambiarEstadoCatalogo)

export default router
