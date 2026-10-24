// Valores iniciales de los catálogos de la Alcaldía.
// La migración los carga en las tablas tipo_documento y dependencia;
// después el Administrador puede agregar más desde la pantalla de Catálogos.

export const TIPOS_DOCUMENTO = [
    'Acuerdo Municipal', 'Decreto', 'Resolución', 'Acta de Comité',
    'Contrato de Prestación de Servicios', 'PQRSDF', 'Oficio de Respuesta',
    'Memorando Interno', 'Circular', 'Informe', 'Certificación', 'Constancia'
]

export const DEPENDENCIAS = [
    'Despacho del Alcalde', 'Secretaría General', 'Secretaría de Hacienda',
    'Secretaría de Planeación', 'Secretaría de Infraestructura', 'Secretaría de Salud',
    'Secretaría de Educación', 'Secretaría de Gobierno', 'Concejo Municipal',
    'Personería Municipal', 'Control Interno', 'Oficina Jurídica', 'Tesorería'
]
