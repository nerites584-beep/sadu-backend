import { Router } from 'express'
import {
    insertarUsuario,
    consultarUsuarios,
    consultarUsuario,
    modificarUsuario,
    eliminarUsuario
} from '../controllers/index.js'

const router = Router()

router.post('/usuario',       insertarUsuario)
router.get('/usuario',        consultarUsuarios)
router.get('/usuario/:id',    consultarUsuario)
router.patch('/usuario/:id',  modificarUsuario)
router.delete('/usuario/:id', eliminarUsuario)

export default router
