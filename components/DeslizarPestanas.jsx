import { useCallback } from "react";
import { Gesture, GestureDetector, Directions } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { router, useFocusEffect } from "expo-router";

const ORDEN = ["chats", "grupos", "amigos"];
let direccion = 0;

export function DeslizarPestanas({ actual, children })
{
  const idx = ORDEN.indexOf(actual);
  const tx = useSharedValue(0);
  const op = useSharedValue(1);

  useFocusEffect(useCallback(() =>
  {
    if (direccion !== 0)
    {
      tx.value = 64 * direccion;
      op.value = 0.25;
      tx.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
      op.value = withTiming(1, { duration: 240 });
      direccion = 0;
    }
  }, []));

  const izquierda = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onEnd(() =>
    {
      if (idx >= 0 && idx < ORDEN.length - 1)
      {
        direccion = 1;
        router.navigate(`/${ORDEN[idx + 1]}`);
      }
    });

  const derecha = Gesture.Fling()
    .direction(Directions.RIGHT)
    .runOnJS(true)
    .onEnd(() =>
    {
      if (idx > 0)
      {
        direccion = -1;
        router.navigate(`/${ORDEN[idx - 1]}`);
      }
    });

  const estilo = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: tx.value }],
    opacity: op.value,
  }));

  return (
    <GestureDetector gesture={Gesture.Race(izquierda, derecha)}>
      <Animated.View style={estilo}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
