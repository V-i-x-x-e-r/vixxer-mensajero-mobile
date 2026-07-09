import { useEffect } from "react";
import { Pressable } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const AnimatedG = Animated.createAnimatedComponent(G);

function VCincelada({ cx, cy, r })
{
  const w = r * 0.56;
  const arriba = cy - r * 0.52;
  const abajo = cy + r * 0.52;
  const sw = r * 0.22;
  const d = `M ${cx - w} ${arriba} L ${cx} ${abajo} L ${cx + w} ${arriba}`;
  const dLuz = `M ${cx - w} ${arriba - 1} L ${cx} ${abajo - 1} L ${cx + w} ${arriba - 1}`;
  return (
    <G>
      <Path d={d} fill="none" stroke="#08090C" strokeWidth={sw + 2} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <Path d={dLuz} fill="none" stroke="#ECF0F6" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
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
    </Defs>
  );
}

const LOGIN_CX = [54, 102, 150, 198, 246];
const LOGIN_PIV = 30;
const LOGIN_BY = 152;

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
    const ancho = 300 * (alto / 258);
    return (
      <Pressable onPress={golpear} hitSlop={8}>
        <Svg width={ancho} height={alto} viewBox="0 0 300 258">
          <Gradientes />
          <Rect x="26" y="16" width="248" height="206" rx="48" fill="none" stroke="url(#vxMarco)" strokeWidth="13" strokeLinejoin="round" />
          <Rect x="26" y="16" width="248" height="206" rx="48" fill="none" stroke="#AEB7C3" strokeWidth="1.5" opacity="0.35" />
          <Path d="M70 224 q-18 6 -30 -2" stroke="url(#vxMarco)" strokeWidth="9" fill="none" strokeLinecap="round" />
          <Path d="M230 224 q18 6 30 -2" stroke="url(#vxMarco)" strokeWidth="9" fill="none" strokeLinecap="round" />
          <G stroke={colorBarra} strokeWidth="1.6" opacity="0.72">
            <Line x1={LOGIN_CX[1]} y1={LOGIN_PIV} x2={LOGIN_CX[1]} y2={LOGIN_BY - 24} />
            <Line x1={LOGIN_CX[2]} y1={LOGIN_PIV} x2={LOGIN_CX[2]} y2={LOGIN_BY - 25} />
            <Line x1={LOGIN_CX[3]} y1={LOGIN_PIV} x2={LOGIN_CX[3]} y2={LOGIN_BY - 24} />
          </G>
          <Bola x={LOGIN_CX[1]} y={LOGIN_BY} r={24} />
          <Bola x={LOGIN_CX[2]} y={LOGIN_BY} r={25} central />
          <Bola x={LOGIN_CX[3]} y={LOGIN_BY} r={24} />
          <Colgante x={LOGIN_CX[0]} pivoteY={LOGIN_PIV} ballY={LOGIN_BY} r={24} angulo={izq} colorHilo={colorBarra} />
          <Colgante x={LOGIN_CX[4]} pivoteY={LOGIN_PIV} ballY={LOGIN_BY} r={24} angulo={der} colorHilo={colorBarra} />
          <SvgText x="150" y="208" textAnchor="middle" fill={colorTexto} fontSize="30" fontWeight="300" letterSpacing="15">VIXXER</SvgText>
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
