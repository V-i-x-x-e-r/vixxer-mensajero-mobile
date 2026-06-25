import { useEffect, useRef } from "react";
import { Pressable, Animated } from "react-native";
import { useTema } from "./tema";

const ANCHO = 51;
const ALTO = 31;
const BORDE = 2;
const BOLA = ALTO - BORDE * 2;
const RECORRIDO = ANCHO - BOLA - BORDE * 2;

export function Interruptor({ valor, onCambiar })
{
  const { colores } = useTema();
  const x = useRef(new Animated.Value(valor ? 1 : 0)).current;

  useEffect(() =>
  {
    Animated.spring(x, { toValue: valor ? 1 : 0, useNativeDriver: false, damping: 16, stiffness: 220 }).start();
  }, [valor]);

  const fondo = x.interpolate({ inputRange: [0, 1], outputRange: [colores.borde, colores.texto] });
  const bola = x.interpolate({ inputRange: [0, 1], outputRange: [colores.texto, colores.fondo] });
  const desplazar = x.interpolate({ inputRange: [0, 1], outputRange: [0, RECORRIDO] });

  return (
    <Pressable onPress={() => onCambiar(!valor)} hitSlop={8}>
      <Animated.View
        style={{
          width: ANCHO,
          height: ALTO,
          borderRadius: ALTO / 2,
          padding: BORDE,
          backgroundColor: fondo,
        }}
      >
        <Animated.View
          style={{
            width: BOLA,
            height: BOLA,
            borderRadius: BOLA / 2,
            backgroundColor: bola,
            transform: [{ translateX: desplazar }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
