// Manejo centralizado de errores del servidor
// Registra el error completo en la consola del servidor y le responde al cliente
// con un mensaje claro. El detalle técnico solo se envía en el entorno de desarrollo,
// así en producción no se exponen nombres de tablas, rutas ni mensajes de MySQL.

export const esDesarrollo = (entorno = process.env.NODE_ENV) =>
    (entorno || 'developer') === 'developer'

export const cuerpoError = (mensaje, error, entorno = process.env.NODE_ENV) => {
    const cuerpo = { mensaje }
    if (esDesarrollo(entorno) && error?.message) cuerpo.detalle = error.message
    return cuerpo
}

export const responderError = (res, mensaje, error, status = 500) => {
    console.error(`[SADU] ${mensaje}:`, error?.message ?? error)
    return res.status(status).json(cuerpoError(mensaje, error))
}
