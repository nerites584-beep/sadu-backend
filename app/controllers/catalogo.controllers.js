import { pool } from '../config/db/basedatos.js'
import { registrarAuditoria, ACCIONES } from '../utils/auditoria.js'

// Las dos tablas de catálogo comparten estructura; solo cambia el nombre de la columna "activo"
const CATALOGOS = {
    dependencia: { tabla: 'dependencia',    activo: 'activa', etiqueta: 'La dependencia' },
    tipo:        { tabla: 'tipo_documento', activo: 'activo', etiqueta: 'El tipo de documento' }
}

const aBooleano = (fila) => ({ ...fila, activo: Boolean(fila.activo) })

// GET /catalogo — dependencias y tipos con el número de documentos de cada uno
export const consultarCatalogos = async (req, res) => {
    try {
        const [dependencias] = await pool.query(
            `SELECT dp.id, dp.nombre, dp.activa AS activo, COUNT(d.id) AS documentos
             FROM dependencia dp LEFT JOIN documento d ON d.dependencia_id = dp.id
             GROUP BY dp.id ORDER BY dp.nombre`
        )
        const [tipos] = await pool.query(
            `SELECT t.id, t.nombre, t.activo, COUNT(d.id) AS documentos
             FROM tipo_documento t LEFT JOIN documento d ON d.tipo_documento_id = t.id
             GROUP BY t.id ORDER BY t.nombre`
        )
        res.json({ dependencias: dependencias.map(aBooleano), tipos: tipos.map(aBooleano) })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar los catálogos', error: error.message })
    }
}

// POST /catalogo/:clase — agrega una dependencia o un tipo de documento
export const insertarCatalogo = async (req, res) => {
    const catalogo = CATALOGOS[req.params.clase]
    if (!catalogo) return res.status(404).json({ mensaje: 'Catálogo no encontrado' })

    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : ''
    if (nombre.length < 3 || nombre.length > 100) {
        const errores = ['El nombre es obligatorio y debe tener entre 3 y 100 caracteres']
        return res.status(400).json({ mensaje: errores[0], errores })
    }

    try {
        const [result] = await pool.query(`INSERT INTO ${catalogo.tabla} (nombre) VALUES (?)`, [nombre])
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.CREAR, entidad: catalogo.tabla,
            entidadId: result.insertId, detalle: nombre
        })
        res.status(201).json({ mensaje: `${catalogo.etiqueta} se agregó correctamente`, id: result.insertId })
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: `${catalogo.etiqueta} "${nombre}" ya existe` })
        }
        res.status(500).json({ mensaje: 'Error al guardar en el catálogo', error: error.message })
    }
}

// PATCH /catalogo/:clase/:id — activa o desactiva un valor.
// No se eliminan: los documentos antiguos siguen apuntando a ellos.
export const cambiarEstadoCatalogo = async (req, res) => {
    const catalogo = CATALOGOS[req.params.clase]
    if (!catalogo) return res.status(404).json({ mensaje: 'Catálogo no encontrado' })

    try {
        const activo = req.body?.activo === true || req.body?.activo === 'true'
        const [result] = await pool.query(
            `UPDATE ${catalogo.tabla} SET ${catalogo.activo} = ? WHERE id = ?`, [activo, req.params.id]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Valor de catálogo no encontrado' })
        }
        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.EDITAR, entidad: catalogo.tabla,
            entidadId: Number(req.params.id), detalle: activo ? 'Activado' : 'Desactivado'
        })
        res.json({ mensaje: `${catalogo.etiqueta} quedó ${activo ? 'activo' : 'inactivo'}` })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el catálogo', error: error.message })
    }
}
