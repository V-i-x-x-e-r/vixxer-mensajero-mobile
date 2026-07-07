import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, FlatList, Modal, Platform, Alert, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useAudioRecorder, useAudioRecorderState, AudioModule, RecordingPresets } from "expo-audio";
import * as api from "../../lib/api";
import { obtenerSocket, asegurarSocket } from "../../lib/socket";
import { cifrar, descifrar, cifrarArchivo } from "../../lib/crypto";
import { leerBase64 } from "../../lib/archivos";
import { guardarCache } from "../../lib/mediaCache";
import { generarPreview } from "../../lib/mediaPreview";
import { publicarProgreso, limpiarProgreso } from "../../lib/progresoMedia";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { leerCacheChat, guardarCacheChat } from "../../lib/chatCache";
import { leerOutbox, agregarOutbox, quitarOutbox } from "../../lib/outbox";
import { leerFijados, alternarFijado, quitarFijado } from "../../lib/mensajeFijado";
import { leerTemporizador, guardarTemporizador, envolver, leerEfimero, expiraEn, OPCIONES, etiquetaDuracion, envolverAviso, leerAviso, textoAviso } from "../../lib/efimero";
import { aliasDe } from "../../lib/alias";
import { alEntrante, enviarPorCercania } from "../../lib/bleMensajeria";
import { estadoCercania } from "../../lib/cercania";
import { ChatEsqueleto } from "../../components/Esqueleto";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Candado } from "../../components/Candado";
import { Visto } from "../../components/Visto";
import { Avatar } from "../../components/Avatar";
import { Reloj } from "../../components/Reloj";
import { Check } from "../../components/Check";
import { SelectorSticker } from "../../components/SelectorSticker";
import { Telefono } from "../../components/Telefono";
import { Videollamada } from "../../components/Videollamada";
import { llamadasDisponibles } from "../../lib/llamadas";
import { Burbuja } from "../../components/chat/Burbuja";
import { BarraEntrada } from "../../components/chat/BarraEntrada";
import { AccionesMensaje } from "../../components/AccionesMensaje";
import { SelectorContacto } from "../../components/SelectorContacto";
import { Reenviar } from "../../components/Reenviar";
import { Bote } from "../../components/Bote";
import { Silencio } from "../../components/Silencio";
import { Ojo } from "../../components/Ojo";
import { Confirmacion } from "../../components/Confirmacion";
import { leerEstados, alternarSilenciado } from "../../lib/chatLocal";
import { guardarMedia } from "../../lib/descargas";
import { leerOcultos, ocultarMensaje } from "../../lib/ocultos";
import { normalizarMuestras } from "../../lib/audioWave";
import { PrevioMedia } from "../../components/chat/PrevioMedia";
import { Lupa } from "../../components/Lupa";
import { Kebab } from "../../components/Kebab";
import { Pin } from "../../components/Pin";
import { aFecha, mismoDia, etiquetaDia, hora } from "../../lib/fechas";
import { tick } from "../../lib/haptica";

const GRIS_VISTO = "#8E8E93";

function leerMedia(texto)
{
  if (!texto || texto[0] !== "{")
  {
    return null;
  }
  try
  {
    const obj = JSON.parse(texto);
    return obj && (obj.t === "img" || obj.t === "video" || obj.t === "audio" || obj.t === "sticker") ? obj : null;
  }
  catch (e)
  {
    return null;
  }
}

function detalleTexto(item, mio)
{
  const partes = [`Enviado ${hora(item.enviado_en)}`];
  if (mio && item.entregado_en)
  {
    partes.push(`Entregado ${hora(item.entregado_en)}`);
  }
  if (mio && item.leido_en)
  {
    partes.push(`Visto ${hora(item.leido_en)}`);
  }
  return partes.join("  ·  ");
}

function existente(lista, m)
{
  return lista.some((x) => x.id === m.id || (m.cliente_id && (x.cliente_id === m.cliente_id || x.id === m.cliente_id)));
}

