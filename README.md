<div align="center">

# Vixxer Mensajero — Mobile

**App móvil de mensajería privada con cifrado E2EE, sin teléfono ni CURP.**

![Status](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Platform](https://img.shields.io/badge/platform-Android-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
![Sprint](https://img.shields.io/badge/sprint-0-orange)

</div>

---

## Tabla de contenidos

- [Sobre el proyecto](#sobre-el-proyecto)
- [Stack técnico](#stack-técnico)
- [Estado del proyecto y roadmap](#estado-del-proyecto-y-roadmap)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo de trabajo (Gitflow)](#flujo-de-trabajo-gitflow)
- [Convenciones](#convenciones)
- [Equipo](#equipo)
- [Licencia](#licencia)

---

## Sobre el proyecto

**Vixxer Mensajero** es una app móvil de mensajería privada diseñada en México para usuarios que no quieren depender de su número telefónico ni de su CURP para comunicarse. Está pensada para funcionar incluso en zonas con cobertura limitada, mediante un sistema de **gateway BLE** (planeado para v1.1+) donde un dispositivo cercano con internet puede actuar como puente para mensajes cifrados.

Este repositorio contiene el **cliente móvil** (Android). El servidor vive en [`vixxer-mensajero-backend`](https://github.com/vixxer/vixxer-mensajero-backend).

### Problemas que resuelve

- Registro sin necesidad de número telefónico ni CURP.
- Cifrado extremo a extremo (E2EE) por defecto.
- Comunicación posible en zonas sin cobertura celular (post-MVP, vía gateway BLE).

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | React Native + Expo (SDK 51+) |
| Lenguaje | JavaScript / TypeScript |
| Navegación | React Navigation |
| Estado | React Context + Hooks |
| Estilos | NativeWind (Tailwind para React Native) |
| Tiempo real | Socket.IO Client |
| Cifrado | TweetNaCl.js |
| Almacenamiento local | AsyncStorage |
| Bluetooth (post-MVP) | react-native-ble-plx |
| Build | EAS Build |

---

## Estado del proyecto y roadmap

**Versión actual:** `0.1.0` (Sprint 0 — Setup)

| Versión | Sprint | Funcionalidad | Estado |
|---|---|---|---|
| 0.1.0 | Sprint 0 | Setup de infraestructura, repos, gitflow | En curso |
| 0.2.0 | Sprint 1 | Scaffolding de Expo + navegación base | Pendiente |
| 0.3.0 | Sprint 2 | Autenticación sin CURP/teléfono | Pendiente |
| 0.4.0 | Sprint 3 | Mensajería en tiempo real (texto plano) | Pendiente |
| 0.5.0 | Sprint 4 | Cifrado E2EE con TweetNaCl | Pendiente |
| 0.6.0 | Sprint 5 | UI pulida + persistencia offline | Pendiente |
| **1.0.0** | Sprint 6 | **MVP demo + release** | Pendiente |
| 1.1.0 | Post-MVP | Mensajería directa por BLE entre dispositivos cercanos | Backlog |
| 1.2.0 | Post-MVP | Gateway BLE — puente a internet vía otro dispositivo | Backlog |

---

## Requisitos previos

- **Node.js** 20 o superior — [nodejs.org](https://nodejs.org)
- **npm** 10+ (incluido con Node)
- **Git** — [git-scm.com](https://git-scm.com)
- **Expo Go** instalado en tu celular Android — [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **Editor recomendado:** Visual Studio Code con extensiones de React Native y ESLint

Verifica tus versiones:

```bash
node --version    # >= v20.0.0
npm --version     # >= 10.0.0
git --version
```

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/vixxer/vixxer-mensajero-mobile.githttps://dash.cloudflare.com/fc0e7324b2578472c131e2b16cc74a3d/home/overview
cd vixxer-mensajero-mobile

# 2. Cambiar a la rama de integración
git checkout develop

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend (ver siguiente sección)

# 5. Iniciar el servidor de desarrollo
npx expo start
```

Una vez iniciado, escanea el código QR que aparece en la terminal con la app **Expo Go** en tu celular. La app se cargará automáticamente.

> **Importante:** tu celular y tu laptop deben estar en la misma red Wi-Fi.

---

## Variables de entorno

Las variables que el cliente puede leer deben tener el prefijo `EXPO_PUBLIC_`. Revisa [`.env.example`](.env.example) para la lista completa.

| Variable | Descripción | Ejemplo |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL del backend REST | `http://192.168.1.100:3000` |
| `EXPO_PUBLIC_SOCKET_URL` | URL del servidor Socket.IO | `http://192.168.1.100:3000` |
| `EXPO_PUBLIC_ENV` | Entorno (`development`, `production`) | `development` |

> **Tip:** si pruebas desde tu celular físico contra un backend local, usa la IP LAN de tu laptop, no `localhost`. Encuentra tu IP con `ipconfig` (Windows) o `ifconfig` (Mac/Linux).

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run android` | Abre la app en un emulador o dispositivo Android conectado |
| `npm run web` | Abre la app en el navegador (modo web de Expo) |
| `npm run lint` | Corre el linter (ESLint) |
| `npm run format` | Formatea el código con Prettier |

---

## Estructura del proyecto

```
vixxer-mensajero-mobile/
├── .github/
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/           # (futuro)
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── src/
│   ├── components/               # Componentes reutilizables
│   ├── screens/                  # Pantallas (Login, Chat, Settings)
│   ├── navigation/               # Configuración de React Navigation
│   ├── services/                 # API client, Socket.IO client
│   ├── crypto/                   # Cifrado E2EE (Sprint 4+)
│   ├── storage/                  # Wrappers de AsyncStorage
│   ├── hooks/                    # Custom hooks
│   ├── context/                  # React Context providers
│   ├── utils/                    # Helpers generales
│   └── constants/                # Constantes y configuración
├── App.js                        # Entry point
├── app.json                      # Configuración de Expo
├── babel.config.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Flujo de trabajo (Gitflow)

Vixxer sigue un Gitflow simplificado con dos ramas permanentes y ramas temporales de feature.

### Ramas permanentes

- **`main`** — Releases estables. Solo se mergea desde `release/*` o `hotfix/*`.
- **`develop`** — Rama de integración. Todo el trabajo del equipo converge aquí.

### Ramas temporales

| Prefijo | Sale de | Regresa a | Para qué |
|---|---|---|---|
| `feature/` | `develop` | `develop` | Nueva funcionalidad |
| `fix/` | `develop` | `develop` | Corrección de bug en develop |
| `hotfix/` | `main` | `main` y `develop` | Bug urgente en producción |
| `release/` | `develop` | `main` y `develop` | Preparación de release |

### Flujo paso a paso

```bash
# 1. Sincroniza develop
git checkout develop
git pull origin develop

# 2. Crea tu rama
git checkout -b feature/nombre-de-la-tarea

# 3. Trabaja y commitea con Conventional Commits
git add .
git commit -m "feat(auth): agregar pantalla de login"

# 4. Sube tu rama
git push origin feature/nombre-de-la-tarea

# 5. Abre Pull Request en GitHub hacia develop
# 6. Espera revisión y aprobación
# 7. Merge con Squash and merge
```

Documentación completa en [`vixxer-docs/gitflow.md`](https://github.com/vixxer/vixxer-docs).

---

## Convenciones

### Conventional Commits

Formato: `<tipo>(<scope>): <mensaje en presente, minúsculas, sin punto>`

| Tipo | Para |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `style` | Formato, sin cambio de lógica |
| `refactor` | Refactor sin cambio funcional |
| `test` | Tests |
| `chore` | Mantenimiento, deps |

Ejemplos:
```
feat(auth): implementar registro sin CURP
fix(socket): reconectar al perder conexion
docs(readme): agregar pasos de setup
```

### Nomenclatura de archivos

- Componentes: `PascalCase.jsx` (ej. `MessageBubble.jsx`)
- Hooks: `useCamelCase.js` (ej. `useAuth.js`)
- Servicios y utils: `camelCase.js` (ej. `apiClient.js`)
- Constantes: `UPPER_SNAKE_CASE` dentro del archivo

### Estilo de código

- 2 espacios de indentación
- Comillas simples para strings
- Punto y coma al final de sentencias
- Trailing commas en objetos y arrays multilinea
- ESLint + Prettier configurados en el proyecto

---

## Equipo

| Rol | Nombre | Área |
|---|---|---|
| Captain / Backend | César Servín González | Backend, infraestructura, PO |
| Backend | Ricardo Uriel Sierra Lira | Backend, Socket.IO |
| Frontend | Paola Ornelas Galván | Mobile UI |
| Frontend | Raúl Leyva Carral | Mobile UI |

---

## Licencia

Este proyecto está bajo licencia **MIT**. Ver [`LICENSE`](LICENSE) para más detalles.

---

<div align="center">

**Vixxer Mensajero** — Hecho por estudiantes de la Universidad de Guanajuato.

</div>