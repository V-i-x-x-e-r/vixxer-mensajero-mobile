# lib/ — LÓGICA (Paola · la cubre César mientras Paola no está)

El **cerebro** de la app. Nada de aquí pinta pantallas; todo es comportamiento.

| Archivo | Qué hace |
|---|---|
| `config.js`  | Lee la URL del backend desde `.env` (API y socket). |
| `storage.js` | Guardado seguro (expo-secure-store): token, `mi_id` y las claves. |
| `api.js`     | Cliente HTTP: `login`, `registrar`, `buscarUsuarios`, `llavePublica`, `historial`. |
| `crypto.js`  | E2EE con TweetNaCl: `asegurarClaves`, `cifrar`, `descifrar`. |
| `socket.js`  | Conexión en vivo (Socket.IO), única para toda la app. |
| `llaves.js`  | Caché de llaves públicas de contactos. |

Las pantallas de `app/` importan de aquí y exponen _handlers_ (`entrar`, `crear`,
`enviar`) y estado (`contactos`, `mensajes`, `estado`). Raúl pone el layout encima
sin tocar esta capa. La frontera: **si “no funciona”, es de `lib/`; si “no se ve
bien”, es de `components/`.**
