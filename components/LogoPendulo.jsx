import { useEffect } from "react";
import { Pressable } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const AnimatedG = Animated.createAnimatedComponent(G);

function VCincelada({ cx, cy, r })
{
  const w = r * 0.52;
  const arriba = cy - r * 0.48;
  const abajo = cy + r * 0.62;
  const t = r * 0.34;
  const tv = r * 0.4;
  const izq = `M ${cx - w} ${arriba} L ${cx} ${abajo} L ${cx} ${abajo - tv} L ${cx - w + t} ${arriba} Z`;
  const der = `M ${cx + w} ${arriba} L ${cx} ${abajo} L ${cx} ${abajo - tv} L ${cx + w - t} ${arriba} Z`;
  const linea = `M ${cx - w} ${arriba} L ${cx} ${abajo} L ${cx + w} ${arriba}`;
  return (
    <G>
      <Path d={linea} fill="none" stroke="#08090C" strokeWidth={Math.max(1, r * 0.08)} strokeLinejoin="miter" opacity={0.7} />
      <Path d={izq} fill="#EEF2F7" />
      <Path d={der} fill="#B4BCC7" />
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

const LOGIN_CX = [50, 100, 150, 200, 250];
const LOGIN_PIV = 28;
const LOGIN_BY = 150;

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
    const ancho = 300 * (alto / 250);
    return (
      <Pressable onPress={golpear} hitSlop={8}>
        <Svg width={ancho} height={alto} viewBox="0 0 300 250">
          <Gradientes />
          <Rect x="22" y="16" width="256" height="214" rx="54" fill="none" stroke="url(#vxMarco)" strokeWidth="12" strokeLinejoin="round" />
          <Rect x="22" y="16" width="256" height="214" rx="54" fill="none" stroke="#AEB7C3" strokeWidth="1.4" opacity="0.32" />
          <Path d="M74 230 q-20 7 -32 -2" stroke="url(#vxMarco)" strokeWidth="8" fill="none" strokeLinecap="round" />
          <Path d="M226 230 q20 7 32 -2" stroke="url(#vxMarco)" strokeWidth="8" fill="none" strokeLinecap="round" />
          <G stroke={colorBarra} strokeWidth="1.5" opacity="0.7">
            <Line x1={LOGIN_CX[1]} y1={LOGIN_PIV} x2={LOGIN_CX[1]} y2={LOGIN_BY - 20} />
            <Line x1={LOGIN_CX[2]} y1={LOGIN_PIV} x2={LOGIN_CX[2]} y2={LOGIN_BY - 21} />
            <Line x1={LOGIN_CX[3]} y1={LOGIN_PIV} x2={LOGIN_CX[3]} y2={LOGIN_BY - 20} />
          </G>
          <Bola x={LOGIN_CX[1]} y={LOGIN_BY} r={20} />
          <Bola x={LOGIN_CX[2]} y={LOGIN_BY} r={21} central />
          <Bola x={LOGIN_CX[3]} y={LOGIN_BY} r={20} />
          <Colgante x={LOGIN_CX[0]} pivoteY={LOGIN_PIV} ballY={LOGIN_BY} r={20} angulo={izq} colorHilo={colorBarra} />
          <Colgante x={LOGIN_CX[4]} pivoteY={LOGIN_PIV} ballY={LOGIN_BY} r={20} angulo={der} colorHilo={colorBarra} />
          <SvgText x="156" y="208" textAnchor="middle" fill={colorTexto} fontSize="26" fontWeight="300" letterSpacing="12">VIXXER</SvgText>
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
