<div align="center">

# Vixxer Mensajero — Mobile

**App móvil de mensajería privada con cifrado E2EE, sin teléfono ni CURP.**

![Platform](https://img.shields.io/badge/platform-Android-green)
![Framework](https://img.shields.io/badge/framework-React%20Native%20%2B%20Expo-000)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

</div>

---

## Sobre el proyecto

Cliente móvil de **Vixxer Mensajero** (Android). El servidor vive en [`vixxer-mensajero-backend`](https://github.com/V-i-x-x-e-r/vixxer-mensajero-backend).

**Stack:** React Native + Expo · JavaScript · React Navigation · NativeWind · Socket.IO client.

---

## Este repo está intencionalmente casi vacío

No hay código todavía **a propósito**. En Vixxer aprendemos construyendo: el proyecto de
Expo y la estructura de carpetas los creas **tú**, siguiendo tu guía.

> **Empieza por tu guía personal** en `vixxer-docs` → `guias/` (abre `index.html`).
> Ahí está el qué, el porqué, el dónde y en qué orden construir.

La dupla de frontend es **Paola + Raúl**. Se revisan entre ustedes por Pull Request.

---

## Arranque rápido (cuando ya tengas tu proyecto)

```bash
# 1. Crear el proyecto de Expo dentro de este repo (tu guía explica cómo)
#    e instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env             # apunta a la IP LAN del backend

# 3. Levantar Expo y abrir en tu celular con Expo Go
npx expo start
```

> Tu celular y tu laptop deben estar en la misma red Wi-Fi.

---

## Variables de entorno

Ver [`.env.example`](.env.example). Las que lee el cliente llevan el prefijo `EXPO_PUBLIC_`.

---

## Equipo

Frontend: Paola Ornelas Galván · Raúl Leyva Carral.
Documentación y guías: [`vixxer-docs`](https://github.com/V-i-x-x-e-r/vixxer-docs).

## Licencia

MIT. Ver [`LICENSE`](LICENSE).