export default function Chat()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const esWeb = Platform.OS === "web";
  const { id: otroId, usuario, avatar } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [presencia, setPresencia] = useState(null);
  const [lejos, setLejos] = useState(false);
  const [nuevosAbajo, setNuevosAbajo] = useState(0);
  const [sel, setSel] = useState(null);
  const [respondiendo, setRespondiendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [previo, setPrevio] = useState(null);
  const [stickers, setStickers] = useState(false);
  const [reenviando, setReenviando] = useState(null);
  const [reenviandoMulti, setReenviandoMulti] = useState(false);
  const [reenviadoA, setReenviadoA] = useState(null);
  const [seleccionando, setSeleccionando] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [menu, setMenu] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [silenciado, setSilenciado] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [toast, setToast] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [fijados, setFijados] = useState([]);
  const [indiceFijado, setIndiceFijado] = useState(0);
  const [temporizador, setTemporizador] = useState(0);
  const [pickerTemp, setPickerTemp] = useState(false);
  const [alias, setAlias] = useState(null);
  const [hayMas, setHayMas] = useState(true);
  const [masCargando, setMasCargando] = useState(false);
  const grabadora = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const estadoGrab = useAudioRecorderState(grabadora, 150);
  const muestras = useRef([]);
  const [ocultos, setOcultos] = useState(() => new Set());
  const miId = useRef(null);
  const lista = useRef(null);
  const lejosRef = useRef(false);
  const tecleando = useRef(null);
  const cargandoMas = useRef(false);
  const purgados = useRef(new Set());
  const mediaPendiente = useRef({});

  const invertidos = useMemo(() =>
  {
    const visibles = ocultos.size ? mensajes.filter((m) => !ocultos.has(m.id)) : mensajes;
    const base = buscando && consulta.trim()
      ? visibles.filter((m) => !leerMedia(m.texto) && !leerAviso(m.texto) && m.texto.toLowerCase().includes(consulta.trim().toLowerCase()))
      : visibles;
    return base.slice().reverse();
  }, [mensajes, buscando, consulta, ocultos]);

  const datosWeb = useMemo(() => invertidos.slice().reverse(), [invertidos]);
  const datosLista = esWeb ? datosWeb : invertidos;

  function marcarLeidos(filas)
  {
    const ids = filas
      .filter((m) => m.remitente_id === otroId && !String(m.id).startsWith("local-"))
      .map((m) => m.id);
    if (ids.length === 0)
    {
      return;
    }
    const socket = obtenerSocket();
    if (socket)
    {
      socket.emit("mensaje:leido", { ids });
    }
  }

  function escribir(t)
  {
    setTexto(t);
    const socket = obtenerSocket();
    if (!socket)
    {
      return;
    }
    socket.emit("usuario:escribiendo", { para: otroId, activo: true });
    if (tecleando.current)
    {
      clearTimeout(tecleando.current);
    }
    tecleando.current = setTimeout(() =>
    {
      socket.emit("usuario:escribiendo", { para: otroId, activo: false });
    }, 1500);
  }

  useEffect(() =>
  {
    api.presencia(otroId).then(setPresencia).catch(() => {});
    leerFijados(otroId).then(setFijados);
    leerTemporizador(otroId).then(setTemporizador);
    aliasDe(otroId).then(setAlias);
    leerEstados().then((e) => setSilenciado(e.silenciados.includes(otroId)));
  }, [otroId]);

  function verContacto()
  {
    setMenu(false);
    router.push({ pathname: "/perfil/[id]", params: { id: otroId, usuario: usuario || "", avatar: avatar || "" } });
  }

  async function descargarMedia(mensaje)
  {
    const media = leerMedia(mensaje.texto);
    setSel(null);
    if (!media)
    {
      return;
    }
    setToast("Descargando…");
    const r = await guardarMedia(media);
    const etiquetas = { ok: "Guardado en tu galería ✓", web: "No disponible en web", sin_permiso: "Sin permiso de galería", error: "No se pudo guardar" };
    setToast(etiquetas[r] || "No se pudo guardar");
    setTimeout(() => setToast(""), 2000);
  }

  async function alternarSilencio()
  {
    setMenu(false);
    const lista = await alternarSilenciado(otroId);
    setSilenciado(lista.includes(otroId));
  }

  async function vaciarChat()
  {
    setConfirmar(null);
    setMenu(false);
    try
    {
      await api.limpiarConversacion(otroId);
    }
    catch (e)
    {
    }
    setMensajes([]);
    guardarCacheChat(otroId, []);
  }

  async function bloquearContacto()
  {
    setConfirmar(null);
    setMenu(false);
    try
    {
      await api.bloquear(otroId);
    }
    catch (e)
    {
    }
    router.back();
  }

  async function elegirTemporizador(segundos)
  {
    setPickerTemp(false);
    if (segundos === temporizador)
    {
      return;
    }
    setTemporizador(segundos);
    guardarTemporizador(otroId, segundos);
    await mandar(envolverAviso(segundos));
  }

  async function alternarFijar(mensaje)
  {
    setSel(null);
    const ef = leerEfimero(mensaje.texto);
    const texto = leerMedia(mensaje.texto) ? "Multimedia" : ef ? ef.m : mensaje.texto;
    const nueva = await alternarFijado(otroId, { id: mensaje.id, texto, remitente_id: mensaje.remitente_id });
    setFijados(nueva);
    setIndiceFijado(0);
  }

  async function quitarFijar(id)
  {
    const nueva = await quitarFijado(otroId, id);
    setFijados(nueva);
    setIndiceFijado(0);
  }

  function irAFijado()
  {
    if (fijados.length === 0)
    {
      return;
    }
    const actual = fijados[indiceFijado % fijados.length];
    const idx = invertidos.findIndex((m) => m.id === actual.id);
    if (idx >= 0)
    {
      lista.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
    if (fijados.length > 1)
    {
      setIndiceFijado((i) => (i + 1) % fijados.length);
    }
  }

  useEffect(() =>
  {
    const barrer = () =>
    {
      const ahora = Date.now();
      setMensajes((prev) =>
      {
        const vivos = prev.filter((m) =>
        {
          const lim = expiraEn(m);
          if (lim === null || lim > ahora)
          {
            return true;
          }
          if (m.remitente_id === miId.current && !String(m.id).startsWith("local-") && !purgados.current.has(m.id))
          {
            purgados.current.add(m.id);
            socket_emit("mensaje:borrar", { id: m.id });
          }
          return false;
        });
        if (vivos.length !== prev.length)
        {
          guardarCacheChat(otroId, vivos);
          return vivos;
        }
        return prev;
      });
    };
    barrer();
    const t = setInterval(barrer, 5000);
    return () => clearInterval(t);
  }, [otroId]);

  useEffect(() =>
  {
    const quitar = alEntrante((m) =>
    {
      if (m.remitente_id !== otroId)
      {
        return;
      }
      setMensajes((prev) => (existente(prev, m) ? prev : [...prev, m]));
    });
    return quitar;
  }, [otroId]);

  async function abrir(fila)
  {
    const priv = await leer(CLAVE_PRIVADA);
    const pub = await llavePublicaDe(otroId);
    let claro = descifrar(fila.contenido_cifrado, fila.nonce, pub, priv);
    if (claro === null)
    {
      const fresca = await llavePublicaDe(otroId, true);
      claro = descifrar(fila.contenido_cifrado, fila.nonce, fresca, priv);
    }
    return claro ?? "No se pudo descifrar este mensaje";
  }

  async function descifrarLote(filas)
  {
    const priv = await leer(CLAVE_PRIVADA);
    let pub = await llavePublicaDe(otroId);
    let salida = filas.map((m) => ({ ...m, texto: descifrar(m.contenido_cifrado, m.nonce, pub, priv) }));
    if (salida.some((m) => m.texto === null))
    {
      pub = await llavePublicaDe(otroId, true);
      salida = salida.map((m) => (m.texto === null ? { ...m, texto: descifrar(m.contenido_cifrado, m.nonce, pub, priv) } : m));
    }
    return salida.map((m) => ({ ...m, texto: m.texto ?? "No se pudo descifrar este mensaje" }));
  }

  async function cargarMas()
  {
    if (cargandoMas.current || !hayMas || mensajes.length === 0)
    {
      return;
    }
    cargandoMas.current = true;
    setMasCargando(true);
    try
    {
      const filas = await api.historial(otroId, mensajes[0].enviado_en);
      if (filas.length === 0)
      {
        setHayMas(false);
      }
      else
      {
        const descifrados = await descifrarLote(filas);
        setMensajes((prev) => [...descifrados, ...prev]);
        if (filas.length < 50)
        {
          setHayMas(false);
        }
      }
    }
    catch (e)
    {
    }
    finally
    {
      cargandoMas.current = false;
      setMasCargando(false);
    }
  }

  useEffect(() =>
  {
    let activo = true;
    let socket = null;

    function alRecibir(fila)
    {
      if (fila.remitente_id !== otroId)
      {
        return;
      }
      abrir(fila).then((t) =>
      {
        if (activo)
        {
          setMensajes((prev) => (existente(prev, fila) ? prev : [...prev, { ...fila, texto: t }]));
          marcarLeidos([fila]);
          if (lejosRef.current)
          {
            setNuevosAbajo((n) => n + 1);
          }
        }
      });
    }

    function alEscribir(data)
    {
      if (data && data.de === otroId)
      {
        setEscribiendo(!!data.activo);
      }
    }

    function alEstado(data)
    {
      if (activo)
      {
        setMensajes((prev) => prev.map((m) => (m.id === data.id ? { ...m, ...data } : m)));
      }
    }

    function alReaccion(data)
    {
      if (activo)
      {
        setMensajes((prev) => prev.map((m) => (m.id === data.id ? { ...m, reacciones: data.reacciones } : m)));
      }
    }

    function alEditado(data)
    {
      abrir({ contenido_cifrado: data.contenido_cifrado, nonce: data.nonce }).then((t) =>
      {
        if (activo)
        {
          setMensajes((prev) => prev.map((m) => (m.id === data.id ? { ...m, texto: t, editado: true } : m)));
        }
      });
    }

    function alBorrado(data)
    {
      if (activo)
      {
        setMensajes((prev) => prev.map((m) => (m.id === data.id ? { ...m, contenido_cifrado: "BORRADO", texto: null } : m)));
      }
    }

    (async () =>
    {
      miId.current = await leer(MI_ID);
      leerOcultos(otroId).then((set) => activo && setOcultos(set));

      const cache = await leerCacheChat(otroId);
      if (cache && activo)
      {
        setMensajes(cache);
      }
      if (activo)
      {
        setCargado(true);
      }

      socket = await asegurarSocket();
      if (socket && activo)
      {
        socket.on("mensaje:recibido", alRecibir);
        socket.on("usuario:escribiendo", alEscribir);
        socket.on("mensaje:entregado", alEstado);
        socket.on("mensaje:leido", alEstado);
        socket.on("mensaje:reaccion", alReaccion);
        socket.on("mensaje:editado", alEditado);
        socket.on("mensaje:borrado", alBorrado);
        socket.on("connect", vaciarOutbox);
      }

      const pendientes = await leerOutbox(otroId);
      if (activo && pendientes.length)
      {
        setMensajes((prev) => [
          ...prev,
          ...pendientes
            .filter((i) => !prev.some((m) => m.id === i.localId))
            .map((i) => ({ id: i.localId, remitente_id: miId.current, texto: i.texto, enviado_en: i.enviado_en, estado: "enviando", respuestaTexto: i.respuestaTexto })),
        ]);
        pendientes.forEach(intentarEnviar);
      }
    })();

    return () =>
    {
      activo = false;
      if (socket)
      {
        socket.off("mensaje:recibido", alRecibir);
        socket.off("usuario:escribiendo", alEscribir);
        socket.off("mensaje:entregado", alEstado);
        socket.off("mensaje:leido", alEstado);
        socket.off("mensaje:reaccion", alReaccion);
        socket.off("mensaje:editado", alEditado);
        socket.off("mensaje:borrado", alBorrado);
        socket.off("connect", vaciarOutbox);
      }
    };
  }, [otroId]);

  const sincronizar = useCallback(async () =>
  {
    try
    {
      const filas = await api.historial(otroId);
      const descifrados = await descifrarLote(filas);
      const cacheActual = await leerCacheChat(otroId);
      if (descifrados.length > 0 || !cacheActual || cacheActual.length === 0)
      {
        setMensajes((prev) =>
        {
          const porMesh = prev.filter((m) => m.porBle && !descifrados.some((d) => d.id === m.id || d.cliente_id === m.id));
          const lista = porMesh.length > 0
            ? [...descifrados, ...porMesh].sort((a, b) => (a.enviado_en || "").localeCompare(b.enviado_en || ""))
            : descifrados;
          guardarCacheChat(otroId, lista);
          return lista;
        });
      }
      setHayMas(filas.length >= 50);
      marcarLeidos(descifrados);
    }
    catch (e)
    {
    }
  }, [otroId]);

  useFocusEffect(
    useCallback(() =>
    {
      sincronizar();
    }, [sincronizar]),
  );

  async function refrescar()
  {
    setRefrescando(true);
    await sincronizar();
    setRefrescando(false);
  }

  async function intentarCercania(item)
  {
    const r = await enviarPorCercania(otroId, item.contenidoCifrado, item.nonce).catch(() => ({ entregados: 0 }));
    if (r.entregados > 0)
    {
      await quitarOutbox(otroId, item.localId);
      setMensajes((prev) => prev.map((m) => (m.id === item.localId ? { ...m, id: r.id, cliente_id: r.id, estado: "enviado", porBle: true } : m)));
      return true;
    }
    setMensajes((prev) => prev.map((m) => (m.id === item.localId ? { ...m, estado: "fallido" } : m)));
    return false;
  }

  function intentarEnviar(item)
  {
    const socket = obtenerSocket();
    if (!socket || !socket.connected)
    {
      const cerca = estadoCercania();
      if (cerca.activo && cerca.cerca > 0)
      {
        intentarCercania(item);
        return;
      }
      setMensajes((prev) => prev.map((m) => (m.id === item.localId ? { ...m, estado: "fallido" } : m)));
      return;
    }
    let respondido = false;
    const limite = setTimeout(() =>
    {
      if (!respondido)
      {
        setMensajes((prev) => prev.map((m) => (m.id === item.localId ? { ...m, estado: "fallido" } : m)));
      }
    }, 8000);
    socket.emit(
      "mensaje:enviar",
      { destinatarioId: otroId, contenidoCifrado: item.contenidoCifrado, nonce: item.nonce, respuestaA: item.respuestaA, clienteId: item.localId },
      (r) =>
      {
        respondido = true;
        clearTimeout(limite);
        if (r && r.ok)
        {
          setMensajes((prev) => prev.map((m) => (m.id === item.localId ? { ...m, id: r.id, estado: "enviado" } : m)));
          quitarOutbox(otroId, item.localId);
        }
        else
        {
          setMensajes((prev) => prev.map((m) => (m.id === item.localId ? { ...m, estado: "fallido" } : m)));
        }
      },
    );
  }

  async function mandar(plano)
  {
    const priv = await leer(CLAVE_PRIVADA);
    const pubDest = await llavePublicaDe(otroId);
    const { contenidoCifrado, nonce } = cifrar(plano, pubDest, priv);
    const resp = respondiendo;
    const item = {
      localId: `local-${Date.now()}`,
      contenidoCifrado,
      nonce,
      respuestaA: resp ? resp.id : null,
      texto: plano,
      respuestaTexto: resp ? resp.texto : null,
      enviado_en: new Date().toISOString(),
    };
    setMensajes((prev) => [
      ...prev,
      {
        id: item.localId,
        remitente_id: miId.current,
        texto: item.texto,
        enviado_en: item.enviado_en,
        estado: "enviando",
        respuestaTexto: item.respuestaTexto,
      },
    ]);
    setRespondiendo(null);
    lista.current?.scrollToOffset({ offset: 0, animated: true });
    await agregarOutbox(otroId, item);
    intentarEnviar(item);
  }

  async function reintentar(mensaje)
  {
    const pendiente = mediaPendiente.current[mensaje.id];
    if (pendiente)
    {
      setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, estado: "enviando" } : m)));
      subirYEnviar(pendiente, mensaje.id);
      return;
    }
    const items = await leerOutbox(otroId);
    const item = items.find((i) => i.localId === mensaje.id);
    if (!item)
    {
      return;
    }
    setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, estado: "enviando" } : m)));
    intentarEnviar(item);
  }

  async function enviarPorBle(mensaje)
  {
    const items = await leerOutbox(otroId);
    const item = items.find((i) => i.localId === mensaje.id);
    if (!item)
    {
      return;
    }
    setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, estado: "enviando" } : m)));
    const r = await enviarPorCercania(otroId, item.contenidoCifrado, item.nonce);
    if (r.entregados > 0)
    {
      await quitarOutbox(otroId, item.localId);
      setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, id: r.id, cliente_id: r.id, estado: "enviado", porBle: true } : m)));
    }
    else
    {
      setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, estado: "fallido" } : m)));
    }
  }

  async function vaciarOutbox()
  {
    const items = await leerOutbox(otroId);
    for (const item of items)
    {
      setMensajes((prev) => prev.map((m) => (m.id === item.localId ? { ...m, estado: "enviando" } : m)));
      intentarEnviar(item);
    }
  }

  async function enviar()
  {
    const limpio = texto.trim();
    if (!limpio)
    {
      return;
    }

    if (editando)
    {
      const socket = await asegurarSocket();
      if (!socket)
      {
        return;
      }
      const priv = await leer(CLAVE_PRIVADA);
      const pubDest = await llavePublicaDe(otroId);
      const { contenidoCifrado, nonce } = cifrar(limpio, pubDest, priv);
      const objetivo = editando.id;
      socket.emit("mensaje:editar", { id: objetivo, destinatarioId: otroId, contenidoCifrado, nonce });
      setMensajes((prev) => prev.map((m) => (m.id === objetivo ? { ...m, texto: limpio, editado: true } : m)));
      setEditando(null);
      setTexto("");
      return;
    }

    if (tecleando.current)
    {
      clearTimeout(tecleando.current);
    }
    socket_emit("usuario:escribiendo", { para: otroId, activo: false });
    setTexto("");
    await mandar(temporizador > 0 ? envolver(limpio, temporizador) : limpio);
  }

  function aMedia(asset)
  {
    return {
      uri: asset.uri,
      esVideo: asset.type === "video",
      mime: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
      ancho: asset.width,
      alto: asset.height,
      dur: asset.duration ? Math.round(asset.duration / 1000) : undefined,
    };
  }

  async function adjuntar()
  {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted)
    {
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.6,
      videoMaxDuration: 20,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (r.canceled)
    {
      return;
    }
    if (r.assets.length === 1)
    {
      setPrevio(aMedia(r.assets[0]));
      return;
    }
    await enviarVarios(r.assets.map(aMedia));
  }

  function tipoDe(actual)
  {
    return actual.tipo || (actual.esVideo ? "video" : "img");
  }

  function mostrarMediaOptimista(actual)
  {
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const texto = JSON.stringify({
      t: tipoDe(actual),
      local: actual.uri,
      mime: actual.mime,
      w: actual.ancho,
      h: actual.alto,
      dur: actual.dur,
      cap: actual.cap,
      wf: actual.wf,
      pid: localId,
    });
    setMensajes((prev) => [
      ...prev,
      { id: localId, remitente_id: miId.current, texto, enviado_en: new Date().toISOString(), estado: "enviando" },
    ]);
    return localId;
  }

  async function subirYEnviar(actual, localId)
  {
    mediaPendiente.current[localId] = actual;
    try
    {
      publicarProgreso(localId, 0);
      const extra = await generarPreview({ ...actual, tipo: tipoDe(actual) });
      const base64 = await leerBase64(actual.uri);
      const cif = cifrarArchivo(base64);
      const { path } = await api.subirMediaConProgreso(cif.datos, (p) => publicarProgreso(localId, p * 0.95));
      guardarCache(path, actual.uri);
      const plano = JSON.stringify({
        t: tipoDe(actual),
        path,
        mime: actual.mime,
        k: cif.clave,
        n: cif.nonce,
        w: actual.ancho || extra.w,
        h: actual.alto || extra.h,
        dur: actual.dur,
        cap: actual.cap,
        wf: actual.wf,
        prev: extra.prev,
      });
      const priv = await leer(CLAVE_PRIVADA);
      const pubDest = await llavePublicaDe(otroId);
      const { contenidoCifrado, nonce } = cifrar(plano, pubDest, priv);
      const item = { localId, contenidoCifrado, nonce, respuestaA: null, texto: plano, respuestaTexto: null, enviado_en: new Date().toISOString() };
      setMensajes((prev) => prev.map((m) => (m.id === localId ? { ...m, texto: plano } : m)));
      await agregarOutbox(otroId, item);
      intentarEnviar(item);
      delete mediaPendiente.current[localId];
      limpiarProgreso(localId);
    }
    catch (e)
    {
      publicarProgreso(localId, null);
      setMensajes((prev) => prev.map((m) => (m.id === localId ? { ...m, estado: "fallido" } : m)));
    }
  }

  async function enviarVarios(archivos)
  {
    const trabajos = archivos.map((actual) => ({ actual, localId: mostrarMediaOptimista(actual) }));
    lista.current?.scrollToOffset({ offset: 0, animated: true });
    for (const t of trabajos)
    {
      await subirYEnviar(t.actual, t.localId);
    }
  }

  function confirmarEnvio(cap)
  {
    if (!previo)
    {
      return;
    }
    const actual = { ...previo, cap };
    setPrevio(null);
    const localId = mostrarMediaOptimista(actual);
    lista.current?.scrollToOffset({ offset: 0, animated: true });
    subirYEnviar(actual, localId);
  }

  function enviarSticker(uri)
  {
    setStickers(false);
    const actual = { uri, tipo: "sticker", mime: "image/png" };
    const localId = mostrarMediaOptimista(actual);
    lista.current?.scrollToOffset({ offset: 0, animated: true });
    subirYEnviar(actual, localId);
  }

  async function grabarToggle()
  {
    if (grabando)
    {
      setGrabando(false);
      setSubiendo(true);
      try
      {
        const dur = Math.max(1, Math.round(grabadora.currentTime || 0));
        await grabadora.stop();
        const uri = grabadora.uri;
        if (uri)
        {
          const wf = normalizarMuestras(muestras.current);
          const base64 = await leerBase64(uri);
          const cif = cifrarArchivo(base64);
          const { path } = await api.subirMedia(cif.datos);
          await mandar(JSON.stringify({ t: "audio", path, mime: "audio/mp4", k: cif.clave, n: cif.nonce, dur, wf: wf || undefined }));
        }
      }
      catch (e)
      {
        Alert.alert("No se pudo enviar la nota de voz", "Revisa tu conexión e intenta de nuevo.");
      }
      finally
      {
        setSubiendo(false);
      }
      return;
    }

    const permiso = await AudioModule.requestRecordingPermissionsAsync();
    if (!permiso.granted)
    {
      return;
    }
    try
    {
      muestras.current = [];
      await grabadora.prepareToRecordAsync();
      grabadora.record();
      setGrabando(true);
    }
    catch (e)
    {
    }
  }

  function reaccionar(mensaje, emoji)
  {
    socket_emit("mensaje:reaccionar", { id: mensaje.id, emoji });
    setMensajes((prev) =>
      prev.map((m) =>
      {
        if (m.id !== mensaje.id)
        {
          return m;
        }
        const r = { ...(m.reacciones || {}) };
        if (r[miId.current] === emoji)
        {
          delete r[miId.current];
        }
        else
        {
          r[miId.current] = emoji;
        }
        return { ...m, reacciones: r };
      }),
    );
    setSel(null);
  }

  function socket_emit(evento, datos)
  {
    const socket = obtenerSocket();
    if (socket)
    {
      socket.emit(evento, datos);
    }
  }

  function borrar(mensaje)
  {
    socket_emit("mensaje:borrar", { id: mensaje.id });
    setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, contenido_cifrado: "BORRADO", texto: null } : m)));
    if (fijados.some((f) => f.id === mensaje.id))
    {
      quitarFijar(mensaje.id);
    }
    setSel(null);
  }

  async function copiar(mensaje)
  {
    const ef = leerEfimero(mensaje.texto);
    await Clipboard.setStringAsync(ef ? ef.m : mensaje.texto);
    setSel(null);
  }

  function responder(mensaje)
  {
    setRespondiendo(mensaje);
    setEditando(null);
    setSel(null);
  }

  function abrirReenvio(mensaje)
  {
    setReenviando(mensaje);
    setSel(null);
  }

  async function hacerReenvio(amigo)
  {
    const objetivo = reenviando;
    setReenviando(null);
    if (!objetivo)
    {
      return;
    }
    const socket = obtenerSocket();
    if (!socket || !socket.connected)
    {
      Alert.alert("Sin conexión", "Conéctate para reenviar el mensaje.");
      return;
    }
    const priv = await leer(CLAVE_PRIVADA);
    const pub = await llavePublicaDe(amigo.id);
    const { contenidoCifrado, nonce } = cifrar(objetivo.texto, pub, priv);
    socket.emit("mensaje:enviar", { destinatarioId: amigo.id, contenidoCifrado, nonce, respuestaA: null });
    setReenviadoA(amigo.usuario);
    setTimeout(() => setReenviadoA(null), 1600);
  }

  function iniciarSeleccion(mensaje)
  {
    setSeleccionando(true);
    setSeleccionados([mensaje.id]);
    setSel(null);
  }

  function alternarSeleccion(mensaje)
  {
    setSeleccionados((prev) => (prev.includes(mensaje.id) ? prev.filter((x) => x !== mensaje.id) : [...prev, mensaje.id]));
  }

  function salirSeleccion()
  {
    setSeleccionando(false);
    setSeleccionados([]);
  }

  function borrarSeleccionados()
  {
    const mios = mensajes.filter((m) => seleccionados.includes(m.id) && m.remitente_id === miId.current && !String(m.id).startsWith("local-"));
    const ids = mios.map((m) => m.id);
    ids.forEach((id) => socket_emit("mensaje:borrar", { id }));
    setMensajes((prev) => prev.filter((m) => !ids.includes(m.id)));
    salirSeleccion();
  }

  async function hacerReenvioMultiple(amigo)
  {
    setReenviandoMulti(false);
    const elegidos = mensajes.filter((m) => seleccionados.includes(m.id));
    salirSeleccion();
    const socket = obtenerSocket();
    if (!socket || !socket.connected)
    {
      Alert.alert("Sin conexión", "Conéctate para reenviar.");
      return;
    }
    const priv = await leer(CLAVE_PRIVADA);
    const pub = await llavePublicaDe(amigo.id);
    for (const m of elegidos)
    {
      const { contenidoCifrado, nonce } = cifrar(m.texto, pub, priv);
      socket.emit("mensaje:enviar", { destinatarioId: amigo.id, contenidoCifrado, nonce, respuestaA: null });
    }
    setReenviadoA(amigo.usuario);
    setTimeout(() => setReenviadoA(null), 1600);
  }

  function editar(mensaje)
  {
    setEditando(mensaje);
    setRespondiendo(null);
    setTexto(mensaje.texto);
    setSel(null);
  }

  useEffect(() =>
  {
    if (grabando && estadoGrab && typeof estadoGrab.metering === "number")
    {
      muestras.current.push(estadoGrab.metering);
    }
  }, [estadoGrab, grabando]);

  async function borrarLocal(mensaje)
  {
    setSel(null);
    const set = await ocultarMensaje(otroId, mensaje.id);
    setOcultos(new Set(set));
  }

  function alDesplazar(e)
  {
    const l = e.nativeEvent.contentOffset.y > 240;
    lejosRef.current = l;
    setLejos(l);
    if (!l)
    {
      setNuevosAbajo(0);
    }
  }

  const fijadoActual = fijados.length ? fijados[indiceFijado % fijados.length] : null;
  const sub = escribiendo
    ? "escribiendo…"
    : presencia && presencia.en_linea
      ? "en línea"
      : presencia && presencia.ultima_conexion
        ? `últ. vez ${hora(presencia.ultima_conexion)}`
        : null;

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              onPress={() => router.push({ pathname: "/perfil/[id]", params: { id: otroId, usuario: usuario || "", avatar: avatar || "" } })}
              style={({ pressed }) => [estilos.encabezado, pressed && estilos.presionadoLeve]}
            >
              <Avatar nombre={alias || usuario || ""} uri={avatar || null} tamano={32} />
              <View>
                <Text style={[estilos.encabezadoTxt, { color: colores.texto }]}>{alias || usuario || "Conversación"}</Text>
                {sub ? <Text style={[estilos.encabezadoSub, { color: colores.muted }]}>{sub}</Text> : null}
              </View>
            </Pressable>
          ),
          headerRight: () => (
            <View style={estilos.headerAcciones}>
              {llamadasDisponibles() ? (
                <>
                  <Pressable
                    onPress={() => router.push({ pathname: "/llamada", params: { id: otroId, usuario: alias || usuario || "", video: "0" } })}
                    hitSlop={8}
                    style={({ pressed }) => pressed && estilos.presionadoLeve}
                  >
                    <Telefono color={colores.texto} tamano={20} />
                  </Pressable>
                  <Pressable
                    onPress={() => router.push({ pathname: "/llamada", params: { id: otroId, usuario: alias || usuario || "", video: "1" } })}
                    hitSlop={8}
                    style={({ pressed }) => pressed && estilos.presionadoLeve}
                  >
                    <Videollamada color={colores.texto} tamano={21} />
                  </Pressable>
                </>
              ) : null}
              <Pressable
                onPress={() =>
                {
                  setBuscando((b) => !b);
                  setConsulta("");
                }}
                hitSlop={8}
                style={({ pressed }) => pressed && estilos.presionadoLeve}
              >
                <Lupa color={colores.texto} tamano={20} />
              </Pressable>
              <Pressable onPress={() => setMenu(true)} hitSlop={8} style={({ pressed }) => pressed && estilos.presionadoLeve}>
                <Kebab color={temporizador > 0 ? colores.botonFondo : colores.texto} tamano={20} />
              </Pressable>
            </View>
          ),
        }}
      />

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={estilos.menuFondo} onPress={() => setMenu(false)}>
          <View style={[estilos.menuCaja, { backgroundColor: colores.surface, borderColor: colores.borde, top: insets.top + 48 }]}>
            <Pressable
              onPress={() => { setMenu(false); setPickerTemp(true); }}
              style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionadoLeve]}
            >
              <Reloj color={temporizador > 0 ? colores.botonFondo : colores.texto} tamano={18} />
              <View style={{ flex: 1 }}>
                <Text style={[estilos.menuTxt, { color: colores.texto }]}>Mensajes temporales</Text>
                <Text style={[estilos.menuSub, { color: colores.muted }]}>{temporizador > 0 ? etiquetaDuracion(temporizador) : "Desactivado"}</Text>
              </View>
            </Pressable>
            <View style={[estilos.menuDivisor, { backgroundColor: colores.borde }]} />
            <Pressable onPress={alternarSilencio} style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionadoLeve]}>
              <Silencio color={silenciado ? colores.botonFondo : colores.texto} tamano={18} />
              <Text style={[estilos.menuTxt, { color: colores.texto }]}>{silenciado ? "Activar sonido" : "Silenciar"}</Text>
            </Pressable>
            <Pressable onPress={verContacto} style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionadoLeve]}>
              <Ojo color={colores.texto} tamano={18} />
              <Text style={[estilos.menuTxt, { color: colores.texto }]}>Ver contacto</Text>
            </Pressable>
            <Pressable onPress={() => { setMenu(false); setConfirmar("vaciar"); }} style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionadoLeve]}>
              <Bote color={colores.texto} tamano={18} />
              <Text style={[estilos.menuTxt, { color: colores.texto }]}>Vaciar chat</Text>
            </Pressable>
            <Pressable onPress={() => { setMenu(false); setConfirmar("bloquear"); }} style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionadoLeve]}>
              <Candado color={colores.error} tamano={18} />
              <Text style={[estilos.menuTxt, { color: colores.error }]}>Bloquear</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Confirmacion
        visible={confirmar === "vaciar"}
        titulo="Vaciar chat"
        mensaje="Se quitarán los mensajes de esta conversación en tu dispositivo."
        textoConfirmar="Vaciar"
        destructivo
        onConfirmar={vaciarChat}
        onCancelar={() => setConfirmar(null)}
      />

      <Confirmacion
        visible={confirmar === "bloquear"}
        titulo={`Bloquear a ${alias || usuario || "este contacto"}`}
        mensaje="No podrá escribirte ni volver a agregarte, y se quitará de tus chats. Podrás desbloquearlo más adelante."
        textoConfirmar="Bloquear"
        destructivo
        onConfirmar={bloquearContacto}
        onCancelar={() => setConfirmar(null)}
      />

      <View style={estilos.topOverlay} pointerEvents="box-none">
        {buscando ? (
          <View style={[estilos.buscar, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Lupa color={colores.muted} tamano={16} />
            <TextInput
              value={consulta}
              onChangeText={setConsulta}
              placeholder="Buscar en la conversación"
              placeholderTextColor={colores.placeholder}
              autoFocus
              style={[estilos.buscarCampo, { color: colores.texto }]}
            />
            <Pressable onPress={() => { setBuscando(false); setConsulta(""); }} hitSlop={8}>
              <Text style={{ color: colores.muted, fontSize: 15 }}>{"✕"}</Text>
            </Pressable>
          </View>
        ) : null}

        {fijadoActual && !buscando ? (
          <Pressable onPress={irAFijado} style={[estilos.fijado, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Pin color={colores.muted} tamano={15} />
            <View style={estilos.fijadoCentro}>
              <Text style={[estilos.fijadoTitulo, { color: colores.muted }]}>{fijados.length > 1 ? `Fijados (${fijados.length})` : "Mensaje fijado"}</Text>
              <Text numberOfLines={1} style={[estilos.fijadoTxt, { color: colores.texto }]}>{fijadoActual.texto}</Text>
            </View>
            <Pressable onPress={() => quitarFijar(fijadoActual.id)} hitSlop={8}>
              <Text style={{ color: colores.muted, fontSize: 15 }}>{"✕"}</Text>
            </Pressable>
          </Pressable>
        ) : null}

        {temporizador > 0 && !buscando ? (
          <View style={estilos.tempPildoraFila} pointerEvents="box-none">
            <Pressable onPress={() => setPickerTemp(true)} style={({ pressed }) => [estilos.tempPildora, { backgroundColor: colores.surface, borderColor: colores.borde }, pressed && estilos.presionadoLeve]}>
              <Reloj color={colores.botonFondo} tamano={11} />
              <Text style={[estilos.tempPildoraTxt, { color: colores.texto }]}>{etiquetaDuracion(temporizador)}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <FlatList
        ref={lista}
        data={datosLista}
        keyExtractor={(m) => m.id}
        windowSize={9}
        maxToRenderPerBatch={8}
        initialNumToRender={14}
        inverted={!esWeb}
        style={estilos.flex}
        contentContainerStyle={estilos.lista}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.muted} colors={[colores.botonFondo]} />}
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        onEndReached={esWeb ? undefined : cargarMas}
        onEndReachedThreshold={0.3}
        onContentSizeChange={esWeb ? () => lista.current?.scrollToEnd({ animated: false }) : undefined}
        onScrollToIndexFailed={() => {}}
        ListFooterComponent={
          <View>
            {masCargando ? <ActivityIndicator color={colores.muted} style={estilos.masSpinner} /> : null}
            <View style={estilos.banner}>
              <Candado color={colores.muted} tamano={12} />
              <Text style={[estilos.bannerTxt, { color: colores.muted }]}>Cifrado de extremo a extremo</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) =>
        {
          const mio = item.remitente_id === miId.current;
          const prev = esWeb ? datosLista[index - 1] : datosLista[index + 1];
          const nuevoDia = !prev || !mismoDia(prev.enviado_en, item.enviado_en);
          const media = leerMedia(item.texto);
          const citadoCrudo = item.respuestaTexto
            ?? (item.respuesta_a ? (mensajes.find((m) => m.id === item.respuesta_a)?.texto ?? "Mensaje") : null);
          const citadoEf = citadoCrudo ? leerEfimero(citadoCrudo) : null;
          const citado = citadoCrudo && leerMedia(citadoCrudo) ? "Foto" : citadoEf ? citadoEf.m : citadoCrudo;

          const ef = leerEfimero(item.texto);
          const textoMostrar = ef ? ef.m : item.texto;
          const elegido = seleccionados.includes(item.id) || (sel && sel.mensaje.id === item.id);
          const borrado = item.contenido_cifrado === "BORRADO";
          const mediaVisual = !borrado && media && (media.t === "img" || media.t === "video" || media.t === "sticker");
          const mediaSolo = mediaVisual && !citado && !media.cap;
          const aviso = leerAviso(item.texto);

          if (aviso)
          {
            return (
              <View>
                {nuevoDia ? (
                  <View style={estilos.dia}>
                    <Text style={[estilos.diaTxt, { color: colores.muted, backgroundColor: colores.surface, borderColor: colores.borde }]}>
                      {etiquetaDia(item.enviado_en)}
                    </Text>
                  </View>
                ) : null}
                <View style={estilos.avisoSistema}>
                  <View style={[estilos.avisoPildora, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
                    <Reloj color={colores.muted} tamano={12} />
                    <Text style={[estilos.avisoPildoraTxt, { color: colores.muted }]}>{textoAviso(aviso.d)}</Text>
                  </View>
                </View>
              </View>
            );
          }

          const reciente = !esWeb && Date.now() - aFecha(item.enviado_en).getTime() < 2500;
          const metaColor = mio ? colores.botonTexto : colores.muted;
          const meta = mediaSolo ? (
            <>
              <Text style={estilos.horaMedia}>{hora(item.enviado_en)}</Text>
              {mio ? (
                item.estado === "fallido"
                  ? <Pressable onPress={() => reintentar(item)} hitSlop={8}><Text style={[estilos.reintentarTxt, { color: "#FFF" }]}>reintentar</Text></Pressable>
                  : item.estado === "enviando"
                    ? <Reloj color="#FFF" tamano={11} />
                    : <Visto color="#FFF" dos={!!item.entregado_en || !!item.leido_en} tamano={11} />
              ) : null}
            </>
          ) : (
            <>
              {ef ? <Reloj color={metaColor} tamano={11} /> : null}
              {item.editado ? <Text style={[estilos.editado, { color: metaColor }]}>editado</Text> : null}
              {item.porBle ? <Text style={[estilos.editado, { color: metaColor }]}>por cercanía</Text> : null}
              <Text style={[estilos.hora, { color: metaColor }]}>{hora(item.enviado_en)}</Text>
              {mio ? (
                item.estado === "fallido"
                  ? (
                      <View style={estilos.fallidoFila}>
                        <Pressable onPress={() => reintentar(item)} hitSlop={8} style={estilos.reintentar}>
                          <Text style={[estilos.reintentarTxt, { color: metaColor }]}>no enviado · reintentar</Text>
                        </Pressable>
                        <Pressable onPress={() => enviarPorBle(item)} hitSlop={8} style={estilos.reintentar}>
                          <Text style={[estilos.reintentarTxt, { color: metaColor }]}>· cercanía</Text>
                        </Pressable>
                      </View>
                    )
                  : item.estado === "enviando"
                    ? <Reloj color={GRIS_VISTO} tamano={11} />
                    : <Visto color={item.leido_en ? colores.botonTexto : GRIS_VISTO} dos={!!item.entregado_en || !!item.leido_en} tamano={11} />
              ) : null}
            </>
          );

          return (
            <View>
              {nuevoDia ? (
                <View style={estilos.dia}>
                  <Text style={[estilos.diaTxt, { color: colores.muted, backgroundColor: colores.surface, borderColor: colores.borde }]}>
                    {etiquetaDia(item.enviado_en)}
                  </Text>
                </View>
              ) : null}

              <Burbuja
                mio={mio}
                cita={citado}
                borrado={borrado}
                media={media}
                texto={textoMostrar}
                meta={meta}
                reacciones={item.reacciones}
                onMenu={seleccionando || borrado ? undefined : (coords) => setSel({ mensaje: item, ...coords })}
                onPress={seleccionando ? () => alternarSeleccion(item) : () => setDetalle((p) => (p === item.id ? null : item.id))}
                onResponder={borrado ? undefined : () => responder(item)}
                seleccionando={seleccionando}
                onToggle={() => alternarSeleccion(item)}
                resaltada={elegido}
                aparecer={reciente}
              />

              {detalle === item.id && !String(item.id).startsWith("local-") ? (
                <Text style={[estilos.visto, mio ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }, { color: colores.muted }]}>
                  {detalleTexto(item, mio)}
                </Text>
              ) : null}
            </View>
          );
        }}
      />

      {!cargado && mensajes.length === 0 ? (
        <View style={estilos.capa} pointerEvents="none">
          <ChatEsqueleto />
        </View>
      ) : null}

      {cargado && mensajes.length === 0 ? (
        <View style={[estilos.capa, estilos.vacioCentro]} pointerEvents="none">
          <Text style={[estilos.vacioTitulo, { color: colores.texto }]}>Aquí empieza tu conversación</Text>
          <Text style={[estilos.vacioTxt, { color: colores.muted }]}>Envía el primer mensaje para comenzar.</Text>
        </View>
      ) : null}

      {buscando && consulta.trim() && invertidos.length === 0 ? (
        <View style={[estilos.capa, estilos.vacioCentro]} pointerEvents="none">
          <Text style={[estilos.vacioTxt, { color: colores.muted }]}>Sin resultados.</Text>
        </View>
      ) : null}

      {lejos ? (
        <Pressable
          onPress={() => lista.current?.scrollToOffset({ offset: 0, animated: true })}
          style={[estilos.bajar, { backgroundColor: colores.surface, borderColor: colores.borde }]}
        >
          <Text style={{ color: colores.texto, fontSize: 18 }}>{"↓"}</Text>
          {nuevosAbajo > 0 ? (
            <View style={[estilos.bajarBadge, { backgroundColor: colores.botonFondo }]}>
              <Text style={[estilos.bajarBadgeTxt, { color: colores.botonTexto }]}>{nuevosAbajo > 99 ? "99+" : nuevosAbajo}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {seleccionando ? (
        <View style={[estilos.selBar, { borderTopColor: colores.borde, paddingBottom: 12 + insets.bottom }]}>
          <Pressable onPress={salirSeleccion} hitSlop={8} style={({ pressed }) => pressed && estilos.enviarPresionado}>
            <Text style={{ color: colores.texto, fontSize: 18 }}>{"✕"}</Text>
          </Pressable>
          <Text style={[estilos.selCount, { color: colores.texto }]}>{seleccionados.length}</Text>
          <View style={estilos.selAcciones}>
            <Pressable
              onPress={() => seleccionados.length > 0 && setReenviandoMulti(true)}
              disabled={seleccionados.length === 0}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: seleccionados.length === 0 ? 0.4 : 1 }, pressed && estilos.enviarPresionado]}
            >
              <Reenviar color={colores.texto} tamano={22} />
            </Pressable>
            <Pressable
              onPress={borrarSeleccionados}
              disabled={seleccionados.length === 0}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: seleccionados.length === 0 ? 0.4 : 1 }, pressed && estilos.enviarPresionado]}
            >
              <Bote color={colores.error} tamano={22} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {!seleccionando ? (
        <BarraEntrada
          valor={texto}
          onCambiar={escribir}
          onEnviar={enviar}
          onAdjuntar={adjuntar}
          onSticker={() => setStickers(true)}
          onMic={grabarToggle}
          grabando={grabando}
          subiendo={subiendo}
          editando={!!editando}
        >
          {respondiendo ? (
            <View style={[estilos.aviso, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
              <Text numberOfLines={1} style={[estilos.avisoTxt, { color: colores.muted }]}>
                Respondiendo: {respondiendo.texto}
              </Text>
              <Pressable onPress={() => setRespondiendo(null)} hitSlop={8}>
                <Text style={{ color: colores.muted, fontSize: 16 }}>{"✕"}</Text>
              </Pressable>
            </View>
          ) : null}
          {editando ? (
            <View style={[estilos.aviso, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
              <Text style={[estilos.avisoTxt, { color: colores.muted }]}>Editando mensaje</Text>
              <Pressable
                onPress={() =>
                {
                  setEditando(null);
                  setTexto("");
                }}
                hitSlop={8}
              >
                <Text style={{ color: colores.muted, fontSize: 16 }}>{"✕"}</Text>
              </Pressable>
            </View>
          ) : null}
        </BarraEntrada>
      ) : null}

      <AccionesMensaje
        sel={sel}
        esMio={sel ? sel.mensaje.remitente_id === miId.current : false}
        esMedia={sel ? !!leerMedia(sel.mensaje.texto) : false}
        fijado={sel ? fijados.some((f) => f.id === sel.mensaje.id) : false}
        onReaccionar={reaccionar}
        onResponder={responder}
        onReenviar={abrirReenvio}
        onSeleccionar={iniciarSeleccion}
        onCopiar={copiar}
        onEditar={editar}
        onBorrar={borrar}
        onBorrarLocal={borrarLocal}
        onFijar={alternarFijar}
        onDescargar={descargarMedia}
        onCerrar={() => setSel(null)}
      />

      {toast ? (
        <View style={estilos.toastChat} pointerEvents="none">
          <Text style={estilos.toastChatTxt}>{toast}</Text>
        </View>
      ) : null}

      <SelectorSticker
        visible={stickers}
        onElegir={enviarSticker}
        onCerrar={() => setStickers(false)}
      />

      <SelectorContacto
        visible={!!reenviando || reenviandoMulti}
        titulo="Reenviar a"
        onElegir={reenviandoMulti ? hacerReenvioMultiple : hacerReenvio}
        onCerrar={() =>
        {
          setReenviando(null);
          setReenviandoMulti(false);
        }}
      />

      {reenviadoA ? (
        <View style={estilos.pill} pointerEvents="none">
          <Text style={[estilos.pillTxt, { backgroundColor: colores.surface, color: colores.texto, borderColor: colores.borde }]}>
            Reenviado a {reenviadoA}
          </Text>
        </View>
      ) : null}

      <Modal transparent visible={pickerTemp} animationType="fade" onRequestClose={() => setPickerTemp(false)}>
        <Pressable style={estilos.tempFondo} onPress={() => setPickerTemp(false)}>
          <Pressable style={[estilos.tempHoja, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text style={[estilos.tempTitulo, { color: colores.texto }]}>Mensajes temporales</Text>
            <Text style={[estilos.tempSub, { color: colores.muted }]}>Los mensajes de texto nuevos se borran en ambos dispositivos al cumplirse el tiempo.</Text>
            {OPCIONES.map((o) => (
              <Pressable key={o.valor} onPress={() => elegirTemporizador(o.valor)} style={({ pressed }) => [estilos.tempOpcion, pressed && estilos.presionadoLeve]}>
                <Text style={[estilos.tempOpcionTxt, { color: colores.texto }]}>{o.etiqueta}</Text>
                {temporizador === o.valor ? <Check color={colores.botonFondo} tamano={18} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <PrevioMedia visible={!!previo} media={previo} onCancelar={() => setPrevio(null)} onEnviar={confirmarEnvio} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  flex: { flex: 1 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAcciones: { flexDirection: "row", alignItems: "center", gap: 18 },
  menuFondo: { flex: 1 },
  menuCaja: { position: "absolute", right: 10, minWidth: 224, borderWidth: 1, borderRadius: 14, paddingVertical: 6, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  menuDivisor: { height: 1, marginVertical: 4, marginHorizontal: 8 },
  menuTxt: { fontSize: 15, fontFamily: fuentes.media },
  menuSub: { fontSize: 12, marginTop: 2 },
  presionadoLeve: { opacity: 0.7 },
  encabezadoTxt: { fontSize: 17, fontFamily: fuentes.semibold },
  encabezadoSub: { fontSize: 12 },
  lista: { padding: 14, gap: 6 },
  capa: { position: "absolute", top: 0, left: 0, right: 0, bottom: 64 },
  vacioCentro: { alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 6 },
  vacioTitulo: { fontSize: 16, fontFamily: fuentes.semibold, textAlign: "center" },
  vacioTxt: { fontSize: 13, textAlign: "center" },
  masSpinner: { paddingVertical: 12 },
  banner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  bannerTxt: { fontSize: 12 },
  dia: { alignItems: "center", marginVertical: 8 },
  diaTxt: { fontSize: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  avisoSistema: { alignItems: "center", marginVertical: 10 },
  avisoPildora: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  avisoPildoraTxt: { fontSize: 12 },
  toastChat: { position: "absolute", bottom: 90, alignSelf: "center", paddingVertical: 10, paddingHorizontal: 22, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.8)" },
  toastChatTxt: { color: "#FFF", fontSize: 14, fontFamily: fuentes.media },
  burbuja: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  cita: { borderLeftWidth: 2, paddingLeft: 8, marginBottom: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginTop: 3 },
  metaMedia: { position: "absolute", bottom: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  horaMedia: { fontSize: 10, color: "#FFF" },
  editado: { fontSize: 10, opacity: 0.7, fontStyle: "italic" },
  hora: { fontSize: 10, opacity: 0.7 },
  reintentar: { marginLeft: 2 },
  fallidoFila: { flexDirection: "row", alignItems: "center", gap: 6 },
  reintentarTxt: { fontSize: 10, fontFamily: fuentes.media },
  pill: { position: "absolute", bottom: 90, left: 0, right: 0, alignItems: "center" },
  pillTxt: { fontSize: 13, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  topOverlay: { position: "absolute", top: 3, left: 0, right: 0, zIndex: 20 },
  buscar: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, height: 40, marginHorizontal: 12, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fijado: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 12, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fijadoCentro: { flex: 1, gap: 1 },
  fijadoTitulo: { fontSize: 11, fontFamily: fuentes.media },
  fijadoTxt: { fontSize: 13 },
  buscarCampo: { flex: 1, fontSize: 14, paddingVertical: 0 },
  tempPildoraFila: { alignItems: "center", marginTop: 3 },
  tempPildora: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  tempPildoraTxt: { fontSize: 11, fontFamily: fuentes.media },
  selBar: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  selCount: { flex: 1, fontSize: 16, fontFamily: fuentes.semibold },
  selAcciones: { flexDirection: "row", alignItems: "center", gap: 22 },
  visto: { alignSelf: "flex-end", fontSize: 10, marginTop: 2, marginRight: 2 },
  reaccionesFila: { flexDirection: "row", gap: 4, marginTop: 2 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  chipTxt: { fontSize: 12 },
  bajar:
  {
    position: "absolute",
    right: 16,
    bottom: 86,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bajarBadge:
  {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  bajarBadgeTxt: { fontSize: 11, fontFamily: fuentes.semibold },
  aviso:
  {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  avisoTxt: { flex: 1, fontSize: 13, marginRight: 8 },
  inputFila: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 12, borderTopWidth: 1 },
  campo: { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, maxHeight: 120, fontSize: 15 },
  enviar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  clip: { width: 32, height: 38, alignItems: "center", justifyContent: "center" },
  enviarPresionado: { transform: [{ scale: 0.92 }] },
  previoFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  previoTarjeta: { width: "100%", maxWidth: 360, borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  previoImagen: { width: "100%", height: 360, borderRadius: 12 },
  previoAcciones: { flexDirection: "row", gap: 10 },
  previoBoton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  tempFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  tempHoja: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, paddingBottom: 32, gap: 4 },
  tempTitulo: { fontSize: 17, fontFamily: fuentes.semibold },
  tempSub: { fontSize: 13, marginBottom: 8 },
  tempOpcion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  tempOpcionTxt: { fontSize: 16 },
});
