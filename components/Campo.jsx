import { TextInput } from "react-native";
import { colores } from "../assets/themes/colores";

export function Campo({ valor, setValor, placeholder, secureTextEntry = false }) {
  return (
    <TextInput
      style={{
        backgroundColor: colores.surfaceLight, // un tono más claro que el fondo de la tarjeta
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colores.texto,
        borderWidth: 1,
        borderColor: colores.borde,
      }}
      placeholder={placeholder}
      placeholderTextColor={colores.textoSecundario}
      value={valor}
      onChangeText={setValor}
      secureTextEntry={secureTextEntry}
    />
  );
}