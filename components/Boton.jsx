import { Pressable, Text, ActivityIndicator } from "react-native";
import { colores } from "../assets/themes/colores";

export function Boton({ titulo, onPress, cargando = false, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || cargando}
      style={{
        backgroundColor: colores.azulOscuro,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        opacity: (disabled || cargando) ? 0.6 : 1,
      }}
    >
      {cargando ? (
        <ActivityIndicator color={colores.blanco} />
      ) : (
        <Text style={{ color: colores.blanco, fontWeight: "700", fontSize: 16 }}>
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}