import { pool } from '../config/db/basedatos.js'
import { validarDocumento } from '../utils/validaciones.js'
import { rutaArchivo, borrarArchivo } from '../config/archivos.js'

export const insertarDocumento = async (req, res) => {
    try {
        const errores = validarDocumento(req.body, { esNuevo: true })
        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos de documento inválidos', errores })
        }

        const { radicado, titulo, tipo, estado, dependencia, fecha_registro, usuario_id } = req.body
        const [result] = await pool.query(
            `INSERT INTO documento (radicado, titulo, tipo, estado, dependencia, fecha_registro, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [radicado.trim(), titulo.trim(), tipo, estado, dependencia, fecha_registro, usuario_id || null]
        )
        res.status(201).json({ mensaje: 'Documento radicado correctamente', id: result.insertId })
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya existe un documento con ese radicado' })
        }
        res.status(500).json({ mensaje: 'Error al insertar documento', error: error.message })
    }
}

export const consultarDocumentos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT d.*, u.nombre AS usuario_nombre
             FROM documento d
             LEFT JOIN usuario u ON u.id = d.usuario_id
             ORDER BY d.fecha_registro DESC`
        )
        res.json(rows)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar documentos', error: error.message })
    }
}

export const consultarDocumento = async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.query(`SELECT * FROM documento WHERE id = ?`, [id])
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' })
        }
        res.json(rows[0])
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar documento', error: error.message })
    }
}

export const modificarDocumento = async (req, res) => {
    try {
        const errores = validarDocumento(req.body, { esNuevo: false })
        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos de documento inválidos', errores })
        }

        const { id } = req.params
        const { titulo, tipo, estado, dependencia, fecha_registro, usuario_id } = req.body
        const [result] = await pool.query(
            `UPDATE documento SET titulo = ?, tipo = ?, estado = ?, dependencia = ?, fecha_registro = ?, usuario_id = ?
             WHERE id = ?`,
            [titulo.trim(), tipo, estado, dependencia, fecha_registro, usuario_id || null, id]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' })
        }
        res.json({ mensaje: 'Documento actualizado correctamente' })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al modificar documento', error: error.message })
    }
}

export const eliminarDocumento = async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.query(`SELECT archivo FROM documento WHERE id = ?`, [id])
        const [result] = await pool.query(`DELETE FROM documento WHERE id = ?`, [id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' })
        }
        borrarArchivo(rows[0]?.archivo)
        res.json({ mensaje: 'Documento eliminado correctamente' })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar documento', error: error.message })
    }
}

// Adjunta o reemplaza el PDF de un documento (el archivo ya fue validado por el middleware subirPdf)
export const guardarArchivo = async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.query(`SELECT archivo FROM documento WHERE id = ?`, [id])
        if (rows.length === 0) {
            borrarArchivo(req.file.filename)
            return res.status(404).json({ mensaje: 'Documento no encontrado' })
        }

        await pool.query(
            `UPDATE documento SET archivo = ?, archivo_nombre = ? WHERE id = ?`,
            [req.file.filename, req.file.originalname, id]
        )
        borrarArchivo(rows[0].archivo)
        res.json({ mensaje: 'Archivo PDF cargado correctamente' })
    } catch (error) {
        borrarArchivo(req.file?.filename)
        res.status(500).json({ mensaje: 'Error al guardar el archivo', error: error.message })
    }
}

export const descargarArchivo = async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.query(`SELECT radicado, archivo, archivo_nombre FROM documento WHERE id = ?`, [id])
        if (rows.length === 0 || !rows[0].archivo) {
            return res.status(404).json({ mensaje: 'El documento no tiene un archivo PDF cargado' })
        }

        const nombre = rows[0].archivo_nombre || `${rows[0].radicado}.pdf`
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(nombre)}`)
        res.sendFile(rutaArchivo(rows[0].archivo), (error) => {
            if (error && !res.headersSent) {
                res.status(404).json({ mensaje: 'No se encontró el archivo PDF en el servidor' })
            }
        })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar el archivo', error: error.message })
    }
}
