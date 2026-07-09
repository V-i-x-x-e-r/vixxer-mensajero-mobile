import { useEffect } from "react";
import { Pressable } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const AnimatedG = Animated.createAnimatedComponent(G);

function VCincelada({ cx, cy, r })
{
  const w = r * 0.5;
  const arriba = cy - r * 0.4;
  const abajo = cy + r * 0.72;
  const d = `M ${cx - w} ${arriba} L ${cx} ${abajo} L ${cx + w} ${arriba}`;
  return (
    <G>
      <Path d={d} fill="none" stroke="#05070A" strokeWidth={Math.max(1.6, r * 0.24)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} fill="none" stroke="#AEB7C3" strokeWidth={Math.max(0.8, r * 0.085)} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </G>
  );
}

function Bola({ x, y, r, central })
{
  const s = r / 24;
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={central ? "url(#vxIronC)" : "url(#vxIron)"} />
      <Ellipse cx={x - 8 * s} cy={y - 10 * s} rx={8 * s} ry={5 * s} fill="#FFFFFF" opacity={central ? 0.3 : 0.26} />
      {central ? <VCincelada cx={x} cy={y} r={r} /> : null}
    </G>
  );
}

function Colgante({ x, pivoteY, ballY, r, angulo, colorHilo })
{
  const props = useAnimatedProps(() => ({ rotation: angulo.value }));
  return (
    <AnimatedG animatedProps={props} originX={x} originY={pivoteY}>
      <Line x1={x} y1={pivoteY} x2={x} y2={ballY - r} stroke={colorHilo} strokeWidth="1.6" opacity="0.72" />
      <Bola x={x} y={ballY} r={r} />
    </AnimatedG>
  );
}

function Gradientes()
{
  return (
    <Defs>
      <RadialGradient id="vxIron" cx="36%" cy="28%" r="74%">
        <Stop offset="0%" stopColor="#DBE0E7" />
        <Stop offset="12%" stopColor="#8C929B" />
        <Stop offset="34%" stopColor="#474D55" />
        <Stop offset="63%" stopColor="#22262B" />
        <Stop offset="100%" stopColor="#080A0D" />
      </RadialGradient>
      <RadialGradient id="vxIronC" cx="38%" cy="26%" r="76%">
        <Stop offset="0%" stopColor="#E7ECF2" />
        <Stop offset="13%" stopColor="#969CA5" />
        <Stop offset="36%" stopColor="#3E444C" />
        <Stop offset="66%" stopColor="#1B1F24" />
        <Stop offset="100%" stopColor="#06080A" />
      </RadialGradient>
      <LinearGradient id="vxMarco" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#8891A0" />
        <Stop offset="18%" stopColor="#5A6270" />
        <Stop offset="55%" stopColor="#2C333D" />
        <Stop offset="100%" stopColor="#0E1319" />
      </LinearGradient>
      <LinearGradient id="vxBase" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#7B8494" />
        <Stop offset="100%" stopColor="#333C48" />
      </LinearGradient>
    </Defs>
  );
}

const LOGIN_CX = [50, 100, 150, 200, 250];
const LOGIN_PIV = 28;
const LOGIN_BY = 117;

