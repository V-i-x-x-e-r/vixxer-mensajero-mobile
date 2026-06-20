// app/chat/[id].jsx — Conversación 1-a-1.
// LÓGICA (Paola): el flujo E2EE completo.
//   - historial: pide los mensajes y los DESCIFRA en el teléfono.
//   - enviar: CIFRA con la pública del destinatario + mi privada, y emite por el socket.
//   - recibir: escucha "mensaje:recibido" y descifra al llegar.
// El servidor solo ve blobs opacos. La clave privada nunca sale de aquí.
// VISUAL (Raúl): las burbujas y el input de abajo son provisionales (ver components/).

import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, FlatList,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as api from "../../lib/api";
import { obtenerSocket } from "../../lib/socket";
import { cifrar, descifrar } from "../../lib/crypto";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";

export default function Chat() {
  const { id: otroId } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const miId = useRef(null);

  // Descifra una fila del backend (snake_case) y devuelve el texto legible (o aviso honesto).
  async function abrir(fila) {
    const priv = await leer(CLAVE_PRIVADA);
    const pub = await llavePublicaDe(fila.remitente_id);
    const texto = descifrar(fila.contenido_cifrado, fila.nonce, pub, priv);
    return texto ?? "No se pudo descifrar este mensaje";
  }

  useEffect(() => {
    let activo = true;

    (async () => {
      miId.current = await leer(MI_ID);
      // Historial: traer y descifrar lo anterior.
      try {
        const filas = await api.historial(otroId);
        const descifrados = await Promise.all(
          filas.map(async (m) => ({ ...m, texto: await abrir(m) })),
        );
        if (activo) setMensajes(descifrados);
      } catch (e) {
        // historial aún no disponible (endpoint de Ricardo): arrancamos vacío
      }
    })();

    // Mensajes nuevos en vivo.
    const socket = obtenerSocket();
    async function alRecibir(fila) {
      if (fila.remitente_id !== otroId) return; // solo los de esta conversación
      const texto = await abrir(fila);
      if (activo) setMensajes((prev) => [...prev, { ...fila, texto }]);
    }
    if (socket) socket.on("mensaje:recibido", alRecibir);

    return () => {
      activo = false;
      if (socket) socket.off("mensaje:recibido", alRecibir);
    };
  }, [otroId]);

  async function enviar() {
    const limpio = texto.trim();
    if (!limpio) return;
    const socket = obtenerSocket();
    const priv = await leer(CLAVE_PRIVADA);
    const pubDest = await llavePublicaDe(otroId);
    const { contenidoCifrado, nonce } = cifrar(limpio, pubDest, priv);
    socket.emit("mensaje:enviar", { destinatarioId: otroId, contenidoCifrado, nonce });
    // Pintamos nuestra propia burbuja al instante (eco optimista).
    setMensajes((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, remitente_id: miId.current, texto: limpio },
    ]);
    setTexto("");
  }

  // ----- VISUAL provisional (Raúl) -----
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={s.cont}
    >
      <FlatList
        data={mensajes}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={[s.burbuja, item.remitente_id === miId.current ? s.mia : s.suya]}>
            <Text style={s.txt}>{item.texto}</Text>
          </View>
        )}
      />
      <View style={s.inputFila}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Mensaje"
          placeholderTextColor="#7c8597"
          style={s.campo}
        />
        <Pressable onPress={enviar} style={s.enviar}>
          <Text style={s.enviarTxt}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  cont: { flex: 1, backgroundColor: "#0f1115" },
  burbuja: { maxWidth: "80%", borderRadius: 16, padding: 10, marginVertical: 4 },
  mia: { alignSelf: "flex-end", backgroundColor: "#1f7a4d" },
  suya: { alignSelf: "flex-start", backgroundColor: "#222838" },
  txt: { color: "#fff" },
  inputFila: { flexDirection: "row", gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: "#1c2230" },
  campo: { flex: 1, borderWidth: 1, borderColor: "#2a2f3a", borderRadius: 10, padding: 10, color: "#fff" },
  enviar: { backgroundColor: "#35d487", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  enviarTxt: { color: "#0f1115", fontWeight: "700" },
});
