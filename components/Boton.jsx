import { useRef } from "react";
import { View, Pressable, Text, ActivityIndicator, Animated, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

function Gloss()
{
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="vxGloss" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.02" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.12" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#vxGloss)" />
    </Svg>
  );
}

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

  if (glass)
  {
    return (
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={() => presionar(0.97)}
          onPressOut={() => presionar(1)}
          disabled={inactivo}
          style={[estilos.glass, { backgroundColor: colores.botonFondo, borderColor: colores.bordeFoco || colores.borde, opacity: inactivo ? 0.6 : 1 }]}
        >
          <Gloss />
          <View style={estilos.centroGlass}>{contenido}</View>
        </Pressable>
      </Animated.View>
    );
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
          paddingVertical: 11,
          alignItems: "center",
          opacity: inactivo ? 0.6 : 1,
        }}
      >
        {contenido}
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  glass:
  {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  centroGlass: { paddingVertical: 13, alignItems: "center" },
});
