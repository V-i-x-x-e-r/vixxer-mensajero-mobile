import { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { guardarPin } from "../lib/pin";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

export function ConfigurarPin({ visible, onListo, onCerrar })
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [fase, setFase] = useState("nuevo");
  const [primero, setPrimero] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function reiniciar()
  {
    setFase("nuevo");
    setPrimero("");
    setPin("");
    setError("");
  }

  function cerrar()
  {
    reiniciar();
    onCerrar();
  }

  async function pulsar(tecla)
  {
    if (tecla === "←")
    {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!tecla || pin.length >= 4)
    {
      return;
    }
    const nuevo = pin + tecla;
    setError("");
    if (nuevo.length < 4)
    {
      setPin(nuevo);
      return;
    }
    if (fase === "nuevo")
    {
      setPrimero(nuevo);
      setPin("");
      setFase("confirmar");
      return;
    }
    if (nuevo === primero)
    {
      await guardarPin(nuevo);
      reiniciar();
      onListo();
    }
    else
    {
      setError("No coincide, intenta de nuevo");
      setPin("");
      setPrimero("");
      setFase("nuevo");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 50, paddingBottom: insets.bottom + 24 }]}>
        <View style={estilos.cabecera}>
          <Text style={[estilos.titulo, { color: colores.texto }]}>{fase === "nuevo" ? "Crea un PIN de 4 dígitos" : "Confírmalo"}</Text>
          {error ? <Text style={[estilos.error, { color: colores.error }]}>{error}</Text> : null}
          <View style={estilos.puntos}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[estilos.punto, { borderColor: colores.texto }, i < pin.length && { backgroundColor: colores.texto }]} />
            ))}
          </View>
        </View>

        <View style={estilos.teclado}>
          {TECLAS.map((t, i) => (
            <Pressable key={i} onPress={() => pulsar(t)} disabled={!t} style={({ pressed }) => [estilos.tecla, pressed && t && { backgroundColor: colores.surface }]}>
              <Text style={[estilos.teclaTxt, { color: colores.texto }]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={cerrar} hitSlop={8}>
          <Text style={[estilos.cancelar, { color: colores.muted }]}>Cancelar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, alignItems: "center", justifyContent: "space-between" },
  cabecera: { alignItems: "center", gap: 18 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold, textAlign: "center" },
  error: { fontSize: 14 },
  puntos: { flexDirection: "row", gap: 18 },
  punto: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  teclado: { width: 300, flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  tecla: { width: 90, height: 76, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  teclaTxt: { fontSize: 26, fontFamily: fuentes.media },
  cancelar: { fontSize: 15 },
});
