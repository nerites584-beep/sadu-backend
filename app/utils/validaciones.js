// Módulo de validaciones de entrada
// Funciones puras: reciben datos y devuelven la lista de errores encontrados.
// Se mantienen separadas de los controladores para poder probarlas de forma unitaria.

const ROLES_VALIDOS = ['Administrador', 'Funcionario', 'Consulta']
const ESTADOS_VALIDOS = ['Activo', 'En trámite', 'Archivado', 'Anulado']
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGEX_RADICADO = /^ALC-\d{4}-\d{3,5}$/
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/

export const esEmailValido = (email) =>
    typeof email === 'string' && REGEX_EMAIL.test(email.trim())

export const esPasswordSegura = (password) =>
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)

export const esRadicadoValido = (radicado) =>
    typeof radicado === 'string' && REGEX_RADICADO.test(radicado.trim())

export const validarUsuario = ({ nombre, email, rol, password } = {}, { esNuevo = true } = {}) => {
    const errores = []

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3)
        errores.push('El nombre es obligatorio y debe tener al menos 3 caracteres')

    if (!esEmailValido(email))
        errores.push('El email no tiene un formato válido')

    if (!ROLES_VALIDOS.includes(rol))
        errores.push(`El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}`)

    if (esNuevo && !esPasswordSegura(password))
        errores.push('La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula y número')

    return errores
}

export const validarDocumento = ({ radicado, titulo, tipo, estado, dependencia, fecha_registro } = {}, { esNuevo = true } = {}) => {
    const errores = []

    if (esNuevo && !esRadicadoValido(radicado))
        errores.push('El radicado es obligatorio con formato ALC-AAAA-NNN (ej: ALC-2026-001)')

    if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 5)
        errores.push('El título es obligatorio y debe tener al menos 5 caracteres')

    if (!tipo || typeof tipo !== 'string' || !tipo.trim())
        errores.push('El tipo de documento es obligatorio')

    if (!ESTADOS_VALIDOS.includes(estado))
        errores.push(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`)

    if (!dependencia || typeof dependencia !== 'string' || !dependencia.trim())
        errores.push('La dependencia es obligatoria')

    if (!fecha_registro || !REGEX_FECHA.test(String(fecha_registro)))
        errores.push('La fecha de registro es obligatoria con formato AAAA-MM-DD')

    return errores
}

export const validarLogin = ({ email, password } = {}) => {
    const errores = []

    if (!esEmailValido(email))
        errores.push('El email es obligatorio y debe tener formato válido')

    if (!password || typeof password !== 'string')
        errores.push('La contraseña es obligatoria')

    return errores
}

export { ROLES_VALIDOS, ESTADOS_VALIDOS }
