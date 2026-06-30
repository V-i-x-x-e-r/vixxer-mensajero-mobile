import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, Image, Modal, Platform, Alert, Keyboard, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import * as api from "../../lib/api";
import { obtenerSocket, asegurarSocket } from "../../lib/socket";
import { cifrar, descifrar, cifrarArchivo } from "../../lib/crypto";
import { leerBase64 } from "../../lib/archivos";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { leerCacheChat, guardarCacheChat } from "../../lib/chatCache";
import { leerOutbox, agregarOutbox, quitarOutbox } from "../../lib/outbox";
import { ChatEsqueleto } from "../../components/Esqueleto";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Candado } from "../../components/Candado";
import { Visto } from "../../components/Visto";
import { Avatar } from "../../components/Avatar";
import { Reloj } from "../../components/Reloj";
import { Flecha } from "../../components/Flecha";
import { Check } from "../../components/Check";
import { Clip } from "../../components/Clip";
import { Microfono } from "../../components/Microfono";
import { Adjunto } from "../../components/Adjunto";
import { AccionesMensaje } from "../../components/AccionesMensaje";
import { SelectorContacto } from "../../components/SelectorContacto";
import { Reenviar } from "../../components/Reenviar";
import { Bote } from "../../components/Bote";
import { Lupa } from "../../components/Lupa";

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
    return obj && (obj.t === "img" || obj.t === "video" || obj.t === "audio") ? obj : null;
  }
  catch (e)
  {
    return null;
  }
}

function aFecha(iso)
{
  return iso ? new Date(iso) : new Date();
}

function mismoDia(a, b)
{
  return aFecha(a).toDateString() === aFecha(b).toDateString();
}

