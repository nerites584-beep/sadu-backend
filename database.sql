-- ============================================================
-- SADU - Sistema Administrativo Documental Unificado
-- Alcaldía Municipal de San Antonio del Tequendama
-- Script de creación de base de datos (modelo normalizado en 3FN)
-- ============================================================

CREATE DATABASE IF NOT EXISTS sadu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sadu;

-- Usuarios del sistema y su rol (Administrador, Funcionario, Consulta)
CREATE TABLE IF NOT EXISTS usuario (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    nombre      VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    rol         VARCHAR(50)  NOT NULL,
    password    VARCHAR(255) NOT NULL
);

-- Catálogo de dependencias de la Alcaldía
CREATE TABLE IF NOT EXISTS dependencia (
    id      INT PRIMARY KEY AUTO_INCREMENT,
    nombre  VARCHAR(150) NOT NULL UNIQUE,
    activa  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Catálogo de tipos documentales
CREATE TABLE IF NOT EXISTS tipo_documento (
    id      INT PRIMARY KEY AUTO_INCREMENT,
    nombre  VARCHAR(100) NOT NULL UNIQUE,
    activo  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Documentos radicados: el tipo y la dependencia se referencian por llave foránea
CREATE TABLE IF NOT EXISTS documento (
    id                 INT PRIMARY KEY AUTO_INCREMENT,
    radicado           VARCHAR(50)  NOT NULL UNIQUE,
    titulo             VARCHAR(200) NOT NULL,
    tipo_documento_id  INT          NOT NULL,
    estado             VARCHAR(50)  NOT NULL,
    dependencia_id     INT          NOT NULL,
    fecha_registro     DATE         NOT NULL,
    usuario_id         INT,
    archivo            VARCHAR(255) NULL,   -- nombre del PDF guardado en el servidor
    archivo_nombre     VARCHAR(255) NULL,   -- nombre original con el que se subió
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_documento_tipo        FOREIGN KEY (tipo_documento_id) REFERENCES tipo_documento(id),
    CONSTRAINT fk_documento_dependencia FOREIGN KEY (dependencia_id)    REFERENCES dependencia(id)
);

-- Bitácora de auditoría: quién hizo qué y cuándo.
-- Si se elimina el usuario, el registro se conserva con su email.
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
);

-- Datos de prueba - usuarios
-- Las contraseñas se almacenan cifradas con bcrypt (factor de costo 10):
--   admin@sanantonio.gov.co    -> Admin123*
--   aperez@sanantonio.gov.co   -> Func123*
--   consulta@sanantonio.gov.co -> Consulta123*
INSERT INTO usuario (nombre, email, rol, password) VALUES
('Administrador SADU', 'admin@sanantonio.gov.co', 'Administrador', '$2b$10$AXiJ4FFRjZ0/Ke/rqDPoMuKg72UErOMmRkRc4xzrS5oT3c/3CU3TW'),
('Ana Pérez', 'aperez@sanantonio.gov.co', 'Funcionario', '$2b$10$fsb7ht/l0RCgI8u5K4YCdew8LRLqkYeAXsMWk5vEIjkE.ATK.cE3u'),
('Consulta Ciudadana', 'consulta@sanantonio.gov.co', 'Consulta', '$2b$10$EyDFqDIEJAVydjJY64lPy.niIwRYgJJJyS46AvHVjVjNuuFoOk9FK');

-- Catálogos iniciales
INSERT INTO tipo_documento (nombre) VALUES
('Acuerdo Municipal'), ('Decreto'), ('Resolución'), ('Acta de Comité'),
('Contrato de Prestación de Servicios'), ('PQRSDF'), ('Oficio de Respuesta'),
('Memorando Interno'), ('Circular'), ('Informe'), ('Certificación'), ('Constancia');

INSERT INTO dependencia (nombre) VALUES
('Despacho del Alcalde'), ('Secretaría General'), ('Secretaría de Hacienda'),
('Secretaría de Planeación'), ('Secretaría de Infraestructura'), ('Secretaría de Salud'),
('Secretaría de Educación'), ('Secretaría de Gobierno'), ('Concejo Municipal'),
('Personería Municipal'), ('Control Interno'), ('Oficina Jurídica'), ('Tesorería');

-- Datos de prueba - documentos (tipo 2 = Decreto, 7 = Oficio de Respuesta; dependencia 3 = Hacienda, 2 = General)
INSERT INTO documento (radicado, titulo, tipo_documento_id, estado, dependencia_id, fecha_registro, usuario_id) VALUES
('ALC-2026-001', 'Decreto de presupuesto anual', 2, 'Activo', 3, '2026-01-15', 1),
('ALC-2026-002', 'Respuesta PQRSDF ciudadano', 7, 'En trámite', 2, '2026-02-10', 2);

-- ============================================================
-- Consultas de ejemplo (DML)
-- ============================================================

-- Listado de documentos con su tipo, dependencia y responsable
-- SELECT d.radicado, d.titulo, t.nombre AS tipo, dp.nombre AS dependencia, u.nombre AS responsable
-- FROM documento d
-- JOIN tipo_documento t ON t.id = d.tipo_documento_id
-- JOIN dependencia dp   ON dp.id = d.dependencia_id
-- LEFT JOIN usuario u   ON u.id = d.usuario_id;

-- Cantidad de documentos por dependencia
-- SELECT dp.nombre, COUNT(d.id) AS total
-- FROM dependencia dp LEFT JOIN documento d ON d.dependencia_id = dp.id
-- GROUP BY dp.id ORDER BY total DESC;

-- Cambio de estado de un documento
-- UPDATE documento SET estado = 'Archivado' WHERE radicado = 'ALC-2026-001';

-- Últimas acciones registradas en la auditoría
-- SELECT fecha, usuario_email, accion, entidad, detalle FROM auditoria ORDER BY fecha DESC LIMIT 20;
