import { useRef } from "react";
import { Pressable, Text, ActivityIndicator, Animated } from "react-native";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export function Boton({ titulo, onPress, cargando = false, disabled = false })
{
  const { colores } = useTema();
  const escala = useRef(new Animated.Value(1)).current;
  const inactivo = disabled || cargando;

  function presionar(hacia)
  {
    Animated.spring(escala, { toValue: hacia, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => presionar(0.97)}
        onPressOut={() => presionar(1)}
        disabled={inactivo}
        style={{
          backgroundColor: colores.botonFondo,
          borderRadius: 8,
          paddingVertical: 13,
          alignItems: "center",
          opacity: inactivo ? 0.6 : 1,
        }}
      >
        {cargando
          ? <ActivityIndicator color={colores.botonTexto} />
          : <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold, fontSize: 14 }}>{titulo}</Text>}
      </Pressable>
    </Animated.View>
  );
}
