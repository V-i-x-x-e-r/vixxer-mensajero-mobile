// components/Campo.jsx — VISUAL (Raúl). Placeholder: dale tu estilo.
import { TextInput, StyleSheet } from "react-native";

export function Campo(props) {
  return <TextInput placeholderTextColor="#7c8597" style={s.campo} {...props} />;
}

const s = StyleSheet.create({
  campo: { borderWidth: 1, borderColor: "#2a2f3a", borderRadius: 10, padding: 12, color: "#fff" },
});
