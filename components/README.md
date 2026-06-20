# components/ — VISUAL (Raúl)

Esta carpeta es **tuya, Raúl**. Aquí viven los componentes presentacionales:
botones, campos, burbujas, encabezados… todo lo que se ve.

Regla de oro del reparto:

- **Tú (visual):** cómo se ve. Recibes datos y _callbacks_ por `props` y los pintas.
  No haces `fetch`, ni cifras, ni hablas con el socket.
- **Paola / César (lógica):** qué hace. Vive en `lib/` y en los _handlers_ de las
  pantallas de `app/`. Te entrega funciones (`entrar`, `enviar`) y datos (`contactos`,
  `mensajes`) listos para pintar.

Las pantallas en `app/` traen hoy un layout **mínimo y provisional** (marcado con
`// ----- VISUAL provisional (Raúl) -----`). Reemplázalo usando estos componentes y
los estilos/sistema de diseño que definas (NativeWind, tema, etc.). **No toques la
lógica**: solo la capa visual.
