// Generación del reporte de documentos en PDF con pdfkit
// Hoja horizontal con encabezado institucional, resumen por estado
// y la tabla de documentos; el pie lleva el número de página.

import PDFDocument from 'pdfkit'
import { describirFiltros, valorColumna } from './reportes.js'

const AZUL = '#1a3a5c'
const DORADO = '#c8a415'
const GRIS = '#6b7684'
const BORDE = '#dde3ea'

const COLUMNAS = [
    { campo: 'radicado',       titulo: 'Radicado',     ancho: 85 },
    { campo: 'titulo',         titulo: 'Título',       ancho: 200 },
    { campo: 'tipo',           titulo: 'Tipo',         ancho: 115 },
    { campo: 'estado',         titulo: 'Estado',       ancho: 65 },
    { campo: 'dependencia',    titulo: 'Dependencia',  ancho: 130 },
    { campo: 'fecha_registro', titulo: 'Fecha',        ancho: 62 },
    { campo: 'usuario_nombre', titulo: 'Responsable',  ancho: 95 }
]

const fechaGeneracion = () =>
    new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota'
    }).format(new Date())

export const generarPdf = (documentos, resumen, aplicados, usuario, destino) => {
    const pdf = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 36,
        bufferPages: true,
        info: {
            Title: 'Reporte de documentos - SADU',
            Author: 'SADU - Alcaldía Municipal de San Antonio del Tequendama',
            Subject: describirFiltros(aplicados)
        }
    })
    pdf.pipe(destino)

    const izquierda = pdf.page.margins.left
    const anchoUtil = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right
    const limiteInferior = pdf.page.height - pdf.page.margins.bottom - 20

    // Encabezado institucional
    pdf.rect(0, 0, pdf.page.width, 70).fill(AZUL)
    pdf.rect(0, 70, pdf.page.width, 4).fill(DORADO)
    pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
        .text('SADU — Reporte de documentos', izquierda, 18)
    pdf.font('Helvetica').fontSize(10)
        .text('Alcaldía Municipal de San Antonio del Tequendama · Sistema Administrativo Documental Unificado', izquierda, 42)

    pdf.fillColor(GRIS).fontSize(9).text(
        `Generado el ${fechaGeneracion()} por ${usuario?.email || 'usuario del sistema'}`,
        izquierda, 86
    )
    pdf.fillColor(AZUL).font('Helvetica-Bold').fontSize(10)
        .text(`Filtros: ${describirFiltros(aplicados)}`, izquierda, 100)

    // Resumen: total y conteo por estado
    let x = izquierda
    const yResumen = 120
    const cajas = [{ etiqueta: 'Total', total: resumen.total }, ...resumen.porEstado]
    for (const caja of cajas) {
        pdf.roundedRect(x, yResumen, 110, 40, 4).lineWidth(1).strokeColor(BORDE).stroke()
        pdf.rect(x, yResumen, 3, 40).fill(DORADO)
        pdf.fillColor(AZUL).font('Helvetica-Bold').fontSize(16).text(String(caja.total), x + 12, yResumen + 6)
        pdf.fillColor(GRIS).font('Helvetica').fontSize(8).text(caja.etiqueta, x + 12, yResumen + 26)
        x += 120
    }

    // Tabla de documentos
    let y = yResumen + 58
    const dibujarEncabezadoTabla = () => {
        pdf.rect(izquierda, y, anchoUtil, 20).fill('#e8eef5')
        let cx = izquierda
        pdf.fillColor(AZUL).font('Helvetica-Bold').fontSize(8)
        for (const col of COLUMNAS) {
            pdf.text(col.titulo.toUpperCase(), cx + 4, y + 6, { width: col.ancho - 8 })
            cx += col.ancho
        }
        y += 20
    }
    dibujarEncabezadoTabla()

    pdf.font('Helvetica').fontSize(8.5)
    if (documentos.length === 0) {
        pdf.fillColor(GRIS).text('No hay documentos que coincidan con los filtros.', izquierda + 4, y + 8)
    }

    for (const doc of documentos) {
        const textos = COLUMNAS.map(col => String(valorColumna(doc, col.campo) ?? '—'))
        const alto = Math.max(...textos.map((t, i) =>
            pdf.heightOfString(t, { width: COLUMNAS[i].ancho - 8 }))) + 10

        if (y + alto > limiteInferior) {
            pdf.addPage()
            y = pdf.page.margins.top
            dibujarEncabezadoTabla()
            pdf.font('Helvetica').fontSize(8.5)
        }

        let cx = izquierda
        pdf.fillColor('#2c3440')
        textos.forEach((t, i) => {
            pdf.text(t, cx + 4, y + 5, { width: COLUMNAS[i].ancho - 8 })
            cx += COLUMNAS[i].ancho
        })
        y += alto
        pdf.moveTo(izquierda, y).lineTo(izquierda + anchoUtil, y).lineWidth(0.5).strokeColor(BORDE).stroke()
    }

    // Pie con número de página en todas las hojas
    const rango = pdf.bufferedPageRange()
    for (let i = 0; i < rango.count; i++) {
        pdf.switchToPage(i)
        // Sin margen inferior temporal: así el pie no obliga a pdfkit a crear otra hoja
        const margenInferior = pdf.page.margins.bottom
        pdf.page.margins.bottom = 0
        pdf.fillColor(GRIS).font('Helvetica').fontSize(8).text(
            `SADU · Página ${i + 1} de ${rango.count}`,
            izquierda, pdf.page.height - margenInferior,
            { width: anchoUtil, align: 'right', lineBreak: false }
        )
        pdf.page.margins.bottom = margenInferior
    }

    pdf.end()
}