function etiquetaDia(iso)
{
  const f = aFecha(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (f.toDateString() === hoy.toDateString())
  {
    return "Hoy";
  }
  if (f.toDateString() === ayer.toDateString())
  {
    return "Ayer";
  }
  return f.toLocaleDateString();
}

function hora(iso)
{
  const f = aFecha(iso);
  return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
}

function agrupar(reacciones)
{
  const conteo = {};
  const lista = Array.isArray(reacciones) ? reacciones : Object.values(reacciones || {});
  for (const e of lista)
  {
    conteo[e] = (conteo[e] || 0) + 1;
  }
  return Object.entries(conteo);
}

function BurbujaMedible({ style, onSeleccionar, onPress, children })
{
  const ref = useRef(null);

  function alMantener()
  {
    ref.current?.measureInWindow((x, y, w, h) => onSeleccionar?.({ x, y, w, h }));
  }

  return (
    <Pressable ref={ref} onLongPress={alMantener} onPress={onPress} delayLongPress={250} style={style}>
      {children}
    </Pressable>
  );
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
  const [sel, setSel] = useState(null);
  const [respondiendo, setRespondiendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [previo, setPrevio] = useState(null);
  const [reenviando, setReenviando] = useState(null);
  const [reenviandoMulti, setReenviandoMulti] = useState(false);
  const [reenviadoA, setReenviadoA] = useState(null);
  const [seleccionando, setSeleccionando] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [tecladoAlto, setTecladoAlto] = useState(0);
  const [hayMas, setHayMas] = useState(true);
  const [masCargando, setMasCargando] = useState(false);
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const miId = useRef(null);
  const lista = useRef(null);
  const tecleando = useRef(null);
  const cargandoMas = useRef(false);

  const invertidos = useMemo(() =>
  {
    const base = buscando && consulta.trim()
      ? mensajes.filter((m) => !leerMedia(m.texto) && m.texto.toLowerCase().includes(consulta.trim().toLowerCase()))
      : mensajes;
    return base.slice().reverse();
  }, [mensajes, buscando, consulta]);

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
  }, [otroId]);

  useEffect(() =>
  {
    const abrir = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const cerrar = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const subir = Keyboard.addListener(abrir, (e) => setTecladoAlto(e.endCoordinates.height));
    const bajar = Keyboard.addListener(cerrar, () => setTecladoAlto(0));
    return () =>
    {
      subir.remove();
      bajar.remove();
    };
  }, []);

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
          setMensajes((prev) => [...prev, { ...fila, texto: t }]);
          marcarLeidos([fila]);
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
        setMensajes((prev) => prev.filter((m) => m.id !== data.id));
      }
    }

    (async () =>
    {
      miId.current = await leer(MI_ID);

      const cache = await leerCacheChat(otroId);
      if (cache && activo)
      {
        setMensajes(cache);
      }

      try
      {
        const filas = await api.historial(otroId);
        const descifrados = await descifrarLote(filas);
        if (activo)
        {
          setMensajes(descifrados);
          setHayMas(filas.length >= 50);
          marcarLeidos(descifrados);
          guardarCacheChat(otroId, descifrados);
        }
      }
      catch (e)
      {
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

  function intentarEnviar(item)
  {
    const socket = obtenerSocket();
    if (!socket || !socket.connected)
    {
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
      { destinatarioId: otroId, contenidoCifrado: item.contenidoCifrado, nonce: item.nonce, respuestaA: item.respuestaA },
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
    const items = await leerOutbox(otroId);
    const item = items.find((i) => i.localId === mensaje.id);
    if (!item)
    {
      return;
    }
    setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, estado: "enviando" } : m)));
    intentarEnviar(item);
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
    await mandar(limpio);
  }

  function aMedia(asset)
  {
    return {
      uri: asset.uri,
      esVideo: asset.type === "video",
      mime: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
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

  async function enviarArchivo(actual)
  {
    const base64 = await leerBase64(actual.uri);
    const cif = cifrarArchivo(base64);
    const { path } = await api.subirMedia(cif.datos);
    await mandar(JSON.stringify({
      t: actual.esVideo ? "video" : "img",
      path,
      mime: actual.mime,
      k: cif.clave,
      n: cif.nonce,
    }));
  }

  async function enviarVarios(archivos)
  {
    setSubiendo(true);
    try
    {
      for (const actual of archivos)
      {
        await enviarArchivo(actual);
      }
    }
    catch (e)
    {
      Alert.alert("No se pudieron enviar todos los archivos", "Revisa tu conexión e intenta de nuevo.");
    }
    finally
    {
      setSubiendo(false);
    }
  }

  async function confirmarEnvio()
  {
    if (!previo)
    {
      return;
    }
    const actual = previo;
    setPrevio(null);
    setSubiendo(true);
    try
    {
      await enviarArchivo(actual);
    }
    catch (e)
    {
      Alert.alert("No se pudo enviar el archivo", "Revisa tu conexión e intenta de nuevo.");
    }
    finally
    {
      setSubiendo(false);
    }
  }

  async function grabarToggle()
  {
    if (grabando)
    {
      setGrabando(false);
      setSubiendo(true);
      try
      {
        await grabadora.stop();
        const uri = grabadora.uri;
        if (uri)
        {
          const base64 = await leerBase64(uri);
          const cif = cifrarArchivo(base64);
          const { path } = await api.subirMedia(cif.datos);
          await mandar(JSON.stringify({ t: "audio", path, mime: "audio/mp4", k: cif.clave, n: cif.nonce }));
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
    setMensajes((prev) => prev.filter((m) => m.id !== mensaje.id));
    setSel(null);
  }

  async function copiar(mensaje)
  {
    await Clipboard.setStringAsync(mensaje.texto);
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

  function alDesplazar(e)
  {
    setLejos(e.nativeEvent.contentOffset.y > 240);
  }

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
              <Avatar nombre={usuario || ""} uri={avatar || null} tamano={32} />
              <View>
                <Text style={[estilos.encabezadoTxt, { color: colores.texto }]}>{usuario || "Conversación"}</Text>
                {sub ? <Text style={[estilos.encabezadoSub, { color: colores.muted }]}>{sub}</Text> : null}
              </View>
            </Pressable>
          ),
          headerRight: () => (
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
          ),
        }}
      />

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

      <FlatList
        ref={lista}
        data={invertidos}
        keyExtractor={(m) => m.id}
        inverted
        style={estilos.flex}
        contentContainerStyle={estilos.lista}
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        onEndReached={cargarMas}
        onEndReachedThreshold={0.3}
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
          const prev = invertidos[index + 1];
          const nuevoDia = !prev || !mismoDia(prev.enviado_en, item.enviado_en);
          const reacciones = agrupar(item.reacciones);
          const media = leerMedia(item.texto);
          const citadoCrudo = item.respuestaTexto
            ?? (item.respuesta_a ? (mensajes.find((m) => m.id === item.respuesta_a)?.texto ?? "Mensaje") : null);
          const citado = citadoCrudo && leerMedia(citadoCrudo) ? "Foto" : citadoCrudo;

          const elegido = seleccionados.includes(item.id);
          const mediaVisual = media && (media.t === "img" || media.t === "video");
          const mediaSolo = mediaVisual && !citado;

          return (
            <View style={elegido ? { backgroundColor: colores.surface } : null}>
              {nuevoDia ? (
                <View style={estilos.dia}>
                  <Text style={[estilos.diaTxt, { color: colores.muted, backgroundColor: colores.surface, borderColor: colores.borde }]}>
                    {etiquetaDia(item.enviado_en)}
                  </Text>
                </View>
              ) : null}

              <BurbujaMedible
                onSeleccionar={seleccionando ? undefined : (coords) => setSel({ mensaje: item, ...coords })}
                onPress={seleccionando ? () => alternarSeleccion(item) : undefined}
                style={[
                  estilos.burbuja,
                  mediaSolo
                    ? { alignSelf: mio ? "flex-end" : "flex-start", paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }
                    : mio
                      ? { alignSelf: "flex-end", backgroundColor: colores.botonFondo }
                      : { alignSelf: "flex-start", backgroundColor: colores.surface, borderWidth: 1, borderColor: colores.borde },
                ]}
              >
                {citado ? (
                  <View style={[estilos.cita, { borderColor: mio ? colores.botonTexto : colores.borde }]}>
                    <Text numberOfLines={1} style={{ color: mio ? colores.botonTexto : colores.muted, fontSize: 13, opacity: 0.8 }}>
                      {citado}
                    </Text>
                  </View>
                ) : null}

                {media ? (
                  <Adjunto
                    media={media}
                    color={mio ? colores.botonTexto : colores.texto}
                    seleccionando={seleccionando}
                    onToggle={() => alternarSeleccion(item)}
                    onMenu={seleccionando ? undefined : (coords) => setSel({ mensaje: item, ...coords })}
                  />
                ) : (
                  <Text style={{ color: mio ? colores.botonTexto : colores.texto, fontSize: 15 }}>{item.texto}</Text>
                )}

                {mediaSolo ? (
                  <View style={estilos.metaMedia} pointerEvents="box-none">
                    <Text style={estilos.horaMedia}>{hora(item.enviado_en)}</Text>
                    {mio ? (
                      item.estado === "fallido"
                        ? <Pressable onPress={() => reintentar(item)} hitSlop={8}><Text style={[estilos.reintentarTxt, { color: colores.error }]}>reintentar</Text></Pressable>
                        : item.estado === "enviando"
                          ? <Reloj color="#FFF" tamano={11} />
                          : <Visto color="#FFF" dos={!!item.entregado_en || !!item.leido_en} tamano={11} />
                    ) : null}
                  </View>
                ) : (
                  <View style={estilos.meta}>
                    {item.editado ? (
                      <Text style={[estilos.editado, { color: mio ? colores.botonTexto : colores.muted }]}>editado</Text>
                    ) : null}
                    <Text style={[estilos.hora, { color: mio ? colores.botonTexto : colores.muted }]}>{hora(item.enviado_en)}</Text>
                    {mio ? (
                      item.estado === "fallido"
                        ? (
                            <Pressable onPress={() => reintentar(item)} hitSlop={8} style={estilos.reintentar}>
                              <Text style={[estilos.reintentarTxt, { color: colores.error }]}>no enviado · reintentar</Text>
                            </Pressable>
                          )
                        : item.estado === "enviando"
                          ? <Reloj color={GRIS_VISTO} tamano={11} />
                          : <Visto color={item.leido_en ? colores.botonTexto : GRIS_VISTO} dos={!!item.entregado_en || !!item.leido_en} tamano={11} />
                    ) : null}
                  </View>
                )}
              </BurbujaMedible>

              {reacciones.length > 0 ? (
                <View style={[estilos.reaccionesFila, mio ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
                  {reacciones.map(([emoji, n]) => (
                    <View key={emoji} style={[estilos.chip, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
                      <Text style={estilos.chipTxt}>{emoji}{n > 1 ? ` ${n}` : ""}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {mio && index === 0 && item.leido_en ? (
                <Text style={[estilos.visto, { color: colores.muted }]}>Visto {hora(item.leido_en)}</Text>
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

      {!seleccionando && respondiendo ? (
        <View style={[estilos.aviso, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
          <Text numberOfLines={1} style={[estilos.avisoTxt, { color: colores.muted }]}>
            Respondiendo: {respondiendo.texto}
          </Text>
          <Pressable onPress={() => setRespondiendo(null)} hitSlop={8}>
            <Text style={{ color: colores.muted, fontSize: 16 }}>{"✕"}</Text>
          </Pressable>
        </View>
      ) : null}

      {!seleccionando && editando ? (
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

      {!seleccionando ? (
      <View style={[estilos.inputFila, { borderTopColor: colores.borde, marginBottom: tecladoAlto, paddingBottom: 12 + (tecladoAlto > 0 ? 0 : insets.bottom) }]}>
        {!esWeb ? (
          <Pressable
            onPress={adjuntar}
            disabled={subiendo || grabando}
            hitSlop={6}
            style={({ pressed }) => [estilos.clip, { opacity: subiendo || grabando ? 0.4 : 1 }, pressed && estilos.enviarPresionado]}
          >
            <Clip color={colores.muted} tamano={20} />
          </Pressable>
        ) : null}
        <TextInput
          value={texto}
          onChangeText={escribir}
          placeholder={grabando ? "Grabando…" : "Mensaje"}
          placeholderTextColor={grabando ? colores.error : colores.placeholder}
          editable={!grabando}
          multiline
          style={[estilos.campo, { backgroundColor: colores.surface, borderColor: colores.borde, color: colores.texto }]}
        />
        {texto.trim() || editando || esWeb ? (
          <Pressable
            onPress={enviar}
            disabled={esWeb && !texto.trim() && !editando}
            style={({ pressed }) => [estilos.enviar, { backgroundColor: colores.botonFondo, opacity: esWeb && !texto.trim() && !editando ? 0.4 : 1 }, pressed && estilos.enviarPresionado]}
          >
            {editando ? <Check color={colores.botonTexto} tamano={18} /> : <Flecha color={colores.botonTexto} tamano={18} />}
          </Pressable>
        ) : (
          <Pressable
            onPress={grabarToggle}
            disabled={subiendo}
            style={({ pressed }) => [estilos.enviar, { backgroundColor: grabando ? colores.error : colores.botonFondo }, pressed && estilos.enviarPresionado]}
          >
            <Microfono color={colores.botonTexto} tamano={18} />
          </Pressable>
        )}
      </View>
      ) : null}

      <AccionesMensaje
        sel={sel}
        esMio={sel ? sel.mensaje.remitente_id === miId.current : false}
        esMedia={sel ? !!leerMedia(sel.mensaje.texto) : false}
        onReaccionar={reaccionar}
        onResponder={responder}
        onReenviar={abrirReenvio}
        onSeleccionar={iniciarSeleccion}
        onCopiar={copiar}
        onEditar={editar}
        onBorrar={borrar}
        onCerrar={() => setSel(null)}
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

      <Modal visible={!!previo} transparent animationType="fade" onRequestClose={() => setPrevio(null)}>
        <View style={estilos.previoFondo}>
          <View style={[estilos.previoTarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            {previo ? (
              previo.esVideo ? (
                <View style={estilos.previoVideo}>
                  <Text style={{ color: colores.muted }}>Video listo para enviar</Text>
                </View>
              ) : (
                <Image source={{ uri: previo.uri }} style={estilos.previoImagen} resizeMode="cover" />
              )
            ) : null}
            <View style={estilos.previoAcciones}>
              <Pressable onPress={() => setPrevio(null)} style={({ pressed }) => [estilos.previoBoton, { borderColor: colores.borde }, pressed && estilos.enviarPresionado]}>
                <Text style={{ color: colores.texto, fontFamily: fuentes.semibold }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={confirmarEnvio} style={({ pressed }) => [estilos.previoBoton, { backgroundColor: colores.botonFondo, borderColor: colores.botonFondo }, pressed && estilos.enviarPresionado]}>
                <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold }}>Enviar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  flex: { flex: 1 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  burbuja: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  cita: { borderLeftWidth: 2, paddingLeft: 8, marginBottom: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginTop: 3 },
  metaMedia: { position: "absolute", bottom: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  horaMedia: { fontSize: 10, color: "#FFF" },
  editado: { fontSize: 10, opacity: 0.7, fontStyle: "italic" },
  hora: { fontSize: 10, opacity: 0.7 },
  reintentar: { marginLeft: 2 },
  reintentarTxt: { fontSize: 10, fontFamily: fuentes.media },
  pill: { position: "absolute", bottom: 90, left: 0, right: 0, alignItems: "center" },
  pillTxt: { fontSize: 13, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  buscar: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 42, marginHorizontal: 12, marginTop: 8 },
  buscarCampo: { flex: 1, fontSize: 15, paddingVertical: 0 },
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
  previoVideo: { width: "100%", height: 160, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  previoAcciones: { flexDirection: "row", gap: 10 },
  previoBoton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
});
