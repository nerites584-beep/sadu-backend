import { Router } from 'express'
import {
    insertarDocumento,
    consultarDocumentos,
    consultarDocumento,
    modificarDocumento,
    eliminarDocumento
} from '../controllers/index.js'

const router = Router()

router.post('/documento',       insertarDocumento)
router.get('/documento',        consultarDocumentos)
router.get('/documento/:id',    consultarDocumento)
router.patch('/documento/:id',  modificarDocumento)
router.delete('/documento/:id', eliminarDocumento)

export default router
