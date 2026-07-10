import { useRef } from "react";
import { Pressable, Text, ActivityIndicator, Animated, StyleSheet } from "react-native";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export function Boton({ titulo, onPress, cargando = false, disabled = false, glass = false })
{
  const { colores } = useTema();
  const escala = useRef(new Animated.Value(1)).current;
  const inactivo = disabled || cargando;

  function presionar(hacia)
  {
    Animated.spring(escala, { toValue: hacia, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }

  const contenido = cargando
    ? <ActivityIndicator color={colores.botonTexto} />
    : <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold, fontSize: glass ? 15 : 14 }}>{titulo}</Text>;

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => presionar(0.97)}
        onPressOut={() => presionar(1)}
        disabled={inactivo}
        style={[
          glass ? estilos.premium : estilos.plano,
          { backgroundColor: colores.botonFondo, opacity: inactivo ? 0.6 : 1 },
          glass && { borderColor: colores.bordeFoco || colores.borde },
        ]}
      >
        {contenido}
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  plano: { borderRadius: 8, paddingVertical: 11, alignItems: "center" },
  premium:
  {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
