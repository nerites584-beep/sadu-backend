## Descripción del cambio

<!-- ¿Qué se hizo y por qué? -->

## Lista de chequeo de calidad (SADU)

- [ ] El código está en una rama `feature/` o `fix/`, no directamente en `main`
- [ ] Los mensajes de commit siguen el formato `tipo(módulo): descripción`
- [ ] `npm test` pasa sin errores
- [ ] Se agregaron o actualizaron pruebas para la lógica nueva
- [ ] Las entradas del usuario se validan en `app/utils/validaciones.js`
- [ ] Los endpoints nuevos usan `autenticar` y `autorizar` con el rol correcto
- [ ] Las consultas SQL usan parámetros `?` (nunca concatenar texto del usuario)
- [ ] Los errores se responden con `responderError` (sin exponer detalles en producción)
- [ ] No se subieron archivos `.env`, contraseñas ni claves
- [ ] Se actualizó el README si cambió la instalación, los endpoints o las variables de entorno
