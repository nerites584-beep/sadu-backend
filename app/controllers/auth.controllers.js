import { pool } from '../config/db/basedatos.js'
import { verificarPassword, generarToken } from '../utils/seguridad.js'
import { validarLogin } from '../utils/validaciones.js'

// POST /login — autentica al usuario y devuelve un token JWT
export const login = async (req, res) => {
    try {
        const errores = validarLogin(req.body)
        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos de acceso inválidos', errores })
        }

        const { email, password } = req.body
        const [rows] = await pool.query(
            `SELECT id, nombre, email, rol, password FROM usuario WHERE email = ?`,
            [email.trim()]
        )

        // Mensaje genérico: no se revela si falló el email o la contraseña
        const usuario = rows[0]
        if (!usuario || !(await verificarPassword(password, usuario.password))) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
        }

        const token = generarToken(usuario)
        delete usuario.password

        res.json({ mensaje: 'Autenticación exitosa', token, usuario })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el proceso de autenticación', error: error.message })
    }
}
