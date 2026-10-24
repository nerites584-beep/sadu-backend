import { pool } from '../config/db/basedatos.js'
import { ACCIONES } from '../utils/auditoria.js'

const POR_PAGINA = 50
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/

// GET /auditoria?accion=&usuario=&desde=&hasta=&pagina= — bitácora para el Administrador
export const consultarAuditoria = async (req, res) => {
    try {
        const condiciones = []
        const params = []
        const { accion, usuario, desde, hasta } = req.query

        if (Object.values(ACCIONES).includes(accion)) {
            condiciones.push('accion = ?')
            params.push(accion)
        }
        if (typeof usuario === 'string' && usuario.trim()) {
            condiciones.push('usuario_email LIKE ?')
            params.push(`%${usuario.trim().slice(0, 100)}%`)
        }
        if (REGEX_FECHA.test(desde ?? '')) {
            condiciones.push('fecha >= ?')
            params.push(`${desde} 00:00:00`)
        }
        if (REGEX_FECHA.test(hasta ?? '')) {
            condiciones.push('fecha <= ?')
            params.push(`${hasta} 23:59:59`)
        }

        const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''
        const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1)

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM auditoria ${where}`, params)
        const [registros] = await pool.query(
            `SELECT id, fecha, usuario_email, accion, entidad, entidad_id, detalle
             FROM auditoria ${where}
             ORDER BY fecha DESC, id DESC
             LIMIT ? OFFSET ?`,
            [...params, POR_PAGINA, (pagina - 1) * POR_PAGINA]
        )

        res.json({
            registros,
            total,
            pagina,
            paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
            acciones: Object.values(ACCIONES)
        })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar la auditoría', error: error.message })
    }
}
