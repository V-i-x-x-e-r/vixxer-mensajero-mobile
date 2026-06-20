// components/Burbuja.jsx — VISUAL (Raúl). Placeholder: dale tu estilo.
// `esMia` decide el lado/color. El texto ya viene descifrado por la lógica.
import { View, Text, StyleSheet } from "react-native";

export function Burbuja({ texto, esMia }) {
  return (
    <View style={[s.burbuja, esMia ? s.mia : s.suya]}>
      <Text style={s.txt}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  burbuja: { maxWidth: "80%", borderRadius: 16, padding: 10, marginVertical: 4 },
  mia: { alignSelf: "flex-end", backgroundColor: "#1f7a4d" },
  suya: { alignSelf: "flex-start", backgroundColor: "#222838" },
  txt: { color: "#fff" },
});
