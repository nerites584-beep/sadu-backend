import { Router } from 'express'
import {
    insertarDocumento,
    consultarDocumentos,
    consultarDocumento,
    modificarDocumento,
    eliminarDocumento
} from '../controllers/index.js'
import { autenticar, autorizar } from '../middlewares/autenticacion.js'

const router = Router()

// Consultar documentos: cualquier usuario autenticado
router.get('/documento',        autenticar, consultarDocumentos)
router.get('/documento/:id',    autenticar, consultarDocumento)

// Crear y modificar: Administrador o Funcionario
router.post('/documento',       autenticar, autorizar('Administrador', 'Funcionario'), insertarDocumento)
router.patch('/documento/:id',  autenticar, autorizar('Administrador', 'Funcionario'), modificarDocumento)

// Eliminar: solo Administrador
router.delete('/documento/:id', autenticar, autorizar('Administrador'), eliminarDocumento)

export default router
