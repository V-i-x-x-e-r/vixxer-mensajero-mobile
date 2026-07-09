import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from "react-native-svg";
import Animated, { Easing, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

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
  return <AnimatedCircle animatedProps={props} r={r} fill={i === 2 ? "url(#spC)" : "url(#sp)"} />;
}

export function SplashOrbita({ onDone, fondo = "#0C1015" })
{
  const t = useSharedValue(0);
  const vis = useSharedValue(1);
  const vopa = useSharedValue(0);

  useEffect(() =>
  {
    t.value = withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) });
    vopa.value = withDelay(1050, withTiming(1, { duration: 380 }));
    const id = setTimeout(() =>
    {
      vis.value = withTiming(0, { duration: 420 }, (fin) =>
      {
        if (fin)
        {
          runOnJS(onDone)();
        }
      });
    }, 1950);
    return () => clearTimeout(id);
  }, []);

  const estiloCont = useAnimatedStyle(() => ({ opacity: vis.value }));
  const propsV = useAnimatedProps(() => ({ opacity: vopa.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fondo }, estilos.centro, estiloCont]} pointerEvents="none">
      <Svg width={220} height={220} viewBox="0 0 300 300">
        <Defs>
          <RadialGradient id="sp" cx="36%" cy="28%" r="74%">
            <Stop offset="0%" stopColor="#DBE0E7" />
            <Stop offset="12%" stopColor="#8C929B" />
            <Stop offset="34%" stopColor="#474D55" />
            <Stop offset="63%" stopColor="#22262B" />
            <Stop offset="100%" stopColor="#080A0D" />
          </RadialGradient>
          <RadialGradient id="spC" cx="38%" cy="26%" r="76%">
            <Stop offset="0%" stopColor="#E7ECF2" />
            <Stop offset="13%" stopColor="#969CA5" />
            <Stop offset="36%" stopColor="#3E444C" />
            <Stop offset="66%" stopColor="#1B1F24" />
            <Stop offset="100%" stopColor="#06080A" />
          </RadialGradient>
        </Defs>
        <Orbe i={0} t={t} r={19} />
        <Orbe i={1} t={t} r={19} />
        <Orbe i={3} t={t} r={19} />
        <Orbe i={4} t={t} r={19} />
        <Orbe i={2} t={t} r={20} />
        <AnimatedG animatedProps={propsV}>
          <Path d={`M ${CX - 12.4} ${CY - 12} L ${CX} ${CY + 14.4} L ${CX + 12.4} ${CY - 12}`} fill="none" stroke="#050609" strokeWidth="8.4" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={`M ${CX - 12.4} ${CY - 12} L ${CX} ${CY + 12.4} L ${CX} ${CY + 8} L ${CX - 4.4} ${CY - 12} Z`} fill="#F1F4F9" />
          <Path d={`M ${CX + 12.4} ${CY - 12} L ${CX} ${CY + 12.4} L ${CX} ${CY + 8} L ${CX + 4.4} ${CY - 12} Z`} fill="#9AA3AF" />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: "center", justifyContent: "center", zIndex: 100 },
});
