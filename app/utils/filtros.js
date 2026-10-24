// Módulo de filtros de búsqueda de documentos
// Convierte los parámetros de la URL (?q=&estado=&tipo=...) en una cláusula WHERE
// con parámetros (?) para que la consulta quede protegida contra inyección SQL.
// Es una función pura: se puede probar sin base de datos.

import { ESTADOS_VALIDOS } from './validaciones.js'

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/
const LARGO_MAXIMO = 100

const texto = (valor) =>
    typeof valor === 'string' ? valor.trim().slice(0, LARGO_MAXIMO) : ''

export const construirFiltroDocumentos = (query = {}) => {
    const condiciones = []
    const params = []
    const aplicados = {}

    const q = texto(query.q)
    if (q) {
        condiciones.push('(d.radicado LIKE ? OR d.titulo LIKE ?)')
        params.push(`%${q}%`, `%${q}%`)
        aplicados.q = q
    }

    const estado = texto(query.estado)
    if (ESTADOS_VALIDOS.includes(estado)) {
        condiciones.push('d.estado = ?')
        params.push(estado)
        aplicados.estado = estado
    }

    for (const campo of ['tipo', 'dependencia']) {
        const valor = texto(query[campo])
        if (valor) {
            condiciones.push(`d.${campo} = ?`)
            params.push(valor)
            aplicados[campo] = valor
        }
    }

    const desde = texto(query.desde)
    if (REGEX_FECHA.test(desde)) {
        condiciones.push('d.fecha_registro >= ?')
        params.push(desde)
        aplicados.desde = desde
    }

    const hasta = texto(query.hasta)
    if (REGEX_FECHA.test(hasta)) {
        condiciones.push('d.fecha_registro <= ?')
        params.push(hasta)
        aplicados.hasta = hasta
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''
    return { where, params, aplicados }
}
