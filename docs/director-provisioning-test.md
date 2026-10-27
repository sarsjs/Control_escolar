# Prueba segura: aprovisionamiento del director

Esta funcionalidad está en la rama `fix/director-account-provisioning` y en el PR #3. No integrar ni desplegar hasta completar los pasos de esta guía.

## Requisitos del servidor

- El servicio de App Hosting debe arrancar con `npm start` / `node server.js`.
- La identidad de ejecución del backend necesita permisos para administrar usuarios de Firebase Authentication y leer/escribir en la base de Firestore `ai-studio-aulacontrolasist-0d616c0e-8d8e-4a9c-9dee-c11d2616d9ae`.
- Verifica los permisos de la identidad de ejecución real en Google Cloud IAM. No concedas roles a una cuenta por su nombre supuesto; confirma primero la identidad que aparece en la configuración del backend.
- En Firebase Authentication, confirma que el proveedor Email/Password esté habilitado y que la plantilla de restablecimiento de contraseña esté configurada. El cliente usa `sendPasswordResetEmail` después de que el servidor confirma la creación de la cuenta.
- El dominio real del backend/web debe estar autorizado cuando corresponda en Authentication > Settings > Authorized domains.

## Prueba antes de integrar

1. Usa solo el backend de pruebas y confirma que la rama desplegada sea `fix/director-account-provisioning`. No cambies `main` ni producción.
2. Inicia sesión con el superadministrador autorizado.
3. Para probar un plantel ya registrado (por ejemplo, EPO 264), usa **“Invitar / reenviar director”**; no registres otra vez el mismo plantel. Confirma antes que el nombre y correo del director sean correctos.
4. Para probar un plantel nuevo, usa un correo de prueba que no pertenezca a una cuenta existente y regístralo una sola vez.
5. En Authentication > Users, comprueba que exista la cuenta del director con ese correo.
6. En Firestore, dentro de la base nombrada arriba, comprueba `users/{UID}` y verifica `role: "director"`, `schoolId` igual al ID del plantel y `status: "pending_password_setup"` cuando la cuenta sea recién creada.
7. Comprueba el correo de establecimiento/restablecimiento de contraseña, incluida la carpeta de spam. No compartas ni copies aquí enlaces de restablecimiento ni contraseñas.
8. Abre el enlace en una ventana privada, establece la contraseña y prueba el inicio de sesión del director.
9. Comprueba que una llamada sin sesión o con usuario que no sea superadministrador reciba 401/403.
10. Si falla, conserva el mensaje exacto y el registro del servidor, pero oculta correos personales, tokens y enlaces de acción antes de compartirlos.

## Resultado esperado y recuperación

- El plantel puede quedar guardado aunque falle el aprovisionamiento; la interfaz informa que la invitación está pendiente.
- No vuelvas a crear el plantel solo para reintentar. Tras corregir el problema, vuelve a intentar el envío de invitación desde un flujo controlado.
- Un correo ya asociado a otra cuenta se rechaza para evitar asignar por accidente una cuenta existente a un plantel distinto.
- El CI verde valida tipos y compilación; no prueba permisos IAM, el envío de correo ni el inicio de sesión real.
