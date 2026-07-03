import { pool } from '../config/db/basedatos.js'
import { hashearPassword } from '../utils/seguridad.js'
import { validarUsuario } from '../utils/validaciones.js'

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
        res.json({ mensaje: 'Usuario actualizado correctamente' })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al modificar usuario', error: error.message })
    }
}

export const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params
        const [result] = await pool.query(`DELETE FROM usuario WHERE id = ?`, [id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' })
        }
        res.json({ mensaje: 'Usuario eliminado correctamente' })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message })
    }
}
