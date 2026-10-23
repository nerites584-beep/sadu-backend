import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carpeta donde se guardan los PDF de los documentos.
// En Railway se define UPLOAD_DIR con la ruta del volumen (por ejemplo /data/documentos)
// para que los archivos no se pierdan al reiniciar o redesplegar el servicio.
export const CARPETA_ARCHIVOS = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')

// Tamaño máximo permitido por archivo: 10 MB
export const TAMANO_MAXIMO = 10 * 1024 * 1024

fs.mkdirSync(CARPETA_ARCHIVOS, { recursive: true })

export const rutaArchivo = (nombre) => path.join(CARPETA_ARCHIVOS, path.basename(nombre))

export const borrarArchivo = (nombre) => {
    if (!nombre) return
    fs.promises.unlink(rutaArchivo(nombre)).catch(() => { /* el archivo ya no existe */ })
}
