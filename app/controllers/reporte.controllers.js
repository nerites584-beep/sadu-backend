import { pool } from '../config/db/basedatos.js'
import { SELECT_DOCUMENTOS } from '../config/db/consultas.js'
import { construirFiltroDocumentos } from '../utils/filtros.js'
import { resumirDocumentos, generarCsv, describirFiltros } from '../utils/reportes.js'
import { generarPdf } from '../utils/reportePdf.js'
import { registrarAuditoria, ACCIONES } from '../utils/auditoria.js'

// Consulta los documentos que cumplen los filtros de la URL
export const buscarDocumentos = async (query) => {
    const { where, params, aplicados } = construirFiltroDocumentos(query)
    const [rows] = await pool.query(
        `${SELECT_DOCUMENTOS}
         ${where}
         ORDER BY d.fecha_registro DESC, d.id DESC`,
        params
    )
    return { documentos: rows, aplicados }
}

// GET /reporte — resumen de los documentos por estado, tipo, dependencia y mes
export const consultarReporte = async (req, res) => {
    try {
        const { documentos, aplicados } = await buscarDocumentos(req.query)
        res.json({ filtros: aplicados, ...resumirDocumentos(documentos) })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al generar el reporte', error: error.message })
    }
}

// GET /reporte/exportar?formato=csv|pdf — descarga el listado filtrado
export const exportarReporte = async (req, res) => {
    try {
        const formato = req.query.formato === 'pdf' ? 'pdf' : 'csv'
        const { documentos, aplicados } = await buscarDocumentos(req.query)
        // Fecha de hoy en Colombia (el servidor de Railway trabaja en UTC)
        const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
        const nombre = `reporte-documentos-sadu-${fecha}.${formato}`

        await registrarAuditoria({
            usuario: req.usuario, accion: ACCIONES.EXPORTAR, entidad: 'reporte',
            detalle: `${formato.toUpperCase()} · ${documentos.length} documento(s) · ${describirFiltros(aplicados)}`
        })

        res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`)

        if (formato === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            return res.send(generarCsv(documentos))
        }

        res.setHeader('Content-Type', 'application/pdf')
        generarPdf(documentos, resumirDocumentos(documentos), aplicados, req.usuario, res)
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ mensaje: 'Error al exportar el reporte', error: error.message })
        }
    }
}
