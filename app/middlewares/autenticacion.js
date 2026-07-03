// Middleware de autenticación y autorización
// - autenticar: exige un token JWT válido en la cabecera Authorization
// - autorizar: exige además que el usuario tenga uno de los roles permitidos

import { verificarToken } from '../utils/seguridad.js'

export const autenticar = (req, res, next) => {
    const cabecera = req.headers.authorization || ''
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso no autorizado: token requerido' })
    }

    try {
        req.usuario = verificarToken(token)
        next()
    } catch {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' })
    }
}

export const autorizar = (...rolesPermitidos) => (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
            mensaje: `Acceso denegado: se requiere rol ${rolesPermitidos.join(' o ')}`
        })
    }
    next()
}
