import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as api from "../../lib/api";
import { obtenerSocket } from "../../lib/socket";
import { cifrar, descifrar } from "../../lib/crypto";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Candado } from "../../components/Candado";
import { Visto } from "../../components/Visto";

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

export default function Chat()
{
  const { colores } = useTema();
  const { id: otroId, usuario } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [abajo, setAbajo] = useState(true);
  const miId = useRef(null);
  const lista = useRef(null);

  async function abrir(fila)
  {
    const priv = await leer(CLAVE_PRIVADA);
    const pub = await llavePublicaDe(fila.remitente_id);
    const claro = descifrar(fila.contenido_cifrado, fila.nonce, pub, priv);
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
        const descifrados = await Promise.all(filas.map(async (m) => ({ ...m, texto: await abrir(m) })));
        if (activo)
        {
          setMensajes(descifrados);
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
        setMensajes((prev) => [...prev, { ...fila, texto: t }]);
      }
    }

    function alEscribir(data)
    {
      if (data && data.de === otroId)
      {
        setEscribiendo(!!data.activo);
      }
    }

    if (socket)
    {
      socket.on("mensaje:recibido", alRecibir);
      socket.on("usuario:escribiendo", alEscribir);
    }

    return () =>
    {
      activo = false;
      if (socket)
      {
        socket.off("mensaje:recibido", alRecibir);
        socket.off("usuario:escribiendo", alEscribir);
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
    const socket = obtenerSocket();
    const priv = await leer(CLAVE_PRIVADA);
    const pubDest = await llavePublicaDe(otroId);
    const { contenidoCifrado, nonce } = cifrar(limpio, pubDest, priv);
    socket.emit("mensaje:enviar", { destinatarioId: otroId, contenidoCifrado, nonce });
    setMensajes((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, remitente_id: miId.current, texto: limpio, enviado_en: new Date().toISOString() },
    ]);
    setTexto("");
  }

  function alDesplazar(e)
  {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setAbajo(contentOffset.y + layoutMeasurement.height >= contentSize.height - 80);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[estilos.pantalla, { backgroundColor: colores.fondo }]}
    >
      <Stack.Screen options={{ title: usuario || "Conversación" }} />

      <FlatList
        ref={lista}
        data={mensajes}
        keyExtractor={(m) => m.id}
        contentContainerStyle={estilos.lista}
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        onContentSizeChange={() =>
        {
          if (abajo)
          {
            lista.current?.scrollToEnd({ animated: true });
          }
        }}
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

          return (
            <View>
              {nuevoDia ? (
                <View style={estilos.dia}>
                  <Text style={[estilos.diaTxt, { color: colores.muted, backgroundColor: colores.surface, borderColor: colores.borde }]}>
                    {etiquetaDia(item.enviado_en)}
                  </Text>
                </View>
              ) : null}

              <View
                style={[
                  estilos.burbuja,
                  mio
                    ? { alignSelf: "flex-end", backgroundColor: colores.botonFondo }
                    : { alignSelf: "flex-start", backgroundColor: colores.surface, borderWidth: 1, borderColor: colores.borde },
                ]}
              >
                <Text style={{ color: mio ? colores.botonTexto : colores.texto, fontSize: 15 }}>{item.texto}</Text>
                <View style={estilos.meta}>
                  <Text style={[estilos.hora, { color: mio ? colores.botonTexto : colores.muted }]}>{hora(item.enviado_en)}</Text>
                  {mio ? <Visto color={colores.botonTexto} leido={!!item.leido_en} tamano={11} /> : null}
                </View>
              </View>
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

      {escribiendo ? <Text style={[estilos.escribiendo, { color: colores.muted }]}>escribiendo…</Text> : null}

      <View style={[estilos.inputFila, { borderTopColor: colores.borde }]}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Mensaje"
          placeholderTextColor={colores.placeholder}
          style={[estilos.campo, { backgroundColor: colores.surface, borderColor: colores.borde, color: colores.texto }]}
        />
        <Pressable onPress={enviar} style={[estilos.enviar, { backgroundColor: colores.botonFondo }]}>
          <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold }}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { padding: 14, gap: 6 },
  banner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  bannerTxt: { fontSize: 12 },
  dia: { alignItems: "center", marginVertical: 8 },
  diaTxt: { fontSize: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  burbuja: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginTop: 3 },
  hora: { fontSize: 10, opacity: 0.7 },
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
  escribiendo: { paddingHorizontal: 16, paddingBottom: 4, fontSize: 13 },
  inputFila: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1 },
  campo: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  enviar: { borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
});
