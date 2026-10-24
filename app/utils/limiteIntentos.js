// Límite de intentos de inicio de sesión
// Después de 5 intentos fallidos con el mismo correo en 15 minutos,
// la cuenta queda bloqueada 15 minutos. Protege contra ataques de fuerza bruta.
//
// Los intentos se cuentan por correo y no por IP: el backend recibe todas las
// peticiones desde el servidor del frontend, así que la IP sería siempre la misma.
// El registro vive en memoria; si el servicio se reinicia, los contadores empiezan de cero.

export const crearLimitador = ({
    maxIntentos = 5,
    ventanaMs = 15 * 60 * 1000,
    bloqueoMs = 15 * 60 * 1000,
    ahora = () => Date.now()
} = {}) => {
    const registros = new Map()   // clave -> { intentos, primerIntento, bloqueadoHasta }

    const normalizar = (clave) => String(clave ?? '').trim().toLowerCase()

    const minutosRestantes = (hasta) => Math.max(1, Math.ceil((hasta - ahora()) / 60000))

    const consultar = (clave) => {
        const registro = registros.get(normalizar(clave))
        if (registro?.bloqueadoHasta && registro.bloqueadoHasta > ahora()) {
            return { bloqueado: true, minutos: minutosRestantes(registro.bloqueadoHasta) }
        }
        return { bloqueado: false, minutos: 0 }
    }

    const registrarFallo = (clave) => {
        const llave = normalizar(clave)
        const momento = ahora()
        let registro = registros.get(llave)

        // Si la ventana ya pasó o el bloqueo terminó, el conteo empieza de nuevo
        if (!registro || momento - registro.primerIntento > ventanaMs ||
            (registro.bloqueadoHasta && registro.bloqueadoHasta <= momento)) {
            registro = { intentos: 0, primerIntento: momento, bloqueadoHasta: null }
        }

        registro.intentos += 1
        if (registro.intentos >= maxIntentos) {
            registro.bloqueadoHasta = momento + bloqueoMs
        }
        registros.set(llave, registro)

        return {
            bloqueado: Boolean(registro.bloqueadoHasta),
            intentosRestantes: Math.max(0, maxIntentos - registro.intentos),
            minutos: registro.bloqueadoHasta ? minutosRestantes(registro.bloqueadoHasta) : 0
        }
    }

    const reiniciar = (clave) => registros.delete(normalizar(clave))

    return { consultar, registrarFallo, reiniciar, maxIntentos }
}

// Instancia que usa el controlador de login
export const limitadorLogin = crearLimitador()
