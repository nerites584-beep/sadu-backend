import { Router } from 'express'
import {
    insertarDocumento,
    consultarDocumentos,
    consultarDocumento,
    modificarDocumento,
    eliminarDocumento,
    guardarArchivo,
    descargarArchivo
} from '../controllers/index.js'
import { autenticar, autorizar } from '../middlewares/autenticacion.js'
import { subirPdf } from '../middlewares/subida.js'

const router = Router()

// Consultar documentos: cualquier usuario autenticado
router.get('/documento',        autenticar, consultarDocumentos)
router.get('/documento/:id',    autenticar, consultarDocumento)

// Crear y modificar: Administrador o Funcionario
router.post('/documento',       autenticar, autorizar('Administrador', 'Funcionario'), insertarDocumento)
router.patch('/documento/:id',  autenticar, autorizar('Administrador', 'Funcionario'), modificarDocumento)

// Archivo PDF del documento: lo cargan y lo consultan Administrador o Funcionario
router.post('/documento/:id/archivo', autenticar, autorizar('Administrador', 'Funcionario'), subirPdf, guardarArchivo)
router.get('/documento/:id/archivo',  autenticar, autorizar('Administrador', 'Funcionario'), descargarArchivo)

// Eliminar: solo Administrador
router.delete('/documento/:id', autenticar, autorizar('Administrador'), eliminarDocumento)

export default router
