// Middlewares generales de seguridad y control de errores
// - cabecerasSeguridad: agrega cabeceras HTTP que protegen contra ataques comunes
// - rutaNoEncontrada: responde 404 en JSON cuando la ruta no existe
// - manejadorErrores: último recurso para errores no controlados (por ejemplo, JSON mal formado)

import { responderError } from '../utils/errores.js'

export const CABECERAS_SEGURIDAD = {
    'X-Content-Type-Options': 'nosniff',        // el navegador no adivina el tipo de archivo
    'X-Frame-Options': 'DENY',                  // la API no se puede cargar dentro de un iframe
    'Referrer-Policy': 'no-referrer',           // no se envía la URL de origen a otros sitios
    'Cache-Control': 'no-store'                 // las respuestas con datos no quedan en caché
}

export const cabecerasSeguridad = (req, res, next) => {
    for (const [nombre, valor] of Object.entries(CABECERAS_SEGURIDAD)) {
        res.setHeader(nombre, valor)
    }
    next()
}

export const rutaNoEncontrada = (req, res) => {
    res.status(404).json({ mensaje: `La ruta ${req.method} ${req.originalUrl} no existe` })
}

// eslint-disable-next-line no-unused-vars
export const manejadorErrores = (error, req, res, next) => {
    if (error?.type === 'entity.parse.failed') {
        return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido' })
    }
    return responderError(res, 'Error interno del servidor', error, error?.status || 500)
}
