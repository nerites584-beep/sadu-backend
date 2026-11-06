// Pruebas unitarias de las buenas prácticas de calidad:
// manejo centralizado de errores, cabeceras de seguridad y verificación del entorno.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { cuerpoError, esDesarrollo } from '../app/utils/errores.js'
import { cabecerasSeguridad, rutaNoEncontrada, manejadorErrores, CABECERAS_SEGURIDAD } from '../app/middlewares/seguridad.js'
import { variablesFaltantes, verificarEntorno } from '../app/config/environments/verificar.js'

// Respuesta simulada de Express para probar middlewares sin levantar el servidor
const crearRes = () => {
    const res = { cabeceras: {}, codigo: 200, cuerpo: null }
    res.setHeader = (n, v) => { res.cabeceras[n] = v }
    res.status = (c) => { res.codigo = c; return res }
    res.json = (b) => { res.cuerpo = b; return res }
    return res
}

const ENTORNO_COMPLETO = { PORT: '3030', DB_HOST: 'localhost', DB_USER: 'root', DB_NAME: 'sadu', JWT_SECRET: 'clave' }

describe('Manejo centralizado de errores', () => {
    test('en desarrollo incluye el detalle técnico', () => {
        const cuerpo = cuerpoError('Error al consultar', new Error('Table x does not exist'), 'developer')
        assert.equal(cuerpo.mensaje, 'Error al consultar')
        assert.equal(cuerpo.detalle, 'Table x does not exist')
    })

    test('en producción oculta el detalle técnico', () => {
        const cuerpo = cuerpoError('Error al consultar', new Error('Table x does not exist'), 'production')
        assert.deepEqual(cuerpo, { mensaje: 'Error al consultar' })
    })

    test('sin NODE_ENV se toma como desarrollo', () => {
        assert.equal(esDesarrollo(undefined), true)
        assert.equal(esDesarrollo('production'), false)
    })
})

describe('Middlewares de seguridad', () => {
    test('agrega todas las cabeceras de seguridad y continúa', () => {
        const res = crearRes()
        let continuo = false
        cabecerasSeguridad({}, res, () => { continuo = true })
        assert.equal(continuo, true)
        for (const [nombre, valor] of Object.entries(CABECERAS_SEGURIDAD)) {
            assert.equal(res.cabeceras[nombre], valor)
        }
    })

    test('una ruta inexistente responde 404', () => {
        const res = crearRes()
        rutaNoEncontrada({ method: 'GET', originalUrl: '/no-existe' }, res)
        assert.equal(res.codigo, 404)
        assert.match(res.cuerpo.mensaje, /no existe/)
    })

    test('un JSON mal formado responde 400 y no 500', () => {
        const res = crearRes()
        manejadorErrores({ type: 'entity.parse.failed' }, {}, res, () => {})
        assert.equal(res.codigo, 400)
    })
})

describe('Verificación de variables de entorno', () => {
    test('con todas las variables no reporta faltantes', () => {
        assert.deepEqual(variablesFaltantes(ENTORNO_COMPLETO), [])
    })

    test('detecta variables vacías o ausentes', () => {
        const faltantes = variablesFaltantes({ ...ENTORNO_COMPLETO, JWT_SECRET: ' ', DB_NAME: undefined })
        assert.deepEqual(faltantes, ['DB_NAME', 'JWT_SECRET'])
    })

    test('en producción rechaza la clave JWT de ejemplo', () => {
        assert.throws(
            () => verificarEntorno({ ...ENTORNO_COMPLETO, NODE_ENV: 'production', JWT_SECRET: 'definir_clave_secreta' }),
            /valor de ejemplo/
        )
    })

    test('un entorno completo pasa la verificación', () => {
        assert.doesNotThrow(() => verificarEntorno(ENTORNO_COMPLETO))
    })
})
