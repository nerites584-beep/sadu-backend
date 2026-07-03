// Pruebas unitarias del módulo de seguridad (bcrypt + JWT)

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import {
    hashearPassword,
    verificarPassword,
    generarToken,
    verificarToken
} from '../app/utils/seguridad.js'

before(() => {
    // Las pruebas no dependen del archivo .env
    process.env.JWT_SECRET = 'clave_de_pruebas'
})

describe('Módulo seguridad — cifrado de contraseñas', () => {
    test('el hash generado no contiene la contraseña en texto plano', async () => {
        const hash = await hashearPassword('Admin123*')
        assert.notEqual(hash, 'Admin123*')
        assert.ok(hash.startsWith('$2'), 'debe ser un hash bcrypt')
    })

    test('verificarPassword acepta la contraseña correcta', async () => {
        const hash = await hashearPassword('Admin123*')
        assert.equal(await verificarPassword('Admin123*', hash), true)
    })

    test('verificarPassword rechaza una contraseña incorrecta', async () => {
        const hash = await hashearPassword('Admin123*')
        assert.equal(await verificarPassword('otraClave999', hash), false)
    })
})

describe('Módulo seguridad — tokens JWT', () => {
    const usuario = { id: 1, email: 'admin@sanantonio.gov.co', rol: 'Administrador' }

    test('genera un token y lo verifica recuperando los datos', () => {
        const token = generarToken(usuario)
        const datos = verificarToken(token)
        assert.equal(datos.id, usuario.id)
        assert.equal(datos.email, usuario.email)
        assert.equal(datos.rol, usuario.rol)
    })

    test('rechaza un token adulterado', () => {
        const token = generarToken(usuario) + 'x'
        assert.throws(() => verificarToken(token))
    })

    test('el token no expone la contraseña', () => {
        const token = generarToken({ ...usuario, password: 'secreta' })
        const datos = verificarToken(token)
        assert.equal(datos.password, undefined)
    })
})
