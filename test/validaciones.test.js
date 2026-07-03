// Pruebas unitarias del módulo de validaciones
// Se ejecutan con el test runner nativo de Node.js: npm test

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
    esEmailValido,
    esPasswordSegura,
    esRadicadoValido,
    validarUsuario,
    validarDocumento,
    validarLogin
} from '../app/utils/validaciones.js'

describe('Módulo usuarios — validación de email', () => {
    test('acepta un email institucional válido', () => {
        assert.equal(esEmailValido('admin@sanantonio.gov.co'), true)
    })

    test('rechaza un email sin arroba', () => {
        assert.equal(esEmailValido('adminsanantonio.gov.co'), false)
    })

    test('rechaza valores vacíos o no textuales', () => {
        assert.equal(esEmailValido(''), false)
        assert.equal(esEmailValido(null), false)
        assert.equal(esEmailValido(12345), false)
    })
})

describe('Módulo seguridad — política de contraseñas', () => {
    test('acepta una contraseña con mayúscula, minúscula y número', () => {
        assert.equal(esPasswordSegura('Admin123*'), true)
    })

    test('rechaza contraseñas cortas o débiles', () => {
        assert.equal(esPasswordSegura('1234'), false)
        assert.equal(esPasswordSegura('solominusculas'), false)
        assert.equal(esPasswordSegura('SOLOMAYUSCULAS1'), false)
    })
})

describe('Módulo documentos — validación de radicado', () => {
    test('acepta el formato institucional ALC-AAAA-NNN', () => {
        assert.equal(esRadicadoValido('ALC-2026-001'), true)
        assert.equal(esRadicadoValido('ALC-2026-12345'), true)
    })

    test('rechaza radicados con formato incorrecto', () => {
        assert.equal(esRadicadoValido('2026-001'), false)
        assert.equal(esRadicadoValido('ALC-26-1'), false)
        assert.equal(esRadicadoValido(''), false)
    })
})

describe('Módulo usuarios — validación completa', () => {
    const usuarioValido = {
        nombre: 'Nereida Granados',
        email: 'ngranados@sanantonio.gov.co',
        rol: 'Administrador',
        password: 'Clave123*'
    }

    test('un usuario válido no genera errores', () => {
        assert.deepEqual(validarUsuario(usuarioValido), [])
    })

    test('detecta rol inexistente', () => {
        const errores = validarUsuario({ ...usuarioValido, rol: 'SuperUsuario' })
        assert.equal(errores.length, 1)
        assert.match(errores[0], /rol/i)
    })

    test('en modo edición no exige contraseña', () => {
        const { password, ...sinPassword } = usuarioValido
        assert.deepEqual(validarUsuario(sinPassword, { esNuevo: false }), [])
    })

    test('acumula todos los errores de un objeto vacío', () => {
        const errores = validarUsuario({})
        assert.equal(errores.length, 4)
    })
})

describe('Módulo documentos — validación completa', () => {
    const documentoValido = {
        radicado: 'ALC-2026-010',
        titulo: 'Resolución de nombramiento',
        tipo: 'Resolución',
        estado: 'Activo',
        dependencia: 'Secretaría General',
        fecha_registro: '2026-07-01'
    }

    test('un documento válido no genera errores', () => {
        assert.deepEqual(validarDocumento(documentoValido), [])
    })

    test('detecta estado inválido', () => {
        const errores = validarDocumento({ ...documentoValido, estado: 'Perdido' })
        assert.equal(errores.length, 1)
        assert.match(errores[0], /estado/i)
    })

    test('detecta fecha con formato incorrecto', () => {
        const errores = validarDocumento({ ...documentoValido, fecha_registro: '01/07/2026' })
        assert.equal(errores.length, 1)
        assert.match(errores[0], /fecha/i)
    })

    test('en modo edición no exige radicado (no se puede cambiar)', () => {
        const { radicado, ...sinRadicado } = documentoValido
        assert.deepEqual(validarDocumento(sinRadicado, { esNuevo: false }), [])
    })
})

describe('Módulo autenticación — validación de login', () => {
    test('credenciales completas no generan errores', () => {
        assert.deepEqual(validarLogin({ email: 'admin@sanantonio.gov.co', password: 'Admin123*' }), [])
    })

    test('detecta email y contraseña faltantes', () => {
        assert.equal(validarLogin({}).length, 2)
    })
})
