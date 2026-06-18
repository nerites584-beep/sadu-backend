import { pool } from '../config/db/basedatos.js'

export const insertarDocumento = async (req, res) => {
    try {
        const { radicado, titulo, tipo, estado, dependencia, fecha_registro, usuario_id } = req.body
        const result = await pool.query(
            `INSERT INTO documento (radicado, titulo, tipo, estado, dependencia, fecha_registro, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [radicado, titulo, tipo, estado, dependencia, fecha_registro, usuario_id]
        )
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al insertar documento', error })
    }
}

export const consultarDocumentos = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM documento`)
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar documentos', error })
    }
}

export const consultarDocumento = async (req, res) => {
    try {
        const { id } = req.params
        const result = await pool.query(`SELECT * FROM documento WHERE id = ?`, [id])
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar documento', error })
    }
}

export const modificarDocumento = async (req, res) => {
    try {
        const { id } = req.params
        const { titulo, tipo, estado, dependencia, fecha_registro, usuario_id } = req.body
        const result = await pool.query(
            `UPDATE documento SET titulo = ?, tipo = ?, estado = ?, dependencia = ?, fecha_registro = ?, usuario_id = ?
             WHERE id = ?`,
            [titulo, tipo, estado, dependencia, fecha_registro, usuario_id, id]
        )
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al modificar documento', error })
    }
}

export const eliminarDocumento = async (req, res) => {
    try {
        const { id } = req.params
        const result = await pool.query(`DELETE FROM documento WHERE id = ?`, [id])
        res.json(result)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar documento', error })
    }
}
