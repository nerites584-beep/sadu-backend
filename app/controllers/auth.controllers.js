import { pool } from '../config/db/basedatos.js'
import { verificarPassword, generarToken } from '../utils/seguridad.js'
import { validarLogin } from '../utils/validaciones.js'
import { limitadorLogin } from '../utils/limiteIntentos.js'
import { registrarAuditoria, ACCIONES } from '../utils/auditoria.js'

// POST /login — autentica al usuario y devuelve un token JWT
export const login = async (req, res) => {
    try {
        const errores = validarLogin(req.body)
        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos de acceso inválidos', errores })
        }

        const email = req.body.email.trim()
        const { password } = req.body

        // Cuenta bloqueada por demasiados intentos fallidos
        const estado = limitadorLogin.consultar(email)
        if (estado.bloqueado) {
            return res.status(429).json({
                mensaje: `Demasiados intentos fallidos. Intente de nuevo en ${estado.minutos} minuto(s).`
            })
        }

        const [rows] = await pool.query(
            `SELECT id, nombre, email, rol, password FROM usuario WHERE email = ?`,
            [email]
        )

        // Mensaje genérico: no se revela si falló el email o la contraseña
        const usuario = rows[0]
        if (!usuario || !(await verificarPassword(password, usuario.password))) {
            const fallo = limitadorLogin.registrarFallo(email)
            await registrarAuditoria({
                usuario: usuario ? { id: usuario.id, email } : null,
                email,
                accion: fallo.bloqueado ? ACCIONES.CUENTA_BLOQUEADA : ACCIONES.INTENTO_FALLIDO,
                entidad: 'sesion',
                detalle: fallo.bloqueado
                    ? `Cuenta bloqueada ${fallo.minutos} minutos tras ${limitadorLogin.maxIntentos} intentos fallidos`
                    : `Contraseña o correo incorrecto (quedan ${fallo.intentosRestantes} intentos)`
            })

            if (fallo.bloqueado) {
                return res.status(429).json({
                    mensaje: `Demasiados intentos fallidos. La cuenta queda bloqueada ${fallo.minutos} minutos.`
                })
            }
            return res.status(401).json({
                mensaje: `Credenciales incorrectas. Le quedan ${fallo.intentosRestantes} intento(s).`
            })
        }

        limitadorLogin.reiniciar(email)
        const token = generarToken(usuario)
        delete usuario.password

        await registrarAuditoria({ usuario, accion: ACCIONES.INICIO_SESION, entidad: 'sesion', detalle: `Rol ${usuario.rol}` })
        res.json({ mensaje: 'Autenticación exitosa', token, usuario })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el proceso de autenticación', error: error.message })
    }
}
