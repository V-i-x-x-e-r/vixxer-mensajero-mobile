import { useRef } from "react";
import { Animated, Pressable } from "react-native";

export function Presionable({ onPress, onLongPress, delayLongPress, style, contenedor, children })
{
  const escala = useRef(new Animated.Value(1)).current;

  function entrar()
  {
    Animated.spring(escala, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }

  function salir()
  {
    Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  }

  return (
    <Pressable
      style={contenedor}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      onPressIn={entrar}
      onPressOut={salir}
    >
      <Animated.View style={[style, { transform: [{ scale: escala }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
