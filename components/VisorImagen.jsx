import { View, Pressable, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { fuentes } from "../assets/themes/temas";

export function VisorImagen({ uri, onCerrar })
{
  const escala = useSharedValue(1);
  const base = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const bx = useSharedValue(0);
  const by = useSharedValue(0);

  const pellizco = Gesture.Pinch()
    .onUpdate((e) =>
    {
      escala.value = Math.min(5, Math.max(0.7, base.value * e.scale));
    })
    .onEnd(() =>
    {
      if (escala.value < 1)
      {
        escala.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        base.value = 1;
        bx.value = 0;
        by.value = 0;
      }
      else
      {
        base.value = escala.value;
      }
    });

  const arrastre = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) =>
    {
      if (base.value > 1)
      {
        tx.value = bx.value + e.translationX;
        ty.value = by.value + e.translationY;
      }
    })
    .onEnd(() =>
    {
      bx.value = tx.value;
      by.value = ty.value;
    });

  const dobleToque = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() =>
    {
      if (base.value > 1)
      {
        escala.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        base.value = 1;
        bx.value = 0;
        by.value = 0;
      }
      else
      {
        escala.value = withTiming(2.5);
        base.value = 2.5;
      }
    });

  const gesto = Gesture.Exclusive(dobleToque, Gesture.Simultaneous(pellizco, arrastre));

  const estiloImagen = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: escala.value }],
  }));

  return (
    <View style={estilos.fondo}>
      <GestureDetector gesture={gesto}>
        <Animated.View style={[estilos.lienzo, estiloImagen]}>
          <Image source={{ uri }} contentFit="contain" style={estilos.imagen} />
        </Animated.View>
      </GestureDetector>
      <Pressable onPress={onCerrar} hitSlop={12} style={({ pressed }) => [estilos.cerrar, pressed && { opacity: 0.6 }]}>
        <Text style={estilos.cerrarTxt}>✕</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)" },
  lienzo: { flex: 1 },
  imagen: { flex: 1 },
  cerrar:
  {
    position: "absolute",
    top: 48,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cerrarTxt: { color: "#FFF", fontSize: 17, fontFamily: fuentes.semibold },
});
