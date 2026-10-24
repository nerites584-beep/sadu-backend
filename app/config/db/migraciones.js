import { pool } from './basedatos.js'
import { TIPOS_DOCUMENTO, DEPENDENCIAS } from '../catalogos.js'

// Migraciones que se ejecutan al iniciar el servidor.
// Cada paso revisa primero si ya se aplicó, así una base de datos ya desplegada
// se actualiza sin correr scripts a mano y reiniciar el servicio no repite nada.

const existeTabla = async (tabla) => {
    const [rows] = await pool.query(
        `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [tabla]
    )
    return rows.length > 0
}

const columnasDe = async (tabla) => {
    const [rows] = await pool.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [tabla]
    )
    return rows.map(c => c.COLUMN_NAME)
}

const existeLlaveForanea = async (tabla, nombre) => {
    const [rows] = await pool.query(
        `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        [tabla, nombre]
    )
    return rows.length > 0
}

// 1. Columnas del archivo PDF (versión de octubre de 2026)
const agregarColumnasArchivo = async () => {
    const columnas = await columnasDe('documento')
    for (const [columna, definicion] of [['archivo', 'VARCHAR(255) NULL'], ['archivo_nombre', 'VARCHAR(255) NULL']]) {
        if (!columnas.includes(columna)) {
            await pool.query(`ALTER TABLE documento ADD COLUMN ${columna} ${definicion}`)
            console.log(`Migración aplicada: columna documento.${columna}`)
        }
    }
}

// 2. Tablas de catálogo y de auditoría
const crearTablas = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS dependencia (
            id      INT PRIMARY KEY AUTO_INCREMENT,
            nombre  VARCHAR(150) NOT NULL UNIQUE,
            activa  BOOLEAN NOT NULL DEFAULT TRUE
        )`)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tipo_documento (
            id      INT PRIMARY KEY AUTO_INCREMENT,
            nombre  VARCHAR(100) NOT NULL UNIQUE,
            activo  BOOLEAN NOT NULL DEFAULT TRUE
        )`)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS auditoria (
            id             INT PRIMARY KEY AUTO_INCREMENT,
            fecha          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            usuario_id     INT          NULL,
            usuario_email  VARCHAR(150) NULL,
            accion         VARCHAR(40)  NOT NULL,
            entidad        VARCHAR(40)  NOT NULL,
            entidad_id     INT          NULL,
            detalle        VARCHAR(255) NULL,
            INDEX idx_auditoria_fecha (fecha),
            CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL
        )`)

    await pool.query(`INSERT IGNORE INTO tipo_documento (nombre) VALUES ?`, [TIPOS_DOCUMENTO.map(n => [n])])
    await pool.query(`INSERT IGNORE INTO dependencia (nombre) VALUES ?`, [DEPENDENCIAS.map(n => [n])])
}

// 3. Normalización: documento guardaba el tipo y la dependencia como texto repetido.
//    Se reemplazan por llaves foráneas hacia los catálogos (tercera forma normal).
const normalizarDocumento = async () => {
    let columnas = await columnasDe('documento')
    if (!columnas.includes('tipo') && !columnas.includes('dependencia')) return

    // Copia de seguridad antes de modificar la estructura
    if (!(await existeTabla('documento_respaldo_v1'))) {
        await pool.query(`CREATE TABLE documento_respaldo_v1 AS SELECT * FROM documento`)
        console.log('Migración: copia de seguridad en documento_respaldo_v1')
    }

    // Los valores escritos antes que no estén en el catálogo también se conservan
    await pool.query(`INSERT IGNORE INTO tipo_documento (nombre) SELECT DISTINCT tipo FROM documento`)
    await pool.query(`INSERT IGNORE INTO dependencia (nombre) SELECT DISTINCT dependencia FROM documento`)

    if (!columnas.includes('tipo_documento_id')) {
        await pool.query(`ALTER TABLE documento ADD COLUMN tipo_documento_id INT NULL AFTER titulo`)
    }
    if (!columnas.includes('dependencia_id')) {
        await pool.query(`ALTER TABLE documento ADD COLUMN dependencia_id INT NULL AFTER estado`)
    }

    await pool.query(`UPDATE documento d JOIN tipo_documento t ON t.nombre = d.tipo SET d.tipo_documento_id = t.id`)
    await pool.query(`UPDATE documento d JOIN dependencia dp ON dp.nombre = d.dependencia SET d.dependencia_id = dp.id`)

    const [[{ pendientes }]] = await pool.query(
        `SELECT COUNT(*) AS pendientes FROM documento WHERE tipo_documento_id IS NULL OR dependencia_id IS NULL`
    )
    if (pendientes > 0) {
        throw new Error(`${pendientes} documento(s) sin tipo o dependencia en el catálogo; no se eliminan las columnas de texto`)
    }

    await pool.query(`ALTER TABLE documento MODIFY tipo_documento_id INT NOT NULL, MODIFY dependencia_id INT NOT NULL`)
    if (!(await existeLlaveForanea('documento', 'fk_documento_tipo'))) {
        await pool.query(`ALTER TABLE documento ADD CONSTRAINT fk_documento_tipo FOREIGN KEY (tipo_documento_id) REFERENCES tipo_documento(id)`)
    }
    if (!(await existeLlaveForanea('documento', 'fk_documento_dependencia'))) {
        await pool.query(`ALTER TABLE documento ADD CONSTRAINT fk_documento_dependencia FOREIGN KEY (dependencia_id) REFERENCES dependencia(id)`)
    }

    columnas = await columnasDe('documento')
    for (const columna of ['tipo', 'dependencia']) {
        if (columnas.includes(columna)) await pool.query(`ALTER TABLE documento DROP COLUMN ${columna}`)
    }
    console.log('Migración aplicada: documento normalizado con tipo_documento_id y dependencia_id')
}

export const aplicarMigraciones = async () => {
    try {
        await agregarColumnasArchivo()
        await crearTablas()
        await normalizarDocumento()
    } catch (error) {
        console.error('No fue posible aplicar las migraciones:', error.message)
    }
}
