// Módulo de seguridad
// Centraliza el cifrado de contraseñas (bcrypt) y la firma/verificación
// de tokens JWT para que los controladores no dependan de la librería directamente.

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SALT_ROUNDS = 10

export const hashearPassword = (passwordPlana) =>
    bcrypt.hash(passwordPlana, SALT_ROUNDS)

export const verificarPassword = (passwordPlana, hashGuardado) =>
    bcrypt.compare(passwordPlana, hashGuardado)

export const generarToken = (usuario) =>
    jwt.sign(
        { id: usuario.id, email: usuario.email, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    )

export const verificarToken = (token) =>
    jwt.verify(token, process.env.JWT_SECRET)
