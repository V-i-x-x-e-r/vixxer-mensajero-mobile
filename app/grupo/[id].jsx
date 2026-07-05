import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, FlatList, Modal, Platform, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import * as api from "../../lib/api";
import { cifrar, descifrar, cifrarArchivo } from "../../lib/crypto";
import { leerBase64 } from "../../lib/archivos";
import { guardarCache } from "../../lib/mediaCache";
import { leerCacheChat, guardarCacheChat } from "../../lib/chatCache";
import { marcarVisto } from "../../lib/grupoVisto";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { obtenerSocket } from "../../lib/socket";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Adjunto } from "../../components/Adjunto";
import { Clip } from "../../components/Clip";
import { Flecha } from "../../components/Flecha";
import { Microfono } from "../../components/Microfono";
import { Carita } from "../../components/Carita";
import { SelectorSticker } from "../../components/SelectorSticker";
import { useTeclado } from "../../components/useTeclado";
import { guardarMedia } from "../../lib/descargas";

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

function hora(iso)
{
  const f = new Date(iso);
  return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
}

export default function GrupoChat()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const { id, nombre } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
  const [borrador, setBorrador] = useState("");
  const [miembros, setMiembros] = useState([]);
  const [titulo, setTitulo] = useState(nombre || "Grupo");
  const [grabando, setGrabando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [stickers, setStickers] = useState(false);
  const [menu, setMenu] = useState(null);
  const [aviso, setAviso] = useState("");
  const tecladoAlto = useTeclado();
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const miId = useRef(null);
  const priv = useRef(null);
  const pubs = useRef({});
  const nombres = useRef({});
  const pendientes = useRef({});
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
    };
  }

  useEffect(() =>
  {
    let activo = true;
    (async () =>
    {
      miId.current = await leer(MI_ID);
      priv.current = await leer(CLAVE_PRIVADA);
      const cache = await leerCacheChat(`g-${id}`);
      if (cache && activo)
      {
        setMensajes(cache);
      }
      let grupo = null;
      try
      {
        grupo = await api.infoGrupo(id);
      }
      catch (e)
      {
      }
      if (grupo && activo)
      {
        setMiembros(grupo.miembros || []);
        setTitulo(grupo.nombre);
        for (const m of grupo.miembros || [])
        {
          pubs.current[m.id] = m.llave_publica;
          nombres.current[m.id] = m.usuario;
        }
      }
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
    socket.on("grupo:mensaje", alMensaje);
    return () => socket.off("grupo:mensaje", alMensaje);
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

  async function mandarTexto(texto, clienteId)
  {
    try
    {
      const r = await api.enviarGrupo(id, clienteId, cifrarParaTodos(texto));
      if (r.ok)
      {
        delete pendientes.current[clienteId];
        setMensajes((prev) =>
        {
          const conEnviado = prev.map((x) => (x.id === clienteId ? { ...x, id: r.id, enviando: false, fallido: false } : x));
          persistir(conEnviado);
          return conEnviado;
        });
      }
      else
      {
        setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, fallido: true, enviando: false } : x)));
      }
    }
    catch (e)
    {
      setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, fallido: true, enviando: false } : x)));
    }
  }

  function enviar()
  {
    const texto = borrador.trim();
    if (!texto || miembros.length === 0)
    {
      return;
    }
    setBorrador("");
    const clienteId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    pendientes.current[clienteId] = { tipo: "texto", texto };
    setMensajes((prev) => [...prev, { id: clienteId, remitente_id: miId.current, texto, enviado_en: new Date().toISOString(), enviando: true }]);
    mandarTexto(texto, clienteId);
  }

  async function subirYMandar(actual, clienteId)
  {
    try
    {
      const base64 = await leerBase64(actual.uri);
      const cif = cifrarArchivo(base64);
      const { path } = await api.subirMedia(cif.datos);
      guardarCache(path, actual.uri);
      const plano = JSON.stringify({ t: actual.tipo, path, mime: actual.mime, k: cif.clave, n: cif.nonce });
      const r = await api.enviarGrupo(id, clienteId, cifrarParaTodos(plano));
      if (r.ok)
      {
        delete pendientes.current[clienteId];
        setMensajes((prev) =>
        {
          const conEnviado = prev.map((x) => (x.id === clienteId ? { ...x, id: r.id, texto: plano, enviando: false, fallido: false } : x));
          persistir(conEnviado);
          return conEnviado;
        });
      }
      else
      {
        setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, fallido: true, enviando: false } : x)));
      }
    }
    catch (e)
    {
      setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, fallido: true, enviando: false } : x)));
    }
  }

  function enviarGrupoMedia(actual)
  {
    if (miembros.length === 0)
    {
      return Promise.resolve();
    }
    const clienteId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    pendientes.current[clienteId] = { tipo: "media", actual };
    const optim = JSON.stringify({ t: actual.tipo, local: actual.uri, mime: actual.mime });
    setMensajes((prev) => [...prev, { id: clienteId, remitente_id: miId.current, texto: optim, enviado_en: new Date().toISOString(), enviando: true }]);
    return subirYMandar(actual, clienteId);
  }

  function enviarSticker(uri)
  {
    setStickers(false);
    enviarGrupoMedia({ uri, tipo: "sticker", mime: "image/png" });
  }

  function mostrarAviso(texto)
  {
    setAviso(texto);
    setTimeout(() => setAviso(""), 1800);
  }

  async function copiarMensaje()
  {
    const item = menu;
    setMenu(null);
    if (item)
    {
      await Clipboard.setStringAsync(item.texto);
      mostrarAviso("Copiado");
    }
  }

  async function descargarMedia()
  {
    const item = menu;
    setMenu(null);
    const media = item ? leerMedia(item.texto) : null;
    if (!media)
    {
      return;
    }
    mostrarAviso("Descargando…");
    const r = await guardarMedia(media);
    mostrarAviso(r === "ok" ? "Guardado en tu galería" : r === "sin_permiso" ? "Sin permiso de galería" : "No se pudo descargar");
  }

  function reintentar(item)
  {
    const pend = pendientes.current[item.id];
    if (!pend)
    {
      return;
    }
    setMensajes((prev) => prev.map((x) => (x.id === item.id ? { ...x, fallido: false, enviando: true } : x)));
    if (pend.tipo === "texto")
    {
      mandarTexto(pend.texto, item.id);
    }
    else
    {
      subirYMandar(pend.actual, item.id);
    }
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
      await enviarGrupoMedia({ uri: a.uri, tipo: a.type === "video" ? "video" : "img", mime: a.mimeType || (a.type === "video" ? "video/mp4" : "image/jpeg") });
    }
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
          await enviarGrupoMedia({ uri: grabadora.uri, tipo: "audio", mime: "audio/mp4" });
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

  const datos = esWeb ? mensajes : mensajes.slice().reverse();

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Stack.Screen options={{ title: titulo, headerRight: () => (
        <Pressable onPress={() => router.push({ pathname: "/grupo/info/[id]", params: { id, nombre: titulo } })} hitSlop={8}>
          <Text style={{ color: colores.botonFondo, fontSize: 13, fontFamily: fuentes.media }}>{miembros.length ? `${miembros.length} miembros` : "Info"}</Text>
        </Pressable>
      ) }} />

      <FlatList
        ref={lista}
        data={datos}
        keyExtractor={(m) => m.id}
        inverted={!esWeb}
        contentContainerStyle={estilos.lista}
        onEndReached={cargarMas}
        onEndReachedThreshold={0.4}
        onContentSizeChange={esWeb ? () => lista.current?.scrollToEnd({ animated: false }) : undefined}
        renderItem={({ item }) =>
        {
          const mio = item.remitente_id === miId.current;
          const media = leerMedia(item.texto);
          const pie = item.fallido ? "no enviado · toca para reintentar" : item.enviando ? "enviando…" : hora(item.enviado_en);
          return (
            <Pressable
              onPress={item.fallido ? () => reintentar(item) : undefined}
              onLongPress={() => setMenu(item)}
              delayLongPress={300}
              style={[estilos.filaMsg, mio ? estilos.derecha : estilos.izquierda]}
            >
              {!mio ? <Text style={[estilos.autor, { color: colores.botonFondo }]}>{item.autor || nombres.current[item.remitente_id] || "…"}</Text> : null}
              {media ? (
                <View style={estilos.mediaCaja}>
                  <Adjunto media={media} color={colores.muted} />
                  <Text style={[estilos.horaMedia, { color: colores.muted }]}>{pie}</Text>
                </View>
              ) : (
                <View style={[estilos.burbuja, { backgroundColor: mio ? colores.botonFondo : colores.surface, borderColor: colores.borde }]}>
                  <Text style={{ color: mio ? colores.botonTexto : colores.texto, fontSize: 15 }}>{item.texto}</Text>
                  <Text style={[estilos.hora, { color: mio ? colores.botonTexto : colores.muted }]}>{pie}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />

      <View style={[estilos.inputFila, { borderTopColor: colores.borde, marginBottom: tecladoAlto, paddingBottom: 12 + (tecladoAlto > 0 ? 0 : insets.bottom) }]}>
        <Pressable onPress={adjuntar} hitSlop={8} style={({ pressed }) => [estilos.clip, pressed && { opacity: 0.6 }]}>
          <Clip color={colores.muted} tamano={22} />
        </Pressable>
        <Pressable onPress={() => setStickers(true)} hitSlop={8} style={({ pressed }) => [estilos.clip, pressed && { opacity: 0.6 }]}>
          <Carita color={colores.muted} tamano={22} />
        </Pressable>
        <TextInput
          value={borrador}
          onChangeText={setBorrador}
          placeholder={grabando ? "Grabando nota de voz…" : "Mensaje"}
          placeholderTextColor={grabando ? colores.error : colores.placeholder}
          multiline
          editable={!grabando}
          style={[estilos.input, { color: colores.texto, backgroundColor: colores.surface, borderColor: colores.borde }]}
        />
        {borrador.trim() ? (
          <Pressable onPress={enviar} style={({ pressed }) => [estilos.enviar, { backgroundColor: colores.botonFondo }, pressed && { opacity: 0.7 }]}>
            <Flecha color={colores.botonTexto} tamano={20} />
          </Pressable>
        ) : (
          <Pressable onPress={grabarToggle} disabled={subiendo} style={({ pressed }) => [estilos.enviar, { backgroundColor: grabando ? colores.error : colores.botonFondo }, pressed && { opacity: 0.7 }]}>
            <Microfono color={colores.botonTexto} tamano={18} />
          </Pressable>
        )}
      </View>

      <SelectorSticker visible={stickers} onElegir={enviarSticker} onCerrar={() => setStickers(false)} />

      <Modal transparent visible={!!menu} animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable style={estilos.menuFondo} onPress={() => setMenu(null)}>
          <Pressable style={[estilos.menuHoja, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            {menu && !leerMedia(menu.texto) ? (
              <Pressable onPress={copiarMensaje} style={({ pressed }) => [estilos.menuItem, pressed && { opacity: 0.6 }]}>
                <Text style={[estilos.menuTxt, { color: colores.texto }]}>Copiar</Text>
              </Pressable>
            ) : null}
            {menu && leerMedia(menu.texto) && leerMedia(menu.texto).path ? (
              <Pressable onPress={descargarMedia} style={({ pressed }) => [estilos.menuItem, pressed && { opacity: 0.6 }]}>
                <Text style={[estilos.menuTxt, { color: colores.texto }]}>Descargar</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setMenu(null)} style={({ pressed }) => [estilos.menuItem, pressed && { opacity: 0.6 }]}>
              <Text style={[estilos.menuTxt, { color: colores.muted }]}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
  filaMsg: { maxWidth: "82%" },
  izquierda: { alignSelf: "flex-start" },
  derecha: { alignSelf: "flex-end" },
  autor: { fontSize: 12, fontFamily: fuentes.semibold, marginLeft: 6, marginBottom: 2 },
  burbuja: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mediaCaja: { gap: 2 },
  hora: { fontSize: 10, alignSelf: "flex-end", marginTop: 2 },
  horaMedia: { fontSize: 10, alignSelf: "flex-end" },
  clip: { width: 40, height: 44, alignItems: "center", justifyContent: "center" },
  inputFila: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 12, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120 },
  enviar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  menuFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuHoja: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingVertical: 8, paddingBottom: 28 },
  menuItem: { paddingVertical: 14, paddingHorizontal: 24 },
  menuTxt: { fontSize: 16 },
  toast: { position: "absolute", bottom: 96, alignSelf: "center", backgroundColor: "rgba(20,20,24,0.92)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  toastTxt: { color: "#FFF", fontSize: 13 },
});
