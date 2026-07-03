import { Router } from 'express'
import {
    insertarUsuario,
    consultarUsuarios,
    consultarUsuario,
    modificarUsuario,
    eliminarUsuario
} from '../controllers/index.js'
import { autenticar, autorizar } from '../middlewares/autenticacion.js'

const router = Router()

// La gestión de usuarios queda restringida al rol Administrador
router.post('/usuario',       autenticar, autorizar('Administrador'), insertarUsuario)
router.get('/usuario',        autenticar, autorizar('Administrador'), consultarUsuarios)
router.get('/usuario/:id',    autenticar, autorizar('Administrador'), consultarUsuario)
router.patch('/usuario/:id',  autenticar, autorizar('Administrador'), modificarUsuario)
router.delete('/usuario/:id', autenticar, autorizar('Administrador'), eliminarUsuario)

export default router
