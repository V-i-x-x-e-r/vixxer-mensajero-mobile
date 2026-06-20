// components/Boton.jsx — VISUAL (Raúl). Placeholder: dale tu estilo.
// Recibe props y pinta; no contiene lógica.
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";

export function Boton({ titulo, onPress, cargando = false, disabled = false }) {
  return (
    <Pressable onPress={onPress} disabled={disabled || cargando} style={s.boton}>
      {cargando ? <ActivityIndicator color="#0f1115" /> : <Text style={s.txt}>{titulo}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  boton: { backgroundColor: "#35d487", borderRadius: 10, padding: 14, alignItems: "center" },
  txt: { color: "#0f1115", fontWeight: "700" },
});
