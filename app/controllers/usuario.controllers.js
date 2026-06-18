import { pool } from '../config/db/basedatos.js'

export const insertarUsuario = async (req, res) => {
    try {
        const { nombre, email, rol, password } = req.body
        const result = await pool.query(
            `INSERT INTO usuario (nombre, email, rol, password) VALUES (?, ?, ?, ?)`,
            [nombre, email, rol, password]
        )
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al insertar usuario', error })
    }
}

export const consultarUsuarios = async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, nombre, email, rol FROM usuario`)
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar usuarios', error })
    }
}

export const consultarUsuario = async (req, res) => {
    try {
        const { id } = req.params
        const result = await pool.query(
            `SELECT id, nombre, email, rol FROM usuario WHERE id = ?`, [id]
        )
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar usuario', error })
    }
}

export const modificarUsuario = async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, email, rol } = req.body
        const result = await pool.query(
            `UPDATE usuario SET nombre = ?, email = ?, rol = ? WHERE id = ?`,
            [nombre, email, rol, id]
        )
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al modificar usuario', error })
    }
}

export const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params
        const result = await pool.query(`DELETE FROM usuario WHERE id = ?`, [id])
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar usuario', error })
    }
}
