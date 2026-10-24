import { pool } from '../config/db/basedatos.js'
import { SELECT_DOCUMENTOS } from '../config/db/consultas.js'
import { validarDocumento } from '../utils/validaciones.js'
import { rutaArchivo, borrarArchivo } from '../config/archivos.js'
import { registrarAuditoria, ACCIONES } from '../utils/auditoria.js'
import { buscarDocumentos } from './reporte.controllers.js'

// Convierte los nombres de tipo y dependencia que llegan del formulario
// en los identificadores de los catálogos. Solo se aceptan valores activos.
const resolverCatalogos = async (tipo, dependencia) => {
    const [[tipoDoc]] = await pool.query(`SELECT id FROM tipo_documento WHERE nombre = ? AND activo = TRUE`, [tipo])
    const [[dep]] = await pool.query(`SELECT id FROM dependencia WHERE nombre = ? AND activa = TRUE`, [dependencia])

    const errores = []
    if (!tipoDoc) errores.push('El tipo de documento no existe en el catálogo o está inactivo')
    if (!dep) errores.push('La dependencia no existe en el catálogo o está inactiva')
    return { tipoId: tipoDoc?.id, dependenciaId: dep?.id, errores }
}

export const insertarDocumento = async (req, res) => {
    try {
        const errores = validarDocumento(req.body, { esNuevo: true })
        if (errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos de documento inválidos', errores })
        }

        const { radicado, titulo, tipo, estado, dependencia, fecha_registro, usuario_id } = req.body
        const catalogos = await resolverCatalogos(tipo, dependencia)
        if (catalogos.errores.length > 0) {
            return res.status(400).json({ mensaje: 'Datos de documento inválidos', errores: catalogos.errores })
        }

        const [result] = await pool.query(
            `INSERT INTO documento (radicado, titulo, tipo_documento_id, estado, dependencia_id, fecha_registro, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [radicado.trim(), titulo.trim(), catalogos.tipoId, estado, catalogos.dependenciaId, fecha_registro, usuario_id || null]
        )
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.CREAR, entidad: 'documento',
            entidadId: result.insertId, detalle: `Radicado ${radicado.trim()} · ${tipo} · ${dependencia}`
        })
        res.status(201).json({ mensaje: 'Documento radicado correctamente', id: result.insertId })
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya existe un documento con ese radicado' })
        }
        res.status(500).json({ mensaje: 'Error al insertar documento', error: error.message })
    }
}

// GET /documento — acepta filtros opcionales: ?q=&estado=&tipo=&dependencia=&desde=&hasta=
export const consultarDocumentos = async (req, res) => {
    try {
        const { documentos } = await buscarDocumentos(req.query)
        res.json(documentos)
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar documentos', error: error.message })
    }
}

export const consultarDocumento = async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.query(`${SELECT_DOCUMENTOS} WHERE d.id = ?`, [id])
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
        const [[anterior]] = await pool.query(`${SELECT_DOCUMENTOS} WHERE d.id = ?`, [id])
        if (!anterior) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' })
        }

        // Un tipo o dependencia que se desactivó después se puede conservar al editar
        const catalogos = await resolverCatalogos(tipo, dependencia)
        const tipoId = tipo === anterior.tipo ? anterior.tipo_documento_id : catalogos.tipoId
        const dependenciaId = dependencia === anterior.dependencia ? anterior.dependencia_id : catalogos.dependenciaId
        if (!tipoId || !dependenciaId) {
            return res.status(400).json({ mensaje: 'Datos de documento inválidos', errores: catalogos.errores })
        }

        await pool.query(
            `UPDATE documento SET titulo = ?, tipo_documento_id = ?, estado = ?, dependencia_id = ?, fecha_registro = ?, usuario_id = ?
             WHERE id = ?`,
            [titulo.trim(), tipoId, estado, dependenciaId, fecha_registro, usuario_id || null, id]
        )

        const cambioEstado = anterior.estado !== estado ? ` · estado ${anterior.estado} → ${estado}` : ''
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.EDITAR, entidad: 'documento',
            entidadId: Number(id), detalle: `Radicado ${anterior.radicado}${cambioEstado}`
        })
        res.json({ mensaje: 'Documento actualizado correctamente' })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al modificar documento', error: error.message })
    }
}

export const eliminarDocumento = async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await pool.query(`SELECT radicado, archivo FROM documento WHERE id = ?`, [id])
        const [result] = await pool.query(`DELETE FROM documento WHERE id = ?`, [id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' })
        }
        borrarArchivo(rows[0]?.archivo)
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.ELIMINAR, entidad: 'documento',
            entidadId: Number(id), detalle: `Radicado ${rows[0]?.radicado}`
        })
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
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.CARGAR_PDF, entidad: 'documento',
            entidadId: Number(id), detalle: req.file.originalname
        })
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
