import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, Keyboard, Platform, LayoutAnimation, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as api from "../../lib/api";
import { obtenerSocket, conectarSocket } from "../../lib/socket";
import { cifrar, descifrar } from "../../lib/crypto";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, TOKEN, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Candado } from "../../components/Candado";
import { Visto } from "../../components/Visto";
import { Avatar } from "../../components/Avatar";
import { Reloj } from "../../components/Reloj";
import { Flecha } from "../../components/Flecha";
import { Check } from "../../components/Check";
import { AccionesMensaje } from "../../components/AccionesMensaje";

const GRIS_VISTO = "#8E8E93";

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
  const [tecladoAlto, setTecladoAlto] = useState(0);
  const [alturaVista, setAlturaVista] = useState(0);
  const baseVista = useRef(0);
  const { id: otroId, usuario, avatar } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [presencia, setPresencia] = useState(null);
  const [abajo, setAbajo] = useState(true);
  const [sel, setSel] = useState(null);
  const [respondiendo, setRespondiendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const miId = useRef(null);
  const lista = useRef(null);
  const tecleando = useRef(null);
  const abajoRef = useRef(true);
  const cantidadRef = useRef(0);

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
    const verShow = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const verHide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const mostrar = Keyboard.addListener(verShow, (e) =>
    {
      setTecladoAlto(e.endCoordinates.height);
      if (abajoRef.current)
      {
        abajoRef.current = true;
        setTimeout(() =>
        {
          lista.current?.scrollToEnd({ animated: true });
        }, 250);
      }
    });
    const ocultar = Keyboard.addListener(verHide, () => setTecladoAlto(0));
    return () =>
    {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

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
    })();

    const socket = obtenerSocket();

    async function alRecibir(fila)
    {
      if (fila.remitente_id !== otroId)
      {
        return;
      }
      const t = await abrir(fila);
      if (activo)
      {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMensajes((prev) => [...prev, { ...fila, texto: t }]);
        marcarLeidos([fila]);
      }
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

    if (socket)
    {
      socket.on("mensaje:recibido", alRecibir);
      socket.on("usuario:escribiendo", alEscribir);
      socket.on("mensaje:entregado", alEstado);
      socket.on("mensaje:leido", alEstado);
      socket.on("mensaje:reaccion", alReaccion);
    }

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

  async function enviar()
  {
    const limpio = texto.trim();
    if (!limpio)
    {
      return;
    }
    let socket = obtenerSocket();
    if (!socket)
    {
      socket = conectarSocket(await leer(TOKEN));
    }
    if (!socket)
    {
      return;
    }
    const priv = await leer(CLAVE_PRIVADA);
    const pubDest = await llavePublicaDe(otroId);
    const { contenidoCifrado, nonce } = cifrar(limpio, pubDest, priv);

    if (editando)
    {
      const objetivo = editando.id;
      socket.emit("mensaje:editar", { id: objetivo, destinatarioId: otroId, contenidoCifrado, nonce });
      setMensajes((prev) => prev.map((m) => (m.id === objetivo ? { ...m, texto: limpio, editado: true } : m)));
      setEditando(null);
      setTexto("");
      return;
    }

    const localId = `local-${Date.now()}`;
    abajoRef.current = true;
    socket.emit(
      "mensaje:enviar",
      {
        destinatarioId: otroId,
        contenidoCifrado,
        nonce,
        respuestaA: respondiendo ? respondiendo.id : null,
      },
      (resp) =>
      {
        if (resp && resp.ok)
        {
          setMensajes((prev) => prev.map((m) => (m.id === localId ? { ...m, id: resp.id, estado: "enviado" } : m)));
        }
      },
    );
    if (tecleando.current)
    {
      clearTimeout(tecleando.current);
    }
    socket.emit("usuario:escribiendo", { para: otroId, activo: false });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMensajes((prev) => [
      ...prev,
      {
        id: localId,
        remitente_id: miId.current,
        texto: limpio,
        enviado_en: new Date().toISOString(),
        estado: "enviando",
        respuestaTexto: respondiendo ? respondiendo.texto : null,
      },
    ]);
    setRespondiendo(null);
    setTexto("");
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
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const cerca = contentOffset.y + layoutMeasurement.height >= contentSize.height - 220;
    abajoRef.current = cerca;
    setAbajo(cerca);
  }

  useEffect(() =>
  {
    if (mensajes.length > cantidadRef.current && abajoRef.current)
    {
      setTimeout(() => lista.current?.scrollToEnd({ animated: true }), 60);
    }
    cantidadRef.current = mensajes.length;
  }, [mensajes]);

  const sub = escribiendo
    ? "escribiendo…"
    : presencia && presencia.en_linea
      ? "en línea"
      : presencia && presencia.ultima_conexion
        ? `últ. vez ${hora(presencia.ultima_conexion)}`
        : null;

  const osRedimensiona = tecladoAlto > 0 && baseVista.current > 0 && baseVista.current - alturaVista > tecladoAlto * 0.4;
  const padInferior = tecladoAlto > 0 ? (osRedimensiona ? 0 : tecladoAlto) : insets.bottom;

  return (
    <View
      onLayout={(e) =>
      {
        const h = e.nativeEvent.layout.height;
        setAlturaVista(h);
        if (tecladoAlto === 0)
        {
          baseVista.current = h;
        }
      }}
      style={[
        estilos.pantalla,
        { backgroundColor: colores.fondo, paddingBottom: padInferior },
      ]}
    >
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
        data={mensajes}
        keyExtractor={(m) => m.id}
        style={estilos.flex}
        contentContainerStyle={estilos.lista}
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={estilos.banner}>
            <Candado color={colores.muted} tamano={12} />
            <Text style={[estilos.bannerTxt, { color: colores.muted }]}>Cifrado de extremo a extremo</Text>
          </View>
        }
        renderItem={({ item, index }) =>
        {
          const mio = item.remitente_id === miId.current;
          const prev = mensajes[index - 1];
          const nuevoDia = !prev || !mismoDia(prev.enviado_en, item.enviado_en);
          const reacciones = agrupar(item.reacciones);
          const citado = item.respuestaTexto
            ?? (item.respuesta_a ? (mensajes.find((m) => m.id === item.respuesta_a)?.texto ?? "Mensaje") : null);

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

                <Text style={{ color: mio ? colores.botonTexto : colores.texto, fontSize: 15 }}>{item.texto}</Text>

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

      {!abajo ? (
        <Pressable
          onPress={() => lista.current?.scrollToEnd({ animated: true })}
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

      <View style={[estilos.inputFila, { borderTopColor: colores.borde }]}>
        <TextInput
          value={texto}
          onChangeText={escribir}
          placeholder="Mensaje"
          placeholderTextColor={colores.placeholder}
          multiline
          style={[estilos.campo, { backgroundColor: colores.surface, borderColor: colores.borde, color: colores.texto }]}
        />
        <Pressable
          onPress={enviar}
          disabled={!texto.trim()}
          style={({ pressed }) => [
            estilos.enviar,
            { backgroundColor: colores.botonFondo, opacity: texto.trim() ? 1 : 0.4 },
            pressed && estilos.enviarPresionado,
          ]}
        >
          {editando ? <Check color={colores.botonTexto} tamano={20} /> : <Flecha color={colores.botonTexto} tamano={20} />}
        </Pressable>
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
  inputFila: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1 },
  campo: { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, maxHeight: 120, fontSize: 15 },
  enviar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  enviarPresionado: { transform: [{ scale: 0.92 }] },
});
