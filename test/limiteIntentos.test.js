// Pruebas unitarias del límite de intentos de inicio de sesión
// Se usa un reloj simulado para no esperar 15 minutos reales.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { crearLimitador } from '../app/utils/limiteIntentos.js'

const MINUTO = 60 * 1000

const crearReloj = () => {
    let momento = Date.UTC(2026, 9, 23, 15, 0)
    return { ahora: () => momento, avanzar: (ms) => { momento += ms } }
}

describe('Módulo seguridad — límite de intentos de login', () => {
    test('una cuenta sin intentos fallidos no está bloqueada', () => {
        const limitador = crearLimitador()
        assert.equal(limitador.consultar('admin@sanantonio.gov.co').bloqueado, false)
    })

    test('informa cuántos intentos quedan después de cada fallo', () => {
        const limitador = crearLimitador()
        assert.equal(limitador.registrarFallo('admin@sanantonio.gov.co').intentosRestantes, 4)
        assert.equal(limitador.registrarFallo('admin@sanantonio.gov.co').intentosRestantes, 3)
    })

    test('bloquea la cuenta al quinto intento fallido', () => {
        const limitador = crearLimitador()
        let resultado
        for (let i = 0; i < 5; i++) resultado = limitador.registrarFallo('admin@sanantonio.gov.co')
        assert.equal(resultado.bloqueado, true)
        assert.equal(resultado.minutos, 15)
        assert.equal(limitador.consultar('admin@sanantonio.gov.co').bloqueado, true)
    })

    test('el bloqueo no distingue mayúsculas ni espacios en el correo', () => {
        const limitador = crearLimitador({ maxIntentos: 2 })
        limitador.registrarFallo('Admin@SanAntonio.gov.co ')
        limitador.registrarFallo('admin@sanantonio.gov.co')
        assert.equal(limitador.consultar('ADMIN@sanantonio.gov.co').bloqueado, true)
    })

    test('el bloqueo de una cuenta no afecta a las demás', () => {
        const limitador = crearLimitador({ maxIntentos: 1 })
        limitador.registrarFallo('admin@sanantonio.gov.co')
        assert.equal(limitador.consultar('aperez@sanantonio.gov.co').bloqueado, false)
    })

    test('el bloqueo termina cuando pasan los 15 minutos', () => {
        const reloj = crearReloj()
        const limitador = crearLimitador({ ahora: reloj.ahora })
        for (let i = 0; i < 5; i++) limitador.registrarFallo('admin@sanantonio.gov.co')

        reloj.avanzar(14 * MINUTO)
        assert.equal(limitador.consultar('admin@sanantonio.gov.co').bloqueado, true)
        assert.equal(limitador.consultar('admin@sanantonio.gov.co').minutos, 1)

        reloj.avanzar(1 * MINUTO)
        assert.equal(limitador.consultar('admin@sanantonio.gov.co').bloqueado, false)
    })

    test('los fallos fuera de la ventana de 15 minutos no se acumulan', () => {
        const reloj = crearReloj()
        const limitador = crearLimitador({ ahora: reloj.ahora })
        for (let i = 0; i < 4; i++) limitador.registrarFallo('admin@sanantonio.gov.co')

        reloj.avanzar(16 * MINUTO)
        const resultado = limitador.registrarFallo('admin@sanantonio.gov.co')
        assert.equal(resultado.bloqueado, false)
        assert.equal(resultado.intentosRestantes, 4)
    })

    test('un inicio de sesión exitoso reinicia el conteo', () => {
        const limitador = crearLimitador()
        for (let i = 0; i < 4; i++) limitador.registrarFallo('admin@sanantonio.gov.co')
        limitador.reiniciar('admin@sanantonio.gov.co')
        assert.equal(limitador.registrarFallo('admin@sanantonio.gov.co').intentosRestantes, 4)
    })
})
