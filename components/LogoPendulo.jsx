import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";

const COLORES_BOLAS = ["#35D487", "#65A7FF", "#FFD166", "#65A7FF", "#35D487"];

function Pendulo({ angulo, x, largo, bola, color, colorHilo })
{
  const estilo = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angulo ? angulo.value : 0}deg` }],
  }));

  return (
    <Animated.View style={[estilos.brazo, { left: x, height: largo + bola, transformOrigin: "top center" }, estilo]}>
      <View style={[estilos.hilo, { height: largo, backgroundColor: colorHilo }]} />
      <View style={{ width: bola, height: bola, borderRadius: bola / 2, backgroundColor: color, marginLeft: -bola / 2 + 0.75 }} />
    </Animated.View>
  );
}

export function LogoPendulo({ alto = 28, velocidad = 900, quieto = false, colorBarra = "#8E8E93" })
{
  const izq = useSharedValue(0);
  const der = useSharedValue(0);
  const bola = Math.round(alto * 0.24);
  const largo = alto - bola - 4;
  const paso = bola + 1;
  const ancho = paso * 4 + bola + 6;

  useEffect(() =>
  {
    if (quieto)
    {
      izq.value = withRepeat(withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ), -1);
      return;
    }
    const fuera = { duration: velocidad, easing: Easing.out(Easing.sin) };
    const dentro = { duration: velocidad, easing: Easing.in(Easing.sin) };
    izq.value = withRepeat(withSequence(
      withTiming(-42, fuera),
      withTiming(0, dentro),
      withTiming(0, { duration: velocidad * 2 }),
    ), -1);
    der.value = withRepeat(withSequence(
      withTiming(0, { duration: velocidad * 2 }),
      withTiming(42, fuera),
      withTiming(0, dentro),
    ), -1);
  }, [quieto, velocidad]);

  return (
    <View style={{ width: ancho, height: alto }}>
      <View style={[estilos.barra, { backgroundColor: colorBarra }]} />
      {COLORES_BOLAS.map((c, i) => (
        <Pendulo
          key={i}
          angulo={i === 0 ? izq : i === 4 ? der : null}
          x={3 + bola / 2 + i * paso}
          largo={largo}
          bola={bola}
          color={c}
          colorHilo={colorBarra}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { position: "absolute", top: 0, left: 0, right: 0, height: 2.5, borderRadius: 2 },
  brazo: { position: "absolute", top: 2, width: 1.5, alignItems: "center" },
  hilo: { width: 1.5 },
});
