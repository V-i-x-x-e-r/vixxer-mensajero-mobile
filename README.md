# Vixxer Mensajero — Mobile

Cliente móvil de Vixxer (Android).

La arquitectura, el stack y las guías del proyecto son documentación interna del equipo.

## Builds Android

Para medir rendimiento real en teléfonos viejos, usa una build `preview` o `production`.
La build `development` queda marcada como `DEBUGGABLE`, mantiene soporte para Metro/dev client
y puede consumir bastante más CPU/RAM.

```bash
npm run build:android:preview
```

Usa `development` solo para depuración local:

```bash
npm run build:android:development
```

## Licencia

MIT — ver [`LICENSE`](LICENSE).
