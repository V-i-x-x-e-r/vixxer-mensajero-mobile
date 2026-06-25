import { useEffect, useRef } from "react";
import { Pressable, Animated } from "react-native";
import { useTema } from "./tema";

const ANCHO = 48;
const ALTO = 28;
const BORDE = 3;
const BOLA = ALTO - BORDE * 2;
const RECORRIDO = ANCHO - BOLA - BORDE * 2;

export function Interruptor({ valor, onCambiar })
{
  const { colores } = useTema();
  const x = useRef(new Animated.Value(valor ? 1 : 0)).current;

  useEffect(() =>
  {
    Animated.timing(x, { toValue: valor ? 1 : 0, duration: 180, useNativeDriver: false }).start();
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
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
