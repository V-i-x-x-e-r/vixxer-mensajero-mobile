import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, FlatList, Platform, Alert, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import * as api from "../../lib/api";
import { cifrar, descifrar, cifrarArchivo } from "../../lib/crypto";
import { leerBase64 } from "../../lib/archivos";
import { llavePublicaDe } from "../../lib/llaves";
import { leerCacheChat, guardarCacheChat } from "../../lib/chatCache";
import { marcarVisto } from "../../lib/grupoVisto";
import { leerFijados, alternarFijado, quitarFijado } from "../../lib/mensajeFijado";
import { guardarMedia } from "../../lib/descargas";
import { hora, mismoDia, etiquetaDia } from "../../lib/fechas";
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

export default function GrupoChat()
{
  const { colores } = useTema();
  const { id, nombre } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
  const [borrador, setBorrador] = useState("");
  const [miembros, setMiembros] = useState([]);
  const [grupo, setGrupo] = useState(null);
  const [grabando, setGrabando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [stickers, setStickers] = useState(false);
  const [sel, setSel] = useState(null);
  const [respondiendo, setRespondiendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [reenviando, setReenviando] = useState(null);
  const [reenviadoA, setReenviadoA] = useState(null);
  const [fijados, setFijados] = useState([]);
  const [aviso, setAviso] = useState("");
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const miId = useRef(null);
  const priv = useRef(null);
  const pubs = useRef({});
  const nombres = useRef({});
  const pendientesTexto = useRef({});
  const hayMas = useRef(true);
  const cargandoMas = useRef(false);
  const lista = useRef(null);
  const esWeb = Platform.OS === "web";

  function persistir(items)
  {
    guardarCacheChat(`g-${id}`, items);
  }

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
    return () =>
    {
      socket.off("grupo:mensaje", alMensaje);
      socket.off("grupo:reaccion", alReaccion);
      socket.off("grupo:borrado", alBorrado);
      socket.off("grupo:editado", alEditado);
      socket.off("grupo:actualizado", alActualizado);
    };
  }, [id]);

  async function cargarMas()
  {
    if (esWeb || cargandoMas.current || !hayMas.current || mensajes.length === 0)
    {
      return;
    }
    cargandoMas.current = true;
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
    cargandoMas.current = false;
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
    for (const a of r.assets)
    {
      await enviarMedia({ uri: a.uri, tipo: a.type === "video" ? "video" : "img", mime: a.mimeType || (a.type === "video" ? "video/mp4" : "image/jpeg") });
    }
  }

  function enviarSticker(uri)
  {
    setStickers(false);
    enviarMedia({ uri, tipo: "sticker", mime: "image/png" });
  }

  async function grabarToggle()
  {
    if (miembros.length === 0)
    {
      return;
    }
    if (grabando)
    {
      setGrabando(false);
      setSubiendo(true);
      try
      {
        await grabadora.stop();
        if (grabadora.uri)
        {
          await enviarMedia({ uri: grabadora.uri, tipo: "audio", mime: "audio/mp4" });
        }
      }
      catch (e)
      {
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
    mostrarAviso(r === "ok" ? "Guardado en tu galería" : r === "sin_permiso" ? "Sin permiso de galería" : "No se pudo descargar");
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

  const datos = esWeb ? mensajes : mensajes.slice().reverse();
  const ultimoFijado = fijados.length > 0 ? fijados[fijados.length - 1] : null;

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
              {miembros.length ? <Text style={[estilos.encabezadoSub, { color: colores.muted }]}>{miembros.length} miembros</Text> : null}
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
          <Text numberOfLines={1} style={[estilos.fijadoTxt, { color: colores.muted }]}>{ultimoFijado.texto}</Text>
        </Pressable>
      ) : null}

      <FlatList
        ref={lista}
        data={datos}
        keyExtractor={(m) => m.id}
        inverted={!esWeb}
        contentContainerStyle={estilos.lista}
        onEndReached={cargarMas}
        onEndReachedThreshold={0.4}
        onContentSizeChange={esWeb ? () => lista.current?.scrollToEnd({ animated: false }) : undefined}
        renderItem={({ item, index }) =>
        {
          const mio = item.remitente_id === miId.current;
          const media = leerMedia(item.texto);
          const prev = esWeb ? datos[index - 1] : datos[index + 1];
          const nuevoDia = !prev || !mismoDia(prev.enviado_en, item.enviado_en);
          const citadoCrudo = item.respuestaTexto
            ?? (item.respuesta_a ? (mensajes.find((m) => m.id === item.respuesta_a)?.texto ?? "Mensaje") : null);
          const cita = citadoCrudo && leerMedia(citadoCrudo) ? "Multimedia" : citadoCrudo;
          const pie = (
            <>
              {item.editado ? <Text style={[estilos.pieTxt, { color: media ? "#FFF" : mio ? colores.botonTexto : colores.muted }]}>editado</Text> : null}
              <Text style={[estilos.pieTxt, { color: media ? "#FFF" : mio ? colores.botonTexto : colores.muted }]}>
                {item.estado === "fallido" ? "no enviado · toca para reintentar" : item.estado === "enviando" ? "enviando…" : hora(item.enviado_en)}
              </Text>
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
                borrado={item.borrado}
                media={item.borrado ? null : media}
                texto={item.texto}
                meta={item.borrado ? null : pie}
                reacciones={item.reacciones}
                onMenu={(coords) => setSel({ mensaje: item, ...coords })}
                onPress={item.estado === "fallido" ? () => reintentar(item) : undefined}
                resaltada={sel && sel.mensaje.id === item.id}
              />
            </View>
          );
        }}
      />

      <BarraEntrada
        valor={borrador}
        onCambiar={setBorrador}
        onEnviar={enviar}
        onAdjuntar={adjuntar}
        onSticker={() => setStickers(true)}
        onMic={grabarToggle}
        grabando={grabando}
        subiendo={subiendo}
      >
        {respondiendo ? (
          <View style={[estilos.aviso, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text numberOfLines={1} style={[estilos.avisoTxt, { color: colores.muted }]}>Respondiendo: {respondiendo.texto}</Text>
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
        onCerrar={() => setSel(null)}
      />

      <SelectorContacto
        visible={!!reenviando}
        titulo="Reenviar a"
        onElegir={hacerReenvio}
        onCerrar={() => setReenviando(null)}
      />

      <SelectorSticker visible={stickers} onElegir={enviarSticker} onCerrar={() => setStickers(false)} />

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
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10 },
  encabezadoTxt: { fontSize: 16, fontFamily: fuentes.semibold },
  encabezadoSub: { fontSize: 11 },
  dia: { alignItems: "center", marginVertical: 6 },
  diaTxt: { fontSize: 11, fontFamily: fuentes.media, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, overflow: "hidden" },
  fijado: { flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  fijadoTxt: { flex: 1, fontSize: 13 },
  pieTxt: { fontSize: 10 },
  aviso: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, marginHorizontal: 12, marginBottom: 6, paddingHorizontal: 12, paddingVertical: 8 },
  avisoTxt: { flex: 1, fontSize: 13 },
  toast: { position: "absolute", bottom: 96, alignSelf: "center", backgroundColor: "rgba(20,20,24,0.92)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  toastTxt: { color: "#FFF", fontSize: 13 },
});
