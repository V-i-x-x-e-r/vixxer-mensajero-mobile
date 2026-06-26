import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, Image, Modal, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
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

function BurbujaMedible({ style, onSeleccionar, children })
{
  const ref = useRef(null);

  function alMantener()
  {
    ref.current?.measureInWindow((x, y, w, h) => onSeleccionar({ x, y, w, h }));
  }

  return (
    <Pressable ref={ref} onLongPress={alMantener} delayLongPress={250} style={style}>
      {children}
    </Pressable>
  );
}

export default function Chat()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const { id: otroId, usuario, avatar } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
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
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const miId = useRef(null);
  const lista = useRef(null);
  const tecleando = useRef(null);

  const invertidos = useMemo(() => mensajes.slice().reverse(), [mensajes]);

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

    (async () =>
    {
      miId.current = await leer(MI_ID);
      try
      {
        const filas = await api.historial(otroId);
        const priv = await leer(CLAVE_PRIVADA);
        let pub = await llavePublicaDe(otroId);
        let descifrados = filas.map((m) => ({ ...m, texto: descifrar(m.contenido_cifrado, m.nonce, pub, priv) }));
        if (descifrados.some((m) => m.texto === null))
        {
          pub = await llavePublicaDe(otroId, true);
          descifrados = descifrados.map((m) => (m.texto === null ? { ...m, texto: descifrar(m.contenido_cifrado, m.nonce, pub, priv) } : m));
        }
        descifrados = descifrados.map((m) => ({ ...m, texto: m.texto ?? "No se pudo descifrar este mensaje" }));
        if (activo)
        {
          setMensajes(descifrados);
          marcarLeidos(descifrados);
        }
      }
      catch (e)
      {
      }

      socket = await asegurarSocket();
      if (socket && activo)
      {
        socket.on("mensaje:recibido", alRecibir);
        socket.on("usuario:escribiendo", alEscribir);
        socket.on("mensaje:entregado", alEstado);
        socket.on("mensaje:leido", alEstado);
        socket.on("mensaje:reaccion", alReaccion);
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
      }
    };
  }, [otroId]);

  async function mandar(plano)
  {
    const socket = await asegurarSocket();
    if (!socket)
    {
      return;
    }
    const priv = await leer(CLAVE_PRIVADA);
    const pubDest = await llavePublicaDe(otroId);
    const { contenidoCifrado, nonce } = cifrar(plano, pubDest, priv);
    const localId = `local-${Date.now()}`;
    const resp = respondiendo;
    socket.emit(
      "mensaje:enviar",
      {
        destinatarioId: otroId,
        contenidoCifrado,
        nonce,
        respuestaA: resp ? resp.id : null,
      },
      (r) =>
      {
        if (r && r.ok)
        {
          setMensajes((prev) => prev.map((m) => (m.id === localId ? { ...m, id: r.id, estado: "enviado" } : m)));
        }
      },
    );
    setMensajes((prev) => [
      ...prev,
      {
        id: localId,
        remitente_id: miId.current,
        texto: plano,
        enviado_en: new Date().toISOString(),
        estado: "enviando",
        respuestaTexto: resp ? resp.texto : null,
      },
    ]);
    setRespondiendo(null);
    lista.current?.scrollToOffset({ offset: 0, animated: true });
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

  async function adjuntar()
  {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted)
    {
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.6, videoMaxDuration: 20 });
    if (r.canceled)
    {
      return;
    }
    const asset = r.assets[0];
    setPrevio({
      uri: asset.uri,
      esVideo: asset.type === "video",
      mime: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
    });
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
    catch (e)
    {
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
            <View style={estilos.encabezado}>
              <Avatar nombre={usuario || ""} uri={avatar || null} tamano={32} />
              <View>
                <Text style={[estilos.encabezadoTxt, { color: colores.texto }]}>{usuario || "Conversación"}</Text>
                {sub ? <Text style={[estilos.encabezadoSub, { color: colores.muted }]}>{sub}</Text> : null}
              </View>
            </View>
          ),
        }}
      />

      <FlatList
        ref={lista}
        data={invertidos}
        keyExtractor={(m) => m.id}
        inverted
        style={estilos.flex}
        contentContainerStyle={estilos.lista}
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        ListFooterComponent={
          <View style={estilos.banner}>
            <Candado color={colores.muted} tamano={12} />
            <Text style={[estilos.bannerTxt, { color: colores.muted }]}>Cifrado de extremo a extremo</Text>
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

          return (
            <View>
              {nuevoDia ? (
                <View style={estilos.dia}>
                  <Text style={[estilos.diaTxt, { color: colores.muted, backgroundColor: colores.surface, borderColor: colores.borde }]}>
                    {etiquetaDia(item.enviado_en)}
                  </Text>
                </View>
              ) : null}

              <BurbujaMedible
                onSeleccionar={(coords) => setSel({ mensaje: item, ...coords })}
                style={[
                  estilos.burbuja,
                  mio
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
                  <Adjunto media={media} color={mio ? colores.botonTexto : colores.texto} />
                ) : (
                  <Text style={{ color: mio ? colores.botonTexto : colores.texto, fontSize: 15 }}>{item.texto}</Text>
                )}

                <View style={estilos.meta}>
                  {item.editado ? (
                    <Text style={[estilos.editado, { color: mio ? colores.botonTexto : colores.muted }]}>editado</Text>
                  ) : null}
                  <Text style={[estilos.hora, { color: mio ? colores.botonTexto : colores.muted }]}>{hora(item.enviado_en)}</Text>
                  {mio ? (
                    item.estado === "enviando"
                      ? <Reloj color={GRIS_VISTO} tamano={11} />
                      : <Visto color={item.leido_en ? colores.botonTexto : GRIS_VISTO} dos={!!item.entregado_en || !!item.leido_en} tamano={11} />
                  ) : null}
                </View>
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
            </View>
          );
        }}
      />

      {lejos ? (
        <Pressable
          onPress={() => lista.current?.scrollToOffset({ offset: 0, animated: true })}
          style={[estilos.bajar, { backgroundColor: colores.surface, borderColor: colores.borde }]}
        >
          <Text style={{ color: colores.texto, fontSize: 18 }}>{"↓"}</Text>
        </Pressable>
      ) : null}

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

      <View style={[estilos.inputFila, { borderTopColor: colores.borde, paddingBottom: 12 + insets.bottom }]}>
        <Pressable
          onPress={adjuntar}
          disabled={subiendo || grabando}
          hitSlop={6}
          style={({ pressed }) => [estilos.clip, { opacity: subiendo || grabando ? 0.4 : 1 }, pressed && estilos.enviarPresionado]}
        >
          <Clip color={colores.muted} tamano={20} />
        </Pressable>
        <TextInput
          value={texto}
          onChangeText={escribir}
          placeholder={grabando ? "Grabando…" : "Mensaje"}
          placeholderTextColor={grabando ? colores.error : colores.placeholder}
          editable={!grabando}
          multiline
          style={[estilos.campo, { backgroundColor: colores.surface, borderColor: colores.borde, color: colores.texto }]}
        />
        {texto.trim() || editando ? (
          <Pressable
            onPress={enviar}
            style={({ pressed }) => [estilos.enviar, { backgroundColor: colores.botonFondo }, pressed && estilos.enviarPresionado]}
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

      <AccionesMensaje
        sel={sel}
        esMio={sel ? sel.mensaje.remitente_id === miId.current : false}
        onReaccionar={reaccionar}
        onResponder={responder}
        onCopiar={copiar}
        onEditar={editar}
        onBorrar={borrar}
        onCerrar={() => setSel(null)}
      />

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
  encabezadoTxt: { fontSize: 17, fontFamily: fuentes.semibold },
  encabezadoSub: { fontSize: 12 },
  lista: { padding: 14, gap: 6 },
  banner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  bannerTxt: { fontSize: 12 },
  dia: { alignItems: "center", marginVertical: 8 },
  diaTxt: { fontSize: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  burbuja: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  cita: { borderLeftWidth: 2, paddingLeft: 8, marginBottom: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginTop: 3 },
  editado: { fontSize: 10, opacity: 0.7, fontStyle: "italic" },
  hora: { fontSize: 10, opacity: 0.7 },
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
