import { useCallback } from "react";
import { Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { router, useFocusEffect } from "expo-router";

const ORDEN = ["chats", "grupos", "amigos"];
let direccion = 0;

export function DeslizarPestanas({ actual, children })
{
  const idx = ORDEN.indexOf(actual);
  const tx = useSharedValue(0);
  const op = useSharedValue(1);
  const ancho = Dimensions.get("window").width;

  useFocusEffect(useCallback(() =>
  {
    if (direccion !== 0)
    {
      tx.value = ancho * 0.88 * direccion;
      op.value = 0.72;
      tx.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      op.value = withTiming(1, { duration: 220 });
      direccion = 0;
    }
  }, []));

  function navegar(dir)
  {
    if (dir > 0 && idx < ORDEN.length - 1)
    {
      direccion = 1;
      router.navigate(`/${ORDEN[idx + 1]}`);
    }
    else if (dir < 0 && idx > 0)
    {
      direccion = -1;
      router.navigate(`/${ORDEN[idx - 1]}`);
    }
  }

  const gesto = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-16, 16])
    .onUpdate((e) =>
    {
      const bordeIzq = idx === 0 && e.translationX > 0;
      const bordeDer = idx === ORDEN.length - 1 && e.translationX < 0;
      const resistencia = bordeIzq || bordeDer ? 0.22 : 0.92;
      tx.value = e.translationX * resistencia;
      op.value = 1 - Math.min(0.18, Math.abs(e.translationX) / ancho * 0.24);
    })
    .onEnd((e) =>
    {
      const suficiente = Math.abs(e.translationX) > ancho * 0.22 || Math.abs(e.velocityX) > 720;
      if (suficiente && e.translationX < 0 && idx < ORDEN.length - 1)
      {
        tx.value = withTiming(-ancho, { duration: 180, easing: Easing.in(Easing.cubic) });
        runOnJS(navegar)(1);
        return;
      }
      if (suficiente && e.translationX > 0 && idx > 0)
      {
        tx.value = withTiming(ancho, { duration: 180, easing: Easing.in(Easing.cubic) });
        runOnJS(navegar)(-1);
        return;
      }
      tx.value = withSpring(0, { damping: 22, stiffness: 260 });
      op.value = withTiming(1, { duration: 160 });
    })
    .onFinalize(() =>
    {
      op.value = withTiming(1, { duration: 160 });
    });

  const estilo = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: tx.value }],
    opacity: op.value,
  }));

  return (
    <GestureDetector gesture={gesto}>
      <Animated.View style={estilo}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
