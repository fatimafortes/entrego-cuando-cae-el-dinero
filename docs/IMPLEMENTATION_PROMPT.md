Vamos a construir el ship de esta semana siguiendo exactamente docs/PACKET.md, que ya está en este repo. Antes de escribir código, lee docs/PACKET.md completo para tener el contexto.

STACK: Next.js (frontend, en Vercel) + Supabase (Postgres + Auth). Sin integración real de preventa — usamos un feed de GPS/timestamp simulado, claramente etiquetado como tal en el código y en la UI.

CONSTRUYE EN ESTE ORDEN, UN COMMIT POR CADA PASO (mínimo 5 commits):

COMMIT 1 — Setup del proyecto
- Inicializa un proyecto Next.js básico
- Conecta el proyecto a Supabase (variables de entorno en .env.local, NUNCA hardcodeadas — deben ir a Vercel env vars cuando desplegemos)
- Crea dos tablas en Supabase:
  - vendor_profiles: id, curp (18 chars, único), created_at, distributor_id
  - entries: id, vendor_curp (FK a vendor_profiles), route_rep_id, amount, paid (boolean), timestamp, simulated_lat, simulated_lng, flagged_batch (boolean, default false)
- Activa Row Level Security en ambas tablas: un route_rep solo puede ver/insertar entries donde route_rep_id = su propio usuario autenticado
Criterio de aceptación: las tablas existen en Supabase, RLS está activo, puedo confirmarlo desde el dashboard de Supabase.

COMMIT 2 — Auth
- Implementa Supabase Auth con "Sign in with Google" para el route rep
- Página de login simple, redirige a la pantalla de logging una vez autenticado
Criterio de aceptación: un usuario nuevo puede iniciar sesión con Google y llega a la pantalla principal; sin sesión, no puede ver ni la pantalla ni los datos.

COMMIT 3 — Pantalla de logging (basada en el mockup de docs/PACKET.md)
- Formulario: selector de vendor stop (dropdown simple con vendedoras de prueba), campo de amount (numérico, validado, rango 0-5000), toggle paid/not-paid
- Al enviar: genera un CURP simulado si el vendor no existe aún (auto-crea vendor_profiles), inserta el entry con un timestamp real y GPS SIMULADO (números aleatorios pequeños que emulan cercanía entre paradas)
- Validación: CURP debe tener 18 caracteres: si el generado no cumple, muestra error y no permite enviar (aunque sea generado internamente, valida igual como práctica de la Security Floor)
Criterio de aceptación: puedo loguear un pago en menos de 10 segundos reales, sin llenar ningún campo más allá de amount y paid/not-paid, como dice mi Success Definition.

COMMIT 4 — Lógica de detección de lote (batch-entry)
- Función server-side: al insertar un entry nuevo, compara su timestamp + GPS simulado contra los últimos 5 entries del mismo route_rep
- Si están en una ventana de 2 minutos Y sin "movimiento" de GPS simulado entre ellos → marca flagged_batch = true
- Esta función corre automáticamente, sin que el rep haga nada extra
Criterio de aceptación: TP2 y TP3 de mi test plan pasan (5 entries juntos = flagged; 5 entries espaciados con GPS distinto = no flagged).

COMMIT 5 — Vista del distribuidor + inert enrollment
- Pantalla simple de "distributor view": tabla con todos los entries, mostrando cuáles están flaggeados, sin poder editarlos
- Confirma que un vendor_profile se crea automáticamente e inerte (sin ningún dato "activo" o "reclamado") apenas se registra su primer pago — esto ya debería estar cubierto por el Commit 3, aquí solo lo verificamos con un test manual
Criterio de aceptación: TP1 y TP4 de mi test plan pasan.

DESPUÉS DE LOS 5 COMMITS:
- Despliega a Vercel (necesito al menos 2 deploys distintos durante el proceso, no solo uno al final)
- Al terminar cada commit, actualiza docs/DECISIONS.md con una línea explicando qué se decidió y por qué, y anota el primer paso de la siguiente sesión
- Recuerda el Security Floor completo: nada de secrets en el código, auth obligatorio, RLS activo, validación de inputs, cero datos reales de personas.

Empieza por el Commit 1. Antes de cada commit, dime qué vas a hacer y espera mi confirmación si el paso no es obvio.
