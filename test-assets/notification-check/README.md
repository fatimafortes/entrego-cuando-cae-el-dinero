# Imágenes de prueba — F3 (prueba de notificación)

Sintéticas, generadas con HTML/CSS renderizado a PNG. No son capturas de
pantalla reales de ningún banco ni institución. "NovaBanco" y el saldo que
aparece son inventados — ver Piso de seguridad, `docs/PACKET.md` §12.

- `con-notificacion.png` — pantalla de bloqueo con una notificación de
  depósito bancario simulada. Verificada contra el pipeline real de F3
  (`checkDepositNotification`): regresa `notificationVisible: true`.
- `sin-notificacion.png` — pantalla de inicio genérica, sin nada bancario.
  Verificada contra el mismo pipeline: regresa `notificationVisible: false`.

Uso: subir cualquiera de las dos en la pantalla de prueba de notificación
(`/setup/[standId]/prueba`) para probar el flujo de F3 sin necesitar una
notificación bancaria real.
