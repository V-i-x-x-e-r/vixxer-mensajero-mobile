import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as api from "../../lib/api";
import { obtenerSocket } from "../../lib/socket";
import { cifrar, descifrar } from "../../lib/crypto";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { useTema } from "../../components/tema";

export default function Chat()
{
  const { colores } = useTema();
  const { id: otroId } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const miId = useRef(null);

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
    if (socket)
    {
      socket.on("mensaje:recibido", alRecibir);
    }

    return () =>
    {
      activo = false;
      if (socket)
      {
        socket.off("mensaje:recibido", alRecibir);
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
    setMensajes((prev) => [...prev, { id: `local-${Date.now()}`, remitente_id: miId.current, texto: limpio }]);
    setTexto("");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[estilos.pantalla, { backgroundColor: colores.fondo }]}
    >
      <FlatList
        data={mensajes}
        keyExtractor={(m) => m.id}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) =>
        {
          const mio = item.remitente_id === miId.current;
          return (
            <View
              style={[
                estilos.burbuja,
                mio
                  ? { alignSelf: "flex-end", backgroundColor: colores.botonFondo }
                  : { alignSelf: "flex-start", backgroundColor: colores.surface, borderWidth: 1, borderColor: colores.borde },
              ]}
            >
              <Text style={{ color: mio ? colores.botonTexto : colores.texto, fontSize: 15 }}>{item.texto}</Text>
            </View>
          );
        }}
      />

      <View style={[estilos.inputFila, { borderTopColor: colores.borde }]}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Mensaje"
          placeholderTextColor={colores.placeholder}
          style={[estilos.campo, { backgroundColor: colores.surface, borderColor: colores.borde, color: colores.texto }]}
        />
        <Pressable onPress={enviar} style={[estilos.enviar, { backgroundColor: colores.botonFondo }]}>
          <Text style={{ color: colores.botonTexto, fontWeight: "600" }}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { padding: 14, gap: 8 },
  burbuja: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  inputFila: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1 },
  campo: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  enviar: { borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
});
