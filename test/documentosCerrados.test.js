// Pruebas unitarias de la regla de documentos cerrados (Archivado o Anulado)

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { esDocumentoCerrado, puedeModificarDocumento } from '../app/utils/validaciones.js'

describe('Módulo documentos — regla de documentos cerrados', () => {
    test('Archivado y Anulado son estados cerrados', () => {
        assert.equal(esDocumentoCerrado('Archivado'), true)
        assert.equal(esDocumentoCerrado('Anulado'), true)
    })

    test('Activo y En trámite son estados abiertos', () => {
        assert.equal(esDocumentoCerrado('Activo'), false)
        assert.equal(esDocumentoCerrado('En trámite'), false)
    })

    test('el Funcionario modifica documentos abiertos', () => {
        assert.equal(puedeModificarDocumento('Activo', 'Funcionario'), true)
        assert.equal(puedeModificarDocumento('En trámite', 'Funcionario'), true)
    })

    test('el Funcionario no modifica documentos archivados ni anulados', () => {
        assert.equal(puedeModificarDocumento('Archivado', 'Funcionario'), false)
        assert.equal(puedeModificarDocumento('Anulado', 'Funcionario'), false)
    })

    test('el Administrador modifica documentos en cualquier estado', () => {
        for (const estado of ['Activo', 'En trámite', 'Archivado', 'Anulado']) {
            assert.equal(puedeModificarDocumento(estado, 'Administrador'), true)
        }
    })

    test('el rol Consulta nunca modifica documentos', () => {
        assert.equal(puedeModificarDocumento('Activo', 'Consulta'), false)
        assert.equal(puedeModificarDocumento('Archivado', 'Consulta'), false)
    })
})
