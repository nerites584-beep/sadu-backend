-- ============================================================
-- SADU - Sistema Administrativo Documental Unificado
-- Alcaldía Municipal de San Antonio del Tequendama
-- Script de creación de base de datos
-- ============================================================

CREATE DATABASE IF NOT EXISTS sadu;
USE sadu;

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuario (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    nombre      VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    rol         VARCHAR(50)  NOT NULL,
    password    VARCHAR(255) NOT NULL
);

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documento (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    radicado        VARCHAR(50)  NOT NULL UNIQUE,
    titulo          VARCHAR(200) NOT NULL,
    tipo            VARCHAR(100) NOT NULL,
    estado          VARCHAR(50)  NOT NULL,
    dependencia     VARCHAR(150) NOT NULL,
    fecha_registro  DATE         NOT NULL,
    usuario_id      INT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
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

-- Datos de prueba - documentos
INSERT INTO documento (radicado, titulo, tipo, estado, dependencia, fecha_registro, usuario_id) VALUES
('ALC-2026-001', 'Decreto de presupuesto anual', 'Decreto', 'Activo', 'Secretaría de Hacienda', '2026-01-15', 1),
('ALC-2026-002', 'Respuesta PQRSDF ciudadano', 'Oficio de Respuesta', 'En trámite', 'Secretaría General', '2026-02-10', 2);
