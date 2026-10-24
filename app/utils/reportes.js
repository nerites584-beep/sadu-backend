// Módulo de reportes
// Funciones puras que resumen la lista de documentos (conteos por estado,
// tipo, dependencia y mes) y la convierten a CSV para abrirla en Excel.

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// mysql2 entrega las columnas DATE como objetos Date; las vistas y el CSV usan AAAA-MM-DD
export const fechaTexto = (valor) => {
    if (valor instanceof Date) {
        const mes = String(valor.getMonth() + 1).padStart(2, '0')
        const dia = String(valor.getDate()).padStart(2, '0')
        return `${valor.getFullYear()}-${mes}-${dia}`
    }
    return String(valor ?? '').slice(0, 10)
}

// Cuenta los documentos por el valor de un campo, de mayor a menor
export const agruparPor = (documentos, campo) => {
    const conteo = new Map()
    for (const doc of documentos) {
        const clave = doc[campo] || 'Sin dato'
        conteo.set(clave, (conteo.get(clave) || 0) + 1)
    }
    return [...conteo]
        .map(([etiqueta, total]) => ({ etiqueta, total }))
        .sort((a, b) => b.total - a.total || a.etiqueta.localeCompare(b.etiqueta, 'es'))
}

// Cuenta los documentos por mes de registro, en orden cronológico
export const agruparPorMes = (documentos) => {
    const conteo = new Map()
    for (const doc of documentos) {
        const clave = fechaTexto(doc.fecha_registro).slice(0, 7)   // AAAA-MM
        if (clave.length === 7) conteo.set(clave, (conteo.get(clave) || 0) + 1)
    }
    return [...conteo]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([clave, total]) => {
            const [anio, mes] = clave.split('-')
            return { etiqueta: `${MESES[Number(mes) - 1]} ${anio}`, total }
        })
}

export const resumirDocumentos = (documentos) => ({
    total:          documentos.length,
    conArchivo:     documentos.filter(d => d.archivo).length,
    porEstado:      agruparPor(documentos, 'estado'),
    porTipo:        agruparPor(documentos, 'tipo'),
    porDependencia: agruparPor(documentos, 'dependencia'),
    porMes:         agruparPorMes(documentos)
})

// Texto legible de los filtros aplicados, para el encabezado del PDF
export const describirFiltros = (aplicados = {}) => {
    const partes = []
    if (aplicados.q)           partes.push(`Búsqueda: "${aplicados.q}"`)
    if (aplicados.estado)      partes.push(`Estado: ${aplicados.estado}`)
    if (aplicados.tipo)        partes.push(`Tipo: ${aplicados.tipo}`)
    if (aplicados.dependencia) partes.push(`Dependencia: ${aplicados.dependencia}`)
    if (aplicados.desde)       partes.push(`Desde: ${aplicados.desde}`)
    if (aplicados.hasta)       partes.push(`Hasta: ${aplicados.hasta}`)
    return partes.length > 0 ? partes.join(' · ') : 'Todos los documentos'
}

// Excel en español usa punto y coma como separador; el BOM conserva las tildes
const celdaCsv = (valor) => {
    const texto = String(valor ?? '')
    return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export const COLUMNAS_REPORTE = [
    ['radicado',       'Radicado'],
    ['titulo',         'Título'],
    ['tipo',           'Tipo'],
    ['estado',         'Estado'],
    ['dependencia',    'Dependencia'],
    ['fecha_registro', 'Fecha de registro'],
    ['usuario_nombre', 'Responsable'],
    ['archivo',        'PDF adjunto']
]

const valorColumna = (doc, campo) => {
    if (campo === 'fecha_registro') return fechaTexto(doc.fecha_registro)
    if (campo === 'archivo') return doc.archivo ? 'Sí' : 'No'
    return doc[campo]
}

export const generarCsv = (documentos) => {
    const filas = [COLUMNAS_REPORTE.map(([, titulo]) => titulo)]
    for (const doc of documentos) {
        filas.push(COLUMNAS_REPORTE.map(([campo]) => valorColumna(doc, campo)))
    }
    return '﻿' + filas.map(fila => fila.map(celdaCsv).join(';')).join('\r\n')
}

export { valorColumna }
