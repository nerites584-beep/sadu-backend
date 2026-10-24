// Pruebas unitarias del módulo de filtros de búsqueda de documentos

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { construirFiltroDocumentos } from '../app/utils/filtros.js'

describe('Módulo búsqueda — construcción de filtros', () => {
    test('sin filtros no agrega condiciones', () => {
        const { where, params } = construirFiltroDocumentos({})
        assert.equal(where, '')
        assert.deepEqual(params, [])
    })

    test('la búsqueda por texto revisa radicado y título con parámetros', () => {
        const { where, params } = construirFiltroDocumentos({ q: ' decreto ' })
        assert.match(where, /d\.radicado LIKE \? OR d\.titulo LIKE \?/)
        assert.deepEqual(params, ['%decreto%', '%decreto%'])
    })

    test('combina estado, tipo, dependencia y rango de fechas', () => {
        const { where, params, aplicados } = construirFiltroDocumentos({
            estado: 'Activo',
            tipo: 'Decreto',
            dependencia: 'Secretaría de Hacienda',
            desde: '2026-01-01',
            hasta: '2026-06-30'
        })
        assert.equal((where.match(/AND/g) || []).length, 4)
        assert.deepEqual(params, ['Activo', 'Decreto', 'Secretaría de Hacienda', '2026-01-01', '2026-06-30'])
        assert.equal(aplicados.dependencia, 'Secretaría de Hacienda')
    })

    test('ignora un estado que no existe en el catálogo', () => {
        const { where, params } = construirFiltroDocumentos({ estado: 'Perdido' })
        assert.equal(where, '')
        assert.deepEqual(params, [])
    })

    test('ignora fechas con formato incorrecto', () => {
        const { where } = construirFiltroDocumentos({ desde: '01/01/2026', hasta: 'ayer' })
        assert.equal(where, '')
    })

    test('un intento de inyección SQL queda como texto del parámetro', () => {
        const { where, params } = construirFiltroDocumentos({ q: "' OR 1=1 --" })
        assert.doesNotMatch(where, /OR 1=1/)
        assert.equal(params[0], "%' OR 1=1 --%")
    })

    test('recorta textos demasiado largos a 100 caracteres', () => {
        const { params } = construirFiltroDocumentos({ q: 'a'.repeat(300) })
        assert.equal(params[0].length, 102)   // 100 caracteres más los dos comodines %
    })
})