export function LogoPendulo({ variante = "fila", alto = 40, quieto = false, velocidad = 1500, colorBarra = "#9AA2AD", colorTexto = "#EEF2F7" })
{
  const izq = useSharedValue(0);
  const der = useSharedValue(0);
  const esLogin = variante === "login";

  function ciclo()
  {
    const a = velocidad * 0.3;
    const b = velocidad * 0.28;
    izq.value = withRepeat(withSequence(
      withTiming(-12, { duration: a, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: b, easing: Easing.in(Easing.cubic) }),
      withTiming(0, { duration: a + b }),
    ), -1);
    der.value = withRepeat(withSequence(
      withTiming(0, { duration: a + b }),
      withTiming(12, { duration: a, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: b, easing: Easing.in(Easing.cubic) }),
    ), -1);
  }

  useEffect(() =>
  {
    if (!esLogin || quieto)
    {
      izq.value = 0;
      der.value = 0;
      return;
    }
    ciclo();
  }, [esLogin, quieto, velocidad]);

  function golpear()
  {
    if (!esLogin)
    {
      return;
    }
    izq.value = withSequence(
      withTiming(-19, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 240, easing: Easing.in(Easing.cubic) }),
      withTiming(0, { duration: 300 }),
    );
    der.value = withDelay(430, withSequence(
      withTiming(19, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }),
    ));
    setTimeout(ciclo, 1400);
  }

  if (esLogin)
  {
    const ancho = 300 * (alto / 264);
    return (
      <Pressable onPress={golpear} hitSlop={8}>
        <Svg width={ancho} height={alto} viewBox="0 0 300 264">
          <Gradientes />
          <Rect x="24" y="14" width="252" height="226" rx="54" fill="none" stroke="url(#vxMarco)" strokeWidth="11" strokeLinejoin="round" />
          <Rect x="24" y="14" width="252" height="226" rx="54" fill="none" stroke="#AEB7C3" strokeWidth="1.3" opacity="0.3" />
          <Rect x="52" y="198" width="196" height="16" rx="8" fill="#0A0E13" />
          <Rect x="50" y="190" width="200" height="13" rx="6.5" fill="url(#vxBase)" />
          <Rect x="54" y="191" width="192" height="2" rx="1" fill="#C3CCD8" opacity="0.5" />
          <Path d="M70 226 q-16 6 -26 -2" stroke="url(#vxMarco)" strokeWidth="7" fill="none" strokeLinecap="round" />
          <Path d="M230 226 q16 6 26 -2" stroke="url(#vxMarco)" strokeWidth="7" fill="none" strokeLinecap="round" />
          <G stroke={colorBarra} strokeWidth="1.5" opacity="0.72">
            <Line x1={LOGIN_CX[1]} y1={LOGIN_PIV} x2={LOGIN_CX[1]} y2={LOGIN_BY - 19} />
            <Line x1={LOGIN_CX[2]} y1={LOGIN_PIV} x2={LOGIN_CX[2]} y2={LOGIN_BY - 20} />
            <Line x1={LOGIN_CX[3]} y1={LOGIN_PIV} x2={LOGIN_CX[3]} y2={LOGIN_BY - 19} />
          </G>
          <Bola x={LOGIN_CX[1]} y={LOGIN_BY} r={19} />
          <Bola x={LOGIN_CX[2]} y={LOGIN_BY} r={20} central />
          <Bola x={LOGIN_CX[3]} y={LOGIN_BY} r={19} />
          <Colgante x={LOGIN_CX[0]} pivoteY={LOGIN_PIV} ballY={LOGIN_BY} r={19} angulo={izq} colorHilo={colorBarra} />
          <Colgante x={LOGIN_CX[4]} pivoteY={LOGIN_PIV} ballY={LOGIN_BY} r={19} angulo={der} colorHilo={colorBarra} />
          <SvgText x="156" y="170" textAnchor="middle" fill={colorTexto} fontSize="23" fontWeight="300" letterSpacing="11">VIXXER</SvgText>
        </Svg>
      </Pressable>
    );
  }

  if (variante === "radar")
  {
    const cx = [30, 45, 60, 75, 90];
    return (
      <Svg width={alto} height={alto} viewBox="0 0 120 120">
        <Gradientes />
        <Circle cx="60" cy="60" r="54" fill="none" stroke={colorBarra} strokeWidth="2" opacity="0.5" />
        <Circle cx="60" cy="60" r="54" fill="none" stroke="#AEB7C3" strokeWidth="1" opacity="0.22" />
        <Bola x={cx[0]} y={60} r={9} />
        <Bola x={cx[1]} y={60} r={9} />
        <Bola x={cx[2]} y={60} r={9.5} central />
        <Bola x={cx[3]} y={60} r={9} />
        <Bola x={cx[4]} y={60} r={9} />
      </Svg>
    );
  }

  const cx = [42, 96, 150, 204, 258];
  const ancho = 300 * (alto / 76);
  return (
    <Svg width={ancho} height={alto} viewBox="0 0 300 76">
      <Gradientes />
      <Bola x={cx[0]} y={38} r={24} />
      <Bola x={cx[1]} y={38} r={24} />
      <Bola x={cx[2]} y={38} r={25} central />
      <Bola x={cx[3]} y={38} r={24} />
      <Bola x={cx[4]} y={38} r={24} />
    </Svg>
  );
}
