// Pruebas unitarias del módulo de reportes (conteos y exportación CSV)

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
    agruparPor,
    agruparPorMes,
    resumirDocumentos,
    describirFiltros,
    generarCsv,
    fechaTexto
} from '../app/utils/reportes.js'

const documentos = [
    { radicado: 'ALC-2026-001', titulo: 'Decreto de presupuesto', tipo: 'Decreto', estado: 'Activo',
      dependencia: 'Secretaría de Hacienda', fecha_registro: new Date(2026, 0, 15), usuario_nombre: 'Administrador SADU', archivo: 'a.pdf' },
    { radicado: 'ALC-2026-002', titulo: 'Respuesta PQRSDF; ciudadano', tipo: 'Oficio de Respuesta', estado: 'En trámite',
      dependencia: 'Secretaría General', fecha_registro: '2026-02-10', usuario_nombre: 'Ana Pérez', archivo: null },
    { radicado: 'ALC-2026-003', titulo: 'Decreto de nombramiento', tipo: 'Decreto', estado: 'Activo',
      dependencia: 'Secretaría General', fecha_registro: '2026-02-20', usuario_nombre: null, archivo: null }
]

describe('Módulo reportes — conteos', () => {
    test('agrupa por estado de mayor a menor', () => {
        assert.deepEqual(agruparPor(documentos, 'estado'), [
            { etiqueta: 'Activo', total: 2 },
            { etiqueta: 'En trámite', total: 1 }
        ])
    })

    test('agrupa por mes en orden cronológico', () => {
        assert.deepEqual(agruparPorMes(documentos), [
            { etiqueta: 'Ene 2026', total: 1 },
            { etiqueta: 'Feb 2026', total: 2 }
        ])
    })

    test('el resumen cuenta el total y los documentos con PDF', () => {
        const resumen = resumirDocumentos(documentos)
        assert.equal(resumen.total, 3)
        assert.equal(resumen.conArchivo, 1)
        assert.equal(resumen.porTipo[0].etiqueta, 'Decreto')
    })

    test('una lista vacía produce un resumen en cero', () => {
        const resumen = resumirDocumentos([])
        assert.equal(resumen.total, 0)
        assert.deepEqual(resumen.porEstado, [])
    })

    test('convierte fechas Date al formato AAAA-MM-DD', () => {
        assert.equal(fechaTexto(new Date(2026, 6, 5)), '2026-07-05')
        assert.equal(fechaTexto('2026-02-10T05:00:00.000Z'), '2026-02-10')
    })

    test('describe los filtros aplicados para el encabezado del PDF', () => {
        assert.equal(describirFiltros({}), 'Todos los documentos')
        assert.equal(describirFiltros({ estado: 'Activo', desde: '2026-01-01' }), 'Estado: Activo · Desde: 2026-01-01')
    })
})

describe('Módulo reportes — exportación CSV', () => {
    const csv = generarCsv(documentos)
    const lineas = csv.replace('\uFEFF', '').split('\r\n')

    test('incluye el BOM para que Excel respete las tildes', () => {
        assert.equal(csv.charCodeAt(0), 0xFEFF)
    })

    test('tiene una fila de encabezados más una por documento', () => {
        assert.equal(lineas.length, 4)
        assert.match(lineas[0], /^Radicado;Título;Tipo;Estado/)
    })

    test('encierra entre comillas los textos que contienen punto y coma', () => {
        assert.match(lineas[2], /"Respuesta PQRSDF; ciudadano"/)
    })

    test('indica si el documento tiene PDF adjunto', () => {
        assert.match(lineas[1], /;Sí$/)
        assert.match(lineas[2], /;No$/)
    })
})
