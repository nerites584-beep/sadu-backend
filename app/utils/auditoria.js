// Bitácora de auditoría
// Registra quién hizo qué y cuándo. Si el registro falla, la operación
// principal no se detiene: solo se informa el error en la consola del servidor.

import { pool } from '../config/db/basedatos.js'

export const ACCIONES = {
    INICIO_SESION:    'INICIO_SESION',
    INTENTO_FALLIDO:  'INTENTO_FALLIDO',
    CUENTA_BLOQUEADA: 'CUENTA_BLOQUEADA',
    CREAR:            'CREAR',
    EDITAR:           'EDITAR',
    ELIMINAR:         'ELIMINAR',
    CARGAR_PDF:       'CARGAR_PDF',
    EXPORTAR:         'EXPORTAR'
}

const recortar = (texto, largo) => (texto == null ? null : String(texto).slice(0, largo))

export const registrarAuditoria = async ({ usuario, email, accion, entidad, entidadId = null, detalle = null }) => {
    try {
        await pool.query(
            `INSERT INTO auditoria (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [usuario?.id ?? null, recortar(usuario?.email ?? email, 150), accion, entidad, entidadId, recortar(detalle, 255)]
        )
    } catch (error) {
        console.error('No fue posible registrar la auditoría:', error.message)
    }
}
