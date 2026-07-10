import { useEffect } from "react";
import { StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Svg, { Circle, G } from "react-native-svg";
import Animated, { Easing, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { Gradientes, VCincelada } from "./LogoPendulo";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

const CX = 150;
const CY = 150;
const R = 76;
const SP = 50;

function Orbe({ i, t, r })
{
  const props = useAnimatedProps(() =>
  {
    const conv = 1 - Math.pow(1 - t.value, 3);
    const ang = ((i * 72) + 700 * (1 - Math.pow(1 - t.value, 2))) * Math.PI / 180;
    const ox = CX + R * Math.cos(ang);
    const oy = CY + R * Math.sin(ang);
    const lx = CX + (i - 2) * SP;
    return { cx: ox + (lx - ox) * conv, cy: oy + (CY - oy) * conv };
  });
  return <AnimatedCircle animatedProps={props} r={r} fill={i === 2 ? "url(#vxIronC)" : "url(#vxIron)"} />;
}

export function SplashOrbita({ onDone, fondo = "#0C1015" })
{
  const t = useSharedValue(0);
  const vis = useSharedValue(1);
  const vopa = useSharedValue(0);

  useEffect(() =>
  {
    SplashScreen.hideAsync().catch(() => {});
    t.value = withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.cubic) });
    vopa.value = withDelay(1700, withTiming(1, { duration: 520 }));
    const id = setTimeout(() =>
    {
      vis.value = withTiming(0, { duration: 520 }, (fin) =>
      {
        if (fin)
        {
          runOnJS(onDone)();
        }
      });
    }, 2900);
    return () => clearTimeout(id);
  }, []);

  const estiloCont = useAnimatedStyle(() => ({ opacity: vis.value }));
  const propsV = useAnimatedProps(() => ({ opacity: vopa.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fondo }, estilos.centro, estiloCont]} pointerEvents="none">
      <Svg width={220} height={220} viewBox="0 0 300 300">
        <Gradientes />
        <Orbe i={0} t={t} r={19} />
        <Orbe i={1} t={t} r={19} />
        <Orbe i={3} t={t} r={19} />
        <Orbe i={4} t={t} r={19} />
        <Orbe i={2} t={t} r={20} />
        <AnimatedG animatedProps={propsV}>
          <VCincelada cx={CX} cy={CY} r={20} />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: "center", justifyContent: "center", zIndex: 100 },
});
