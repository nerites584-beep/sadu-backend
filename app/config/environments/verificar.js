// Verificación de variables de entorno al iniciar
// Si falta una variable obligatoria el servidor no arranca y dice cuál falta.
// Es mejor fallar al inicio que descubrir el error cuando un usuario intenta iniciar sesión.

export const VARIABLES_OBLIGATORIAS = ['PORT', 'DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET']

export const variablesFaltantes = (env = process.env, obligatorias = VARIABLES_OBLIGATORIAS) =>
    obligatorias.filter((nombre) => !env[nombre] || String(env[nombre]).trim() === '')

export const verificarEntorno = (env = process.env) => {
    const faltantes = variablesFaltantes(env)
    if (faltantes.length > 0) {
        throw new Error(`Faltan variables de entorno obligatorias: ${faltantes.join(', ')}`)
    }
    if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'definir_clave_secreta') {
        throw new Error('JWT_SECRET tiene el valor de ejemplo; defina una clave propia para producción')
    }
}
