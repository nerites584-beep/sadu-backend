import { pool } from '../config/db/basedatos.js'
import { hashearPassword } from '../utils/seguridad.js'
import { validarUsuario } from '../utils/validaciones.js'
import { registrarAuditoria, ACCIONES } from '../utils/auditoria.js'

export const insertarUsuario = async (req, res) => {
    try {
        const errores = validarUsuario(req.body, { esNuevo: true })
        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos de usuario inválidos', errores })
        }

        const { nombre, email, rol, password } = req.body
        const passwordHash = await hashearPassword(password)

        const [result] = await pool.query(
            `INSERT INTO usuario (nombre, email, rol, password) VALUES (?, ?, ?, ?)`,
            [nombre.trim(), email.trim(), rol, passwordHash]
        )
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.CREAR, entidad: 'usuario',
            entidadId: result.insertId, detalle: `${email.trim()} · rol ${rol}`
        })
        res.status(201).json({ mensaje: 'Usuario creado correctamente', id: result.insertId })
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese email' })
        }
        res.status(500).json({ mensaje: 'Error al insertar usuario', error: error.message })
    }
}

export const consultarUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, nombre, email, rol FROM usuario`)
        res.json(rows)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar usuarios', error: error.message })
    }
}

export const consultarUsuario = async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.query(
            `SELECT id, nombre, email, rol FROM usuario WHERE id = ?`, [id]
        )
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' })
        }
        res.json(rows[0])
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar usuario', error: error.message })
    }
}

export const modificarUsuario = async (req, res) => {
    try {
        const errores = validarUsuario(req.body, { esNuevo: false })
        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos de usuario inválidos', errores })
        }

        const { id } = req.params
        const { nombre, email, rol } = req.body
        const [result] = await pool.query(
            `UPDATE usuario SET nombre = ?, email = ?, rol = ? WHERE id = ?`,
            [nombre.trim(), email.trim(), rol, id]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' })
        }
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.EDITAR, entidad: 'usuario',
            entidadId: Number(id), detalle: `${email.trim()} · rol ${rol}`
        })
        res.json({ mensaje: 'Usuario actualizado correctamente' })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al modificar usuario', error: error.message })
    }
}

export const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params
        if (Number(id) === Number(req.usuario?.id)) {
            return res.status(400).json({ mensaje: 'No puede eliminar su propio usuario mientras tiene la sesión iniciada' })
        }

        // Un usuario responsable de documentos no se borra: se perdería la trazabilidad del radicado
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM documento WHERE usuario_id = ?`, [id]
        )
        if (total > 0) {
            return res.status(409).json({
                mensaje: `No se puede eliminar el usuario porque es responsable de ${total} documento(s). ` +
                         'Si ya no debe radicar ni editar documentos, cambie su rol a Consulta.'
            })
        }

        const [[eliminado]] = await pool.query(`SELECT email FROM usuario WHERE id = ?`, [id])
        const [result] = await pool.query(`DELETE FROM usuario WHERE id = ?`, [id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' })
        }
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.ELIMINAR, entidad: 'usuario',
            entidadId: Number(id), detalle: eliminado?.email
        })
        res.json({ mensaje: 'Usuario eliminado correctamente' })
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ mensaje: 'No se puede eliminar el usuario porque tiene documentos asociados' })
        }
        res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message })
    }
}
