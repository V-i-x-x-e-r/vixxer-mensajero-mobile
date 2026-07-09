import { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, Pressable, FlatList, Modal, Platform, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { useAudioRecorder, useAudioRecorderState, AudioModule, RecordingPresets } from "expo-audio";
import * as api from "../../lib/api";
import { cifrar, descifrar, cifrarArchivo } from "../../lib/crypto";
import { leerBase64 } from "../../lib/archivos";
import { llavePublicaDe } from "../../lib/llaves";
import { leerCacheChat, guardarCacheChat } from "../../lib/chatCache";
import { leerBorrador, guardarBorrador, guardarAudioBorrador } from "../../lib/borradores";
import { marcarVisto } from "../../lib/grupoVisto";
import { leerFijados, alternarFijado, quitarFijado } from "../../lib/mensajeFijado";
import { guardarMedia } from "../../lib/descargas";
import { leerOcultos, ocultarMensaje } from "../../lib/ocultos";
import { normalizarMuestras } from "../../lib/audioWave";
import { aFecha, hora, mismoDia, etiquetaDia } from "../../lib/fechas";
import { resumenMensaje, miniaturaDe } from "../../lib/resumen";
import { Image as ImagenExpo } from "expo-image";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { obtenerSocket } from "../../lib/socket";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Avatar } from "../../components/Avatar";
import { Burbuja } from "../../components/chat/Burbuja";
import { BarraEntrada } from "../../components/chat/BarraEntrada";
import { useEnvioMedia } from "../../components/chat/useEnvioMedia";
import { AccionesMensaje } from "../../components/AccionesMensaje";
import { SelectorContacto } from "../../components/SelectorContacto";
import { SelectorSticker } from "../../components/SelectorSticker";
import { Pin } from "../../components/Pin";
import { Visto } from "../../components/Visto";
import { Clip } from "../../components/Clip";
import { Documento } from "../../components/Documento";
import { Vidrio } from "../../components/Vidrio";
import { PrevioMedia } from "../../components/chat/PrevioMedia";

function leerMedia(texto)
{
  if (!texto || texto[0] !== "{")
  {
    return null;
  }
  try
  {
    const obj = JSON.parse(texto);
    return obj && (obj.t === "img" || obj.t === "video" || obj.t === "audio" || obj.t === "sticker" || obj.t === "file") ? obj : null;
  }
  catch (e)
  {
    return null;
  }
}

