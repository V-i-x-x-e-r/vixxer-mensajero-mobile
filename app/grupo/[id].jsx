import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, FlatList, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as api from "../../lib/api";
import { cifrar, descifrar, cifrarArchivo } from "../../lib/crypto";
import { leerBase64 } from "../../lib/archivos";
import { guardarCache } from "../../lib/mediaCache";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { obtenerSocket } from "../../lib/socket";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Adjunto } from "../../components/Adjunto";
import { Clip } from "../../components/Clip";
import { Flecha } from "../../components/Flecha";

function leerMedia(texto)
{
  if (!texto || texto[0] !== "{")
  {
    return null;
  }
  try
  {
    const obj = JSON.parse(texto);
    return obj && (obj.t === "img" || obj.t === "video") ? obj : null;
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
  const miId = useRef(null);
  const priv = useRef(null);
  const pubs = useRef({});
  const nombres = useRef({});
  const lista = useRef(null);
  const esWeb = Platform.OS === "web";

  useEffect(() =>
  {
    let activo = true;
    (async () =>
    {
      miId.current = await leer(MI_ID);
      priv.current = await leer(CLAVE_PRIVADA);
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
        for (const m of grupo.miembros || [])
        {
          pubs.current[m.id] = m.llave_publica;
          nombres.current[m.id] = m.usuario;
        }
      }
      try
      {
        const filas = await api.historialGrupo(id);
        const desc = filas.map((f) => ({
          id: f.id,
          remitente_id: f.remitente_id,
          texto: pubs.current[f.remitente_id] ? (descifrar(f.contenido_cifrado, f.nonce, pubs.current[f.remitente_id], priv.current) ?? "No se pudo descifrar") : "No se pudo descifrar",
          enviado_en: f.enviado_en,
        }));
        if (activo)
        {
          setMensajes(desc);
        }
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
      const pub = pubs.current[data.remitente_id];
      const texto = pub ? (descifrar(data.contenido_cifrado, data.nonce, pub, priv.current) ?? "No se pudo descifrar") : "No se pudo descifrar";
      setMensajes((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, { id: data.id, remitente_id: data.remitente_id, texto, enviado_en: data.enviado_en }]));
    }
    socket.on("grupo:mensaje", alMensaje);
    return () => socket.off("grupo:mensaje", alMensaje);
  }, [id]);

  async function enviar()
  {
    const texto = borrador.trim();
    if (!texto || miembros.length === 0)
    {
      return;
    }
    setBorrador("");
    const clienteId = `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMensajes((prev) => [...prev, { id: clienteId, remitente_id: miId.current, texto, enviado_en: new Date().toISOString(), enviando: true }]);
    try
    {
      const cifrados = miembros.map((m) =>
      {
        const c = cifrar(texto, m.llave_publica, priv.current);
        return { destinatario_id: m.id, contenido_cifrado: c.contenidoCifrado, nonce: c.nonce };
      });
      const r = await api.enviarGrupo(id, clienteId, cifrados);
      if (r.ok)
      {
        setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, id: r.id, enviando: false } : x)));
      }
      else
      {
        setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, fallido: true } : x)));
      }
    }
    catch (e)
    {
      setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, fallido: true } : x)));
    }
  }

  async function enviarGrupoMedia(actual)
  {
    if (miembros.length === 0)
    {
      return;
    }
    const clienteId = `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optim = JSON.stringify({ t: actual.esVideo ? "video" : "img", local: actual.uri, mime: actual.mime });
    setMensajes((prev) => [...prev, { id: clienteId, remitente_id: miId.current, texto: optim, enviado_en: new Date().toISOString(), enviando: true }]);
    try
    {
      const base64 = await leerBase64(actual.uri);
      const cif = cifrarArchivo(base64);
      const { path } = await api.subirMedia(cif.datos);
      guardarCache(path, actual.uri);
      const plano = JSON.stringify({ t: actual.esVideo ? "video" : "img", path, mime: actual.mime, k: cif.clave, n: cif.nonce });
      const cifrados = miembros.map((m) =>
      {
        const c = cifrar(plano, m.llave_publica, priv.current);
        return { destinatario_id: m.id, contenido_cifrado: c.contenidoCifrado, nonce: c.nonce };
      });
      const r = await api.enviarGrupo(id, clienteId, cifrados);
      setMensajes((prev) => prev.map((x) => (x.id === clienteId ? (r.ok ? { ...x, id: r.id, texto: plano, enviando: false } : { ...x, fallido: true, enviando: false }) : x)));
    }
    catch (e)
    {
      setMensajes((prev) => prev.map((x) => (x.id === clienteId ? { ...x, fallido: true, enviando: false } : x)));
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
      await enviarGrupoMedia({ uri: a.uri, esVideo: a.type === "video", mime: a.mimeType || (a.type === "video" ? "video/mp4" : "image/jpeg") });
    }
  }

  const datos = esWeb ? mensajes : mensajes.slice().reverse();

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Stack.Screen options={{ title: nombre || "Grupo", headerRight: () => (
        <Pressable onPress={() => router.push({ pathname: "/grupo/info/[id]", params: { id, nombre } })} hitSlop={8}>
          <Text style={{ color: colores.botonFondo, fontSize: 13, fontFamily: fuentes.media }}>{miembros.length ? `${miembros.length} miembros` : "Info"}</Text>
        </Pressable>
      ) }} />

      <FlatList
        ref={lista}
        data={datos}
        keyExtractor={(m) => m.id}
        inverted={!esWeb}
        contentContainerStyle={estilos.lista}
        onContentSizeChange={esWeb ? () => lista.current?.scrollToEnd({ animated: false }) : undefined}
        renderItem={({ item }) =>
        {
          const mio = item.remitente_id === miId.current;
          const media = leerMedia(item.texto);
          return (
            <View style={[estilos.filaMsg, mio ? estilos.derecha : estilos.izquierda]}>
              {!mio ? <Text style={[estilos.autor, { color: colores.botonFondo }]}>{nombres.current[item.remitente_id] || "…"}</Text> : null}
              {media ? (
                <View style={estilos.mediaCaja}>
                  <Adjunto media={media} color={colores.muted} />
                  <Text style={[estilos.horaMedia, { color: colores.muted }]}>{item.fallido ? "no enviado" : item.enviando ? "enviando…" : hora(item.enviado_en)}</Text>
                </View>
              ) : (
                <View style={[estilos.burbuja, { backgroundColor: mio ? colores.botonFondo : colores.surface, borderColor: colores.borde }]}>
                  <Text style={{ color: mio ? colores.botonTexto : colores.texto, fontSize: 15 }}>{item.texto}</Text>
                  <Text style={[estilos.hora, { color: mio ? colores.botonTexto : colores.muted }]}>{item.fallido ? "no enviado" : item.enviando ? "enviando…" : hora(item.enviado_en)}</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={[estilos.inputFila, { borderTopColor: colores.borde, paddingBottom: 12 + insets.bottom }]}>
        <Pressable onPress={adjuntar} hitSlop={8} style={({ pressed }) => [estilos.clip, pressed && { opacity: 0.6 }]}>
          <Clip color={colores.muted} tamano={22} />
        </Pressable>
        <TextInput
          value={borrador}
          onChangeText={setBorrador}
          placeholder="Mensaje"
          placeholderTextColor={colores.placeholder}
          multiline
          style={[estilos.input, { color: colores.texto, backgroundColor: colores.surface, borderColor: colores.borde }]}
        />
        <Pressable onPress={enviar} style={({ pressed }) => [estilos.enviar, { backgroundColor: colores.botonFondo }, pressed && { opacity: 0.7 }]}>
          <Flecha color={colores.botonTexto} tamano={20} />
        </Pressable>
      </View>
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
});
