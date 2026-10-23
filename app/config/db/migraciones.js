import { pool } from './basedatos.js'

// Agrega a la tabla documento las columnas del archivo PDF si aún no existen.
// Se ejecuta al iniciar el servidor, así una base de datos ya desplegada
// se actualiza sin tener que correr scripts a mano.
const COLUMNAS = [
    ['archivo',        'VARCHAR(255) NULL'],
    ['archivo_nombre', 'VARCHAR(255) NULL']
]

export const aplicarMigraciones = async () => {
    try {
        const [existentes] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documento'`
        )
        const nombres = existentes.map(c => c.COLUMN_NAME)

        for (const [columna, definicion] of COLUMNAS) {
            if (!nombres.includes(columna)) {
                await pool.query(`ALTER TABLE documento ADD COLUMN ${columna} ${definicion}`)
                console.log(`Migración aplicada: columna documento.${columna}`)
            }
        }
    } catch (error) {
        console.error('No fue posible aplicar las migraciones:', error.message)
    }
}