export default function GrupoChat()
{
  const { colores, oscuro } = useTema();
  const { id, nombre } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
  const [borrador, setBorrador] = useState("");
  const [miembros, setMiembros] = useState([]);
  const [grupo, setGrupo] = useState(null);
  const [grabando, setGrabando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [masCargando, setMasCargando] = useState(false);
  const [stickers, setStickers] = useState(false);
  const [sel, setSel] = useState(null);
  const [respondiendo, setRespondiendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [reenviando, setReenviando] = useState(null);
  const [reenviadoA, setReenviadoA] = useState(null);
  const [fijados, setFijados] = useState([]);
  const [aviso, setAviso] = useState("");
  const grabadora = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const estadoGrab = useAudioRecorderState(grabadora, 150);
  const muestras = useRef([]);
  const durMs = useRef(0);
  const [grabPausado, setGrabPausado] = useState(false);
  const [ocultos, setOcultos] = useState(() => new Set());
  const [previo, setPrevio] = useState(null);
  const [audioDraft, setAudioDraft] = useState(null);
  const [adjuntando, setAdjuntando] = useState(false);
  const [escribiendoDe, setEscribiendoDe] = useState(null);
  const [infoDe, setInfoDe] = useState(null);
  const tecleando = useRef(null);
  const escribiendoTimer = useRef(null);
  const marcados = useRef(new Set());
  const miId = useRef(null);
  const priv = useRef(null);
  const pubs = useRef({});
  const nombres = useRef({});
  const pendientesTexto = useRef({});
  const hayMas = useRef(true);
  const cargandoMas = useRef(false);
  const lista = useRef(null);
  const esWeb = Platform.OS === "web";
  const claveBorrador = `grupo-${id}`;

  function persistir(items)
  {
    guardarCacheChat(`g-${id}`, items);
  }

  useEffect(() =>
  {
    let activo = true;
    leerBorrador(claveBorrador).then((b) =>
    {
      if (!activo)
      {
        return;
      }
      if (b.texto)
      {
        setBorrador(b.texto);
      }
      if (b.audio)
      {
        setAudioDraft(b.audio);
      }
    });
    return () => { activo = false; };
  }, [claveBorrador]);

  useEffect(() =>
  {
    if (editando)
    {
      return;
    }
    const t = setTimeout(() => guardarBorrador(claveBorrador, { texto: borrador, audio: audioDraft }), 250);
    return () => clearTimeout(t);
  }, [claveBorrador, borrador, audioDraft, editando]);

  function descifrarFila(f)
  {
    const pub = pubs.current[f.remitente_id];
    return {
      id: f.id,
      remitente_id: f.remitente_id,
      autor: nombres.current[f.remitente_id] || null,
      texto: pub ? (descifrar(f.contenido_cifrado, f.nonce, pub, priv.current) ?? "No se pudo descifrar") : "No se pudo descifrar",
      enviado_en: f.enviado_en,
      respuesta_a: f.respuesta_a || null,
      reacciones: f.reacciones || {},
      borrado: !!f.borrado,
      editado: !!f.editado,
      leido_por: f.leido_por || {},
    };
  }

  async function cargarGrupo()
  {
    try
    {
      const g = await api.infoGrupo(id);
      setGrupo(g);
      setMiembros(g.miembros || []);
      for (const m of g.miembros || [])
      {
        pubs.current[m.id] = m.llave_publica;
        nombres.current[m.id] = m.usuario;
      }
      return g;
    }
    catch (e)
    {
      return null;
    }
  }

  useEffect(() =>
  {
    let activo = true;
    (async () =>
    {
      miId.current = await leer(MI_ID);
      priv.current = await leer(CLAVE_PRIVADA);
      leerOcultos(`g-${id}`).then((set) => activo && setOcultos(set));
      leerFijados(`g-${id}`).then(setFijados);
      const cache = await leerCacheChat(`g-${id}`);
      if (cache && activo)
      {
        setMensajes(cache);
      }
      await cargarGrupo();
      try
      {
        const filas = await api.historialGrupo(id);
        if (filas.length < 50)
        {
          hayMas.current = false;
        }
        const desc = filas.map(descifrarFila);
        if (activo && (desc.length > 0 || !cache))
        {
          setMensajes(desc);
          persistir(desc);
        }
        marcarVisto(id);
        reportarLeidos(desc);
      }
      catch (e)
      {
      }
    })();
    return () => { activo = false; };
  }, [id]);

  useEffect(() =>
  {
    const socket = obtenerSocket();
    if (!socket)
    {
      return;
    }
    function alMensaje(data)
    {
      if (data.grupo_id !== id)
      {
        return;
      }
      const nuevo = descifrarFila(data);
      setMensajes((prev) =>
      {
        if (prev.some((m) => m.id === data.id))
        {
          return prev;
        }
        const conNuevo = [...prev, nuevo];
        persistir(conNuevo);
        return conNuevo;
      });
      marcarVisto(id);
      reportarLeidos([nuevo]);
    }
    function alLeido(data)
    {
      if (data.grupo_id !== id)
      {
        return;
      }
      setMensajes((prev) => prev.map((m) =>
      {
        const l = (data.lecturas || []).find((x) => x.id === m.id);
        return l ? { ...m, leido_por: l.leido_por } : m;
      }));
    }
    function alEscribiendo(data)
    {
      if (data.grupo !== id || data.de === miId.current)
      {
        return;
      }
      if (escribiendoTimer.current)
      {
        clearTimeout(escribiendoTimer.current);
      }
      if (data.activo)
      {
        setEscribiendoDe(nombres.current[data.de] || "Alguien");
        escribiendoTimer.current = setTimeout(() => setEscribiendoDe(null), 3000);
      }
      else
      {
        setEscribiendoDe(null);
      }
    }
    function alReaccion(data)
    {
      if (data.grupo_id !== id)
      {
        return;
      }
      setMensajes((prev) => prev.map((m) => (m.id === data.id ? { ...m, reacciones: data.reacciones } : m)));
    }
    function alBorrado(data)
    {
      if (data.grupo_id !== id)
      {
        return;
      }
      setMensajes((prev) => prev.map((m) => (m.id === data.id ? { ...m, borrado: true } : m)));
    }
    function alEditado(data)
    {
      if (data.grupo_id !== id)
      {
        return;
      }
      setMensajes((prev) => prev.map((m) =>
      {
        if (m.id !== data.id)
        {
          return m;
        }
        const clave = pubs.current[m.remitente_id];
        const texto = clave ? (descifrar(data.contenido_cifrado, data.nonce, clave, priv.current) ?? m.texto) : m.texto;
        return { ...m, texto, editado: true };
      }));
    }
    function alActualizado(data)
    {
      if (data.id === id)
      {
        cargarGrupo();
      }
    }
    socket.on("grupo:mensaje", alMensaje);
    socket.on("grupo:reaccion", alReaccion);
    socket.on("grupo:borrado", alBorrado);
    socket.on("grupo:editado", alEditado);
    socket.on("grupo:actualizado", alActualizado);
    socket.on("grupo:leido", alLeido);
    socket.on("grupo:escribiendo", alEscribiendo);
    return () =>
    {
      socket.off("grupo:mensaje", alMensaje);
      socket.off("grupo:reaccion", alReaccion);
      socket.off("grupo:borrado", alBorrado);
      socket.off("grupo:editado", alEditado);
      socket.off("grupo:actualizado", alActualizado);
      socket.off("grupo:leido", alLeido);
      socket.off("grupo:escribiendo", alEscribiendo);
    };
  }, [id]);

  async function cargarMas()
  {
    if (esWeb || cargandoMas.current || !hayMas.current || mensajes.length === 0)
    {
      return;
    }
    cargandoMas.current = true;
    setMasCargando(true);
    try
    {
      const filas = await api.historialGrupo(id, mensajes[0].enviado_en);
      if (filas.length < 50)
      {
        hayMas.current = false;
      }
      if (filas.length > 0)
      {
        const desc = filas.map(descifrarFila);
        setMensajes((prev) => [...desc, ...prev]);
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

  function reportarLeidos(lista)
  {
    const ids = lista
      .filter((m) => m.remitente_id !== miId.current && !String(m.id).startsWith("local-") && !(m.leido_por || {})[miId.current] && !marcados.current.has(m.id))
      .map((m) => m.id);
    if (ids.length === 0)
    {
      return;
    }
    ids.forEach((i) => marcados.current.add(i));
    api.marcarLeidosGrupo(id, ids.slice(0, 200)).catch(() => {});
  }

  function escribir(t)
  {
    setBorrador(t);
    const socket = obtenerSocket();
    if (socket && socket.connected)
    {
      socket.emit("grupo:escribiendo", { grupo: id, activo: true });
      if (tecleando.current)
      {
        clearTimeout(tecleando.current);
      }
      tecleando.current = setTimeout(() => socket.emit("grupo:escribiendo", { grupo: id, activo: false }), 2200);
    }
  }

  async function borrarLocal(mensaje)
  {
    setSel(null);
    const set = await ocultarMensaje(`g-${id}`, mensaje.id);
    setOcultos(new Set(set));
  }

  function cifrarParaTodos(texto)
  {
    return miembros.map((m) =>
    {
      const c = cifrar(texto, m.llave_publica, priv.current);
      return { destinatario_id: m.id, contenido_cifrado: c.contenidoCifrado, nonce: c.nonce };
    });
  }

  const { enviarMedia, reintentarMedia } = useEnvioMedia({
    miId: () => miId.current,
    setMensajes,
    alPersistir: persistir,
    enviarPlano: (plano, clienteId) => api.enviarGrupo(id, clienteId, cifrarParaTodos(plano)),
  });

  async function mandarTexto(texto, clienteId, respuestaA)
  {
    try
    {
      const r = await api.enviarGrupo(id, clienteId, cifrarParaTodos(texto), respuestaA);
      if (r.ok)
      {
        delete pendientesTexto.current[clienteId];
        setMensajes((prev) =>
        {
          const conEnviado = prev.map((x) => (x.id === clienteId ? { ...x, id: r.id, estado: "enviado" } : x));
          persistir(conEnviado);
          return conEnviado;
        });
      }
      else
      {
        setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, estado: "fallido" } : x)));
      }
    }
    catch (e)
    {
      setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, estado: "fallido" } : x)));
    }
  }

  async function enviar()
  {
    const texto = borrador.trim();
    if (!texto || miembros.length === 0)
    {
      return;
    }
    if (editando)
    {
      const objetivo = editando;
      setEditando(null);
      setBorrador("");
      try
      {
        await api.editarMensajeGrupo(id, objetivo.id, cifrarParaTodos(texto));
        setMensajes((prev) =>
        {
          const conEdicion = prev.map((m) => (m.id === objetivo.id ? { ...m, texto, editado: true } : m));
          persistir(conEdicion);
          return conEdicion;
        });
      }
      catch (e)
      {
        Alert.alert("No se pudo editar", "Revisa tu conexión e intenta de nuevo.");
      }
      return;
    }
    setBorrador("");
    const resp = respondiendo;
    setRespondiendo(null);
    const clienteId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    pendientesTexto.current[clienteId] = { texto, respuestaA: resp ? resp.id : null };
    setMensajes((prev) => [...prev, {
      id: clienteId,
      remitente_id: miId.current,
      texto,
      enviado_en: new Date().toISOString(),
      estado: "enviando",
      respuesta_a: resp ? resp.id : null,
      respuestaTexto: resp ? resp.texto : null,
    }]);
    mandarTexto(texto, clienteId, resp ? resp.id : null);
  }

  function reintentar(item)
  {
    if (reintentarMedia(item.id))
    {
      return;
    }
    const pend = pendientesTexto.current[item.id];
    if (!pend)
    {
      return;
    }
    setMensajes((prev) => prev.map((x) => (x.id === item.id ? { ...x, estado: "enviando" } : x)));
    mandarTexto(pend.texto, item.id, pend.respuestaA);
  }

  async function adjuntarDocumento()
  {
    setAdjuntando(false);
    const DocumentPicker = require("expo-document-picker");
    const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (r.canceled || !r.assets?.length)
    {
      return;
    }
    const a = r.assets[0];
    await enviarMedia({ uri: a.uri, tipo: "file", mime: a.mimeType || "application/octet-stream", nombre: a.name, peso: a.size });
  }

  async function adjuntar()
  {
    setAdjuntando(false);
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
    const items = r.assets.map((a) => ({
      uri: a.uri,
      tipo: a.type === "video" ? "video" : "img",
      mime: a.mimeType || (a.type === "video" ? "video/mp4" : "image/jpeg"),
      ancho: a.width,
      alto: a.height,
      dur: a.duration ? Math.round(a.duration / 1000) : undefined,
    }));
    setPrevio(items);
  }

  function enviarSticker(uri)
  {
    setStickers(false);
    enviarMedia({ uri, tipo: "sticker", mime: "image/png" });
  }

  async function iniciarGrabacion()
  {
    if (miembros.length === 0)
    {
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
      durMs.current = 0;
      await grabadora.prepareToRecordAsync();
      grabadora.record();
      setGrabando(true);
      setGrabPausado(false);
    }
    catch (e)
    {
    }
  }

  function alternarPausaGrabacion()
  {
    try
    {
      if (grabPausado)
      {
        grabadora.record();
      }
      else
      {
        grabadora.pause();
      }
      setGrabPausado(!grabPausado);
    }
    catch (e)
    {
    }
  }

  async function terminarGrabacion(mandarAudio)
  {
    if (!grabando)
    {
      return;
    }
    setGrabando(false);
    setGrabPausado(false);
    const ms = durMs.current || (grabadora.currentTime || 0) * 1000;
    try
    {
      await grabadora.stop();
    }
    catch (e)
    {
    }
    if (!mandarAudio)
    {
      return;
    }
    if (ms < 700)
    {
      mostrarAviso("Nota muy corta");
      return;
    }
    try
    {
      if (grabadora.uri)
      {
        const estable = await guardarAudioBorrador(claveBorrador, grabadora.uri);
        setAudioDraft({
          uri: estable,
          t: "audio",
          mime: "audio/mp4",
          dur: Math.max(1, Math.round(ms / 1000)),
          wf: normalizarMuestras(muestras.current) || undefined,
        });
      }
    }
    catch (e)
    {
    }
  }

  function cancelarAudioDraft()
  {
    setAudioDraft(null);
  }

  async function enviarAudioDraft()
  {
    if (!audioDraft || subiendo)
    {
      return;
    }
    setSubiendo(true);
    try
    {
      await enviarMedia({
        uri: audioDraft.uri,
        tipo: "audio",
        mime: audioDraft.mime || "audio/mp4",
        dur: audioDraft.dur,
        wf: audioDraft.wf,
      });
      setAudioDraft(null);
    }
    catch (e)
    {
    }
    finally
    {
      setSubiendo(false);
    }
  }

  function mostrarAviso(texto)
  {
    setAviso(texto);
    setTimeout(() => setAviso(""), 1800);
  }

  async function reaccionar(mensaje, emoji)
  {
    setSel(null);
    setMensajes((prev) => prev.map((m) =>
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
    }));
    api.reaccionarGrupo(id, mensaje.id, emoji).catch(() => {});
  }

  async function copiarMensaje(mensaje)
  {
    setSel(null);
    await Clipboard.setStringAsync(mensaje.texto);
    mostrarAviso("Copiado");
  }

  async function descargarMedia(mensaje)
  {
    setSel(null);
    const media = leerMedia(mensaje.texto);
    if (!media)
    {
      return;
    }
    mostrarAviso("Descargando…");
    const r = await guardarMedia(media);
    mostrarAviso(r.estado === "ok" ? "Guardado en tu galería" : r.estado === "sin_permiso" ? "Sin permiso de galería" : r.estado === "compartido" ? "Guárdalo desde el menú" : `No se pudo guardar${r.detalle ? `: ${r.detalle}` : ""}`);
  }

  async function borrarMensaje(mensaje)
  {
    setSel(null);
    setMensajes((prev) =>
    {
      const conBorrado = prev.map((m) => (m.id === mensaje.id ? { ...m, borrado: true } : m));
      persistir(conBorrado);
      return conBorrado;
    });
    api.borrarMensajeGrupo(id, mensaje.id).catch(() => {});
    if (fijados.some((f) => f.id === mensaje.id))
    {
      quitarFijado(`g-${id}`, mensaje.id).then(setFijados);
    }
  }

  function editarMensaje(mensaje)
  {
    setSel(null);
    setRespondiendo(null);
    setEditando(mensaje);
    setBorrador(mensaje.texto);
  }

  function responder(mensaje)
  {
    setSel(null);
    setEditando(null);
    setRespondiendo(mensaje);
  }

  async function fijar(mensaje)
  {
    setSel(null);
    setFijados(await alternarFijado(`g-${id}`, mensaje));
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
    const pub = await llavePublicaDe(amigo.id);
    const { contenidoCifrado, nonce } = cifrar(objetivo.texto, pub, priv.current);
    socket.emit("mensaje:enviar", { destinatarioId: amigo.id, contenidoCifrado, nonce, respuestaA: null });
    setReenviadoA(amigo.usuario);
    setTimeout(() => setReenviadoA(null), 1600);
  }

  useEffect(() =>
  {
    if (grabando && !grabPausado && estadoGrab)
    {
      if (typeof estadoGrab.metering === "number")
      {
        muestras.current.push(estadoGrab.metering);
      }
      if (estadoGrab.durationMillis)
      {
        durMs.current = estadoGrab.durationMillis;
      }
    }
  }, [estadoGrab, grabando, grabPausado]);

  const visibles = useMemo(() => (ocultos.size ? mensajes.filter((m) => !ocultos.has(m.id)) : mensajes), [mensajes, ocultos]);
  const datos = useMemo(() => (esWeb ? visibles : visibles.slice().reverse()), [visibles]);
  const ultimoFijado = fijados.length > 0 ? fijados[fijados.length - 1] : null;
  const mencion = useMemo(() =>
  {
    const m = borrador.match(/(^|\s)@([\w.-]*)$/);
    return m ? m[2].toLowerCase() : null;
  }, [borrador]);
  const sugerencias = mencion != null
    ? miembros.filter((x) => x.id !== miId.current && x.usuario.toLowerCase().startsWith(mencion)).slice(0, 5)
    : [];

  function insertarMencion(usuario)
  {
    setBorrador((prev) => prev.replace(/@[\w.-]*$/, `@${usuario} `));
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Stack.Screen options={{
        headerTitle: () => (
          <Pressable
            onPress={() => router.push({ pathname: "/grupo/info/[id]", params: { id, nombre: grupo?.nombre || nombre || "" } })}
            style={({ pressed }) => [estilos.encabezado, pressed && { opacity: 0.7 }]}
          >
            <Avatar nombre={grupo?.nombre || nombre || "G"} uri={grupo?.avatar_url || null} tamano={32} />
            <View>
              <Text style={[estilos.encabezadoTxt, { color: colores.texto }]}>{grupo?.nombre || nombre || "Grupo"}</Text>
              {escribiendoDe ? (
                <Text style={[estilos.encabezadoSub, { color: colores.exito || colores.botonFondo }]}>{escribiendoDe} escribe…</Text>
              ) : miembros.length ? (
                <Text style={[estilos.encabezadoSub, { color: colores.muted }]}>{miembros.length} miembros</Text>
              ) : null}
            </View>
          </Pressable>
        ),
      }} />

      {ultimoFijado ? (
        <Pressable
          onLongPress={() => quitarFijado(`g-${id}`, ultimoFijado.id).then(setFijados)}
          delayLongPress={350}
          style={[estilos.fijado, { backgroundColor: colores.surface, borderColor: colores.borde }]}
        >
          <Pin color={colores.muted} tamano={13} />
          <Text numberOfLines={1} style={[estilos.fijadoTxt, { color: colores.muted }]}>{resumenMensaje(ultimoFijado.texto)}</Text>
        </Pressable>
      ) : null}

      <FlatList
        ref={lista}
        data={datos}
        keyExtractor={(m) => m.id}
        windowSize={9}
        maxToRenderPerBatch={8}
        initialNumToRender={14}
        inverted={!esWeb}
        contentContainerStyle={estilos.lista}
        onEndReached={cargarMas}
        onEndReachedThreshold={0.9}
        ListFooterComponent={masCargando ? <ActivityIndicator color={colores.muted} style={estilos.masSpinner} /> : null}
        onContentSizeChange={esWeb ? () => lista.current?.scrollToEnd({ animated: false }) : undefined}
        renderItem={({ item, index }) =>
        {
          const mio = item.remitente_id === miId.current;
          const media = leerMedia(item.texto);
          const prev = esWeb ? datos[index - 1] : datos[index + 1];
          const nuevoDia = !prev || !mismoDia(prev.enviado_en, item.enviado_en);
          const citadoCrudo = item.respuestaTexto
            ?? (item.respuesta_a ? (mensajes.find((m) => m.id === item.respuesta_a)?.texto ?? "Mensaje") : null);
          const citadoMedia = citadoCrudo ? leerMedia(citadoCrudo) : null;
          const cita = citadoMedia ? resumenMensaje(citadoCrudo) : citadoCrudo;
          const lecturas = Object.keys(item.leido_por || {}).length;
          const todos = miembros.length > 1 && lecturas >= miembros.length - 1;
          const pie = (
            <>
              {item.editado ? <Text style={[estilos.pieTxt, { color: media ? "#FFF" : mio ? colores.botonTexto : colores.muted }]}>editado</Text> : null}
              <Text style={[estilos.pieTxt, { color: media ? "#FFF" : mio ? colores.botonTexto : colores.muted }]}>
                {item.estado === "fallido" ? "no enviado · toca para reintentar" : item.estado === "enviando" ? "enviando…" : hora(item.enviado_en)}
              </Text>
              {mio && item.estado !== "fallido" && item.estado !== "enviando" ? (
                <Visto
                  color={media ? "#FFF" : todos ? colores.botonTexto : "#8E8E93"}
                  dos={lecturas > 0}
                  tamano={11}
                />
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
                autor={!mio ? (item.autor || nombres.current[item.remitente_id] || "…") : null}
                cita={cita}
                citaMini={miniaturaDe(citadoMedia)}
                borrado={item.borrado}
                media={item.borrado ? null : media}
                texto={item.texto}
                meta={item.borrado ? null : pie}
                reacciones={item.reacciones}
                onMenu={(coords) => setSel({ mensaje: item, ...coords })}
                onPress={item.estado === "fallido" ? () => reintentar(item) : undefined}
                onResponder={item.borrado ? undefined : () => responder(item)}
                resaltada={sel && sel.mensaje.id === item.id}
                aparecer={!esWeb && Date.now() - aFecha(item.enviado_en).getTime() < 2500}
                conMenciones
              />
            </View>
          );
        }}
      />

      <BarraEntrada
        valor={borrador}
        onCambiar={escribir}
        onEnviar={enviar}
        onAdjuntar={() => setAdjuntando(true)}
        onSticker={() => setStickers(true)}
        audioDraft={audioDraft}
        onCancelarAudioDraft={cancelarAudioDraft}
        onEnviarAudioDraft={enviarAudioDraft}
        grabando={grabando}
        grabPausado={grabPausado}
        onPausarGrabacion={alternarPausaGrabacion}
        tiempoGrabacion={Math.floor((estadoGrab?.durationMillis || 0) / 1000)}
        onIniciarGrabacion={iniciarGrabacion}
        onCancelarGrabacion={() => terminarGrabacion(false)}
        onEnviarGrabacion={() => terminarGrabacion(true)}
        subiendo={subiendo}
      >
        {sugerencias.length > 0 ? (
          <View style={[estilos.sugerencias, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            {sugerencias.map((m) => (
              <Pressable key={m.id} onPress={() => insertarMencion(m.usuario)} style={({ pressed }) => [estilos.sugerencia, pressed && { opacity: 0.6 }]}>
                <Avatar nombre={m.usuario} uri={m.avatar_url || null} tamano={24} />
                <Text style={[estilos.sugerenciaTxt, { color: colores.texto }]}>@{m.usuario}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {respondiendo ? (
          <View style={[estilos.aviso, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            {miniaturaDe(leerMedia(respondiendo.texto)) ? (
              <ImagenExpo source={{ uri: miniaturaDe(leerMedia(respondiendo.texto)) }} contentFit="cover" style={estilos.avisoMini} />
            ) : null}
            <Text numberOfLines={1} style={[estilos.avisoTxt, { color: colores.muted }]}>Respondiendo: {resumenMensaje(respondiendo.texto)}</Text>
            <Pressable onPress={() => setRespondiendo(null)} hitSlop={8}>
              <Text style={{ color: colores.muted, fontSize: 16 }}>{"✕"}</Text>
            </Pressable>
          </View>
        ) : null}
        {editando ? (
          <View style={[estilos.aviso, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text style={[estilos.avisoTxt, { color: colores.muted }]}>Editando mensaje</Text>
            <Pressable onPress={() => { setEditando(null); setBorrador(""); }} hitSlop={8}>
              <Text style={{ color: colores.muted, fontSize: 16 }}>{"✕"}</Text>
            </Pressable>
          </View>
        ) : null}
      </BarraEntrada>

      <AccionesMensaje
        sel={sel}
        esMio={sel ? sel.mensaje.remitente_id === miId.current : false}
        esMedia={sel ? !!leerMedia(sel.mensaje.texto) : false}
        fijado={sel ? fijados.some((f) => f.id === sel.mensaje.id) : false}
        onReaccionar={reaccionar}
        onResponder={responder}
        onReenviar={(m) => { setSel(null); setReenviando(m); }}
        onFijar={fijar}
        onCopiar={copiarMensaje}
        onDescargar={descargarMedia}
        onEditar={editarMensaje}
        onBorrar={borrarMensaje}
        onBorrarLocal={borrarLocal}
        onInfo={(m) => { setSel(null); setInfoDe(m); }}
        onCerrar={() => setSel(null)}
      />

      <SelectorContacto
        visible={!!reenviando}
        titulo="Reenviar a"
        onElegir={hacerReenvio}
        onCerrar={() => setReenviando(null)}
      />

      <SelectorSticker visible={stickers} onElegir={enviarSticker} onCerrar={() => setStickers(false)} />

      <Modal transparent visible={adjuntando} animationType="fade" onRequestClose={() => setAdjuntando(false)}>
        <Pressable style={estilos.adjFondo} onPress={() => setAdjuntando(false)}>
          <Pressable>
          <Vidrio tinte={oscuro ? "dark" : "light"} style={[estilos.adjHoja, { backgroundColor: `${colores.surface}E0`, borderColor: colores.borde }]}>
            <Pressable onPress={adjuntar} style={({ pressed }) => [estilos.adjItem, pressed && { opacity: 0.7 }]}>
              <Clip color={colores.texto} tamano={20} />
              <Text style={[estilos.adjTxt, { color: colores.texto }]}>Fotos y videos</Text>
            </Pressable>
            <Pressable onPress={adjuntarDocumento} style={({ pressed }) => [estilos.adjItem, pressed && { opacity: 0.7 }]}>
              <Documento color={colores.texto} tamano={20} />
              <Text style={[estilos.adjTxt, { color: colores.texto }]}>Documento</Text>
            </Pressable>
          </Vidrio>
          </Pressable>
        </Pressable>
      </Modal>

      <PrevioMedia
        visible={!!previo}
        items={previo}
        onCancelar={() => setPrevio(null)}
        onEnviar={(lista) =>
        {
          setPrevio(null);
          (async () =>
          {
            for (const item of lista)
            {
              await enviarMedia(item);
            }
          })();
        }}
      />

      <Modal transparent visible={!!infoDe} animationType="fade" onRequestClose={() => setInfoDe(null)}>
        <Pressable style={estilos.infoFondo} onPress={() => setInfoDe(null)}>
          <Pressable style={[estilos.infoHoja, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text style={[estilos.infoTitulo, { color: colores.texto }]}>
              Visto por {Object.keys(infoDe?.leido_por || {}).length} de {Math.max(0, miembros.length - 1)}
            </Text>
            {miembros
              .filter((m) => m.id !== miId.current && (infoDe?.leido_por || {})[m.id])
              .sort((a, b) => String(infoDe.leido_por[a.id]).localeCompare(String(infoDe.leido_por[b.id])))
              .map((m) => (
                <View key={m.id} style={estilos.infoFila}>
                  <Avatar nombre={m.usuario} uri={m.avatar_url || null} tamano={30} />
                  <Text style={[estilos.infoNombre, { color: colores.texto }]}>{m.usuario}</Text>
                  <Text style={[estilos.infoHora, { color: colores.texto }]}>{hora(infoDe.leido_por[m.id])}</Text>
                </View>
              ))}
            {Object.keys(infoDe?.leido_por || {}).length === 0 ? (
              <Text style={[estilos.infoHora, { color: colores.muted }]}>Nadie lo ha visto todavía.</Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {reenviadoA ? (
        <View style={estilos.toast} pointerEvents="none">
          <Text style={estilos.toastTxt}>Reenviado a {reenviadoA}</Text>
        </View>
      ) : null}

      {aviso ? (
        <View style={estilos.toast} pointerEvents="none">
          <Text style={estilos.toastTxt}>{aviso}</Text>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { padding: 14, gap: 8 },
  masSpinner: { paddingVertical: 12 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10 },
  encabezadoTxt: { fontSize: 16, fontFamily: fuentes.semibold },
  encabezadoSub: { fontSize: 11 },
  dia: { alignItems: "center", marginVertical: 6 },
  diaTxt: { fontSize: 11, fontFamily: fuentes.media, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, overflow: "hidden" },
  fijado: { flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  fijadoTxt: { flex: 1, fontSize: 13 },
  pieTxt: { fontSize: 10 },
  aviso: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, marginHorizontal: 12, marginBottom: 6, paddingHorizontal: 12, paddingVertical: 8 },
  avisoMini: { width: 32, height: 32, borderRadius: 6 },
  avisoTxt: { flex: 1, fontSize: 13 },
  toast: { position: "absolute", bottom: 96, alignSelf: "center", backgroundColor: "rgba(20,20,24,0.92)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  toastTxt: { color: "#FFF", fontSize: 13 },
  adjFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  adjHoja: { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, paddingVertical: 10, paddingBottom: 26, overflow: "hidden" },
  adjItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 24, paddingVertical: 14 },
  adjTxt: { fontSize: 16, fontFamily: fuentes.media },
  sugerencias: { borderWidth: 1, borderRadius: 12, marginHorizontal: 12, marginBottom: 6, paddingVertical: 4 },
  sugerencia: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  sugerenciaTxt: { fontSize: 14, fontFamily: fuentes.media },
  infoFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  infoHoja: { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, padding: 18, paddingBottom: 30, gap: 4 },
  infoTitulo: { fontSize: 16, fontFamily: fuentes.semibold, marginBottom: 8 },
  infoFila: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  infoNombre: { flex: 1, fontSize: 14, fontFamily: fuentes.media },
  infoHora: { fontSize: 12.5 },
});
