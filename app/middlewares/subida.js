// Middleware de subida de archivos PDF
// - Solo acepta archivos PDF de hasta 10 MB
// - Comprueba la firma del archivo (%PDF-) para no confiar solo en la extensión

import fs from 'fs'
import crypto from 'crypto'
import multer from 'multer'
import { CARPETA_ARCHIVOS, TAMANO_MAXIMO, borrarArchivo } from '../config/archivos.js'

const almacenamiento = multer.diskStorage({
    destination: CARPETA_ARCHIVOS,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.pdf`)
})

const cargador = multer({
    storage: almacenamiento,
    defParamCharset: 'utf8',   // conserva las tildes y la ñ del nombre original
    limits: { fileSize: TAMANO_MAXIMO, files: 1 },
    fileFilter: (req, file, cb) => {
        const esPdf = file.mimetype === 'application/pdf' && /\.pdf$/i.test(file.originalname)
        cb(esPdf ? null : new Error('SOLO_PDF'), esPdf)
    }
}).single('archivo')

const tieneFirmaPdf = async (ruta) => {
    const manejador = await fs.promises.open(ruta, 'r')
    try {
        const { buffer } = await manejador.read(Buffer.alloc(5), 0, 5, 0)
        return buffer.toString('latin1') === '%PDF-'
    } finally {
        await manejador.close()
    }
}

export const subirPdf = (req, res, next) => {
    cargador(req, res, async (error) => {
        if (error) {
            const mensaje = error.code === 'LIMIT_FILE_SIZE'
                ? 'El archivo supera el tamaño máximo de 10 MB'
                : 'Solo se permiten archivos PDF'
            return res.status(400).json({ mensaje, errores: [mensaje] })
        }
        if (!req.file) {
            return res.status(400).json({ mensaje: 'Debe adjuntar un archivo PDF', errores: ['Debe adjuntar un archivo PDF'] })
        }
        if (!(await tieneFirmaPdf(req.file.path))) {
            borrarArchivo(req.file.filename)
            return res.status(400).json({ mensaje: 'El archivo no es un PDF válido', errores: ['El archivo no es un PDF válido'] })
        }
        next()
    })
}
