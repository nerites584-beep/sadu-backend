// Consulta base de documentos: une el documento con sus catálogos y su responsable.
// Devuelve tipo y dependencia por nombre para que el frontend no maneje identificadores.

export const SELECT_DOCUMENTOS = `
    SELECT d.id, d.radicado, d.titulo,
           d.tipo_documento_id, t.nombre AS tipo,
           d.estado,
           d.dependencia_id, dp.nombre AS dependencia,
           d.fecha_registro, d.usuario_id, d.archivo, d.archivo_nombre,
           u.nombre AS usuario_nombre
    FROM documento d
    JOIN tipo_documento t ON t.id = d.tipo_documento_id
    JOIN dependencia dp   ON dp.id = d.dependencia_id
    LEFT JOIN usuario u   ON u.id = d.usuario_id`
