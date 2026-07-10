import { useRef } from "react";
import { Pressable, Text, ActivityIndicator, Animated, StyleSheet } from "react-native";
import { Vidrio } from "./Vidrio";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export function Boton({ titulo, onPress, cargando = false, disabled = false, glass = false })
{
  const { colores, oscuro } = useTema();
  const escala = useRef(new Animated.Value(1)).current;
  const inactivo = disabled || cargando;

  function presionar(hacia)
  {
    Animated.spring(escala, { toValue: hacia, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }

  if (glass)
  {
    return (
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={() => presionar(0.97)}
          onPressOut={() => presionar(1)}
          disabled={inactivo}
          style={{ opacity: inactivo ? 0.6 : 1 }}
        >
          <Vidrio
            tinte={oscuro ? "dark" : "light"}
            intensidad={55}
            style={[estilos.glass, { backgroundColor: `${colores.surface}E6`, borderColor: colores.bordeFoco || colores.borde }]}
          >
            {cargando
              ? <ActivityIndicator color={colores.texto} />
              : <Text style={{ color: colores.texto, fontFamily: fuentes.semibold, fontSize: 15 }}>{titulo}</Text>}
          </Vidrio>
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
        {cargando
          ? <ActivityIndicator color={colores.botonTexto} />
          : <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold, fontSize: 14 }}>{titulo}</Text>}
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
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
