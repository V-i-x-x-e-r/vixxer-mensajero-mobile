import { useEffect } from "react";
import { Pressable, View, Text } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const AnimatedG = Animated.createAnimatedComponent(G);

function VCincelada({ cx, cy, r })
{
  const w = r * 0.7;
  const top = cy - r * 0.67;
  const bot = cy + r * 0.82;
  const iw = r * 0.37;
  const ib = cy + r * 0.19;
  const banda = `M ${cx - w} ${top} L ${cx} ${bot} L ${cx + w} ${top} L ${cx + iw} ${top} L ${cx} ${ib} L ${cx - iw} ${top} Z`;
  return (
    <Path d={banda} fill="url(#vxVluz)" stroke="#060709" strokeWidth={Math.max(1, r * 0.09)} strokeLinejoin="round" strokeLinecap="round" />
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
      <Line x1={x} y1={pivoteY} x2={x} y2={ballY} stroke={colorHilo} strokeWidth="1.5" opacity="0.8" />
      <Bola x={x} y={ballY} r={r} />
    </AnimatedG>
  );
}

function Gradientes()
{
  return (
    <Defs>
      <RadialGradient id="vxIron" cx="36%" cy="28%" r="74%">
        <Stop offset="0%" stopColor="#EAF0F8" />
        <Stop offset="14%" stopColor="#9BA3AE" />
        <Stop offset="38%" stopColor="#525A66" />
        <Stop offset="66%" stopColor="#252A31" />
        <Stop offset="100%" stopColor="#090B0F" />
      </RadialGradient>
      <RadialGradient id="vxIronC" cx="38%" cy="26%" r="76%">
        <Stop offset="0%" stopColor="#F2F6FB" />
        <Stop offset="15%" stopColor="#A6AEB9" />
        <Stop offset="40%" stopColor="#474E59" />
        <Stop offset="68%" stopColor="#1E232A" />
        <Stop offset="100%" stopColor="#07090C" />
      </RadialGradient>
      <LinearGradient id="vxVluz" x1="0" y1="0" x2="1" y2="0.5">
        <Stop offset="0%" stopColor="#F4F7FB" />
        <Stop offset="55%" stopColor="#C2CAD5" />
        <Stop offset="100%" stopColor="#828B98" />
      </LinearGradient>
      <LinearGradient id="vxMarco" x1="0" y1="0" x2="0.3" y2="1">
        <Stop offset="0%" stopColor="#9AA3B2" />
        <Stop offset="22%" stopColor="#606877" />
        <Stop offset="60%" stopColor="#2C333D" />
        <Stop offset="100%" stopColor="#0C1017" />
      </LinearGradient>
    </Defs>
  );
}

const LOGIN_CX = [58, 104, 150, 196, 242];
const LOGIN_PIV = 21;
const LOGIN_BY = 130;

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
        <View style={{ width: ancho, height: alto }}>
          <Svg width={ancho} height={alto} viewBox="0 0 300 264">
            <Gradientes />
            <Path d="M76 236 q-11 13 -20 12" stroke="#5E6774" strokeWidth="8" fill="none" strokeLinecap="round" />
            <Path d="M224 236 q11 13 20 12" stroke="#5E6774" strokeWidth="8" fill="none" strokeLinecap="round" />
            <Rect x="24" y="14" width="252" height="226" rx="52" fill="none" stroke="url(#vxMarco)" strokeWidth="13" strokeLinejoin="round" />
            <Rect x="30.5" y="20.5" width="239" height="213" rx="46" fill="none" stroke="#B4BEC9" strokeWidth="1.3" opacity="0.5" />
            <G stroke={colorBarra} strokeWidth="1.4" opacity="0.8">
              <Line x1={LOGIN_CX[1]} y1={LOGIN_PIV} x2={LOGIN_CX[1]} y2={LOGIN_BY} />
              <Line x1={LOGIN_CX[2]} y1={LOGIN_PIV} x2={LOGIN_CX[2]} y2={LOGIN_BY} />
              <Line x1={LOGIN_CX[3]} y1={LOGIN_PIV} x2={LOGIN_CX[3]} y2={LOGIN_BY} />
            </G>
            <Bola x={LOGIN_CX[1]} y={LOGIN_BY} r={19} />
            <Bola x={LOGIN_CX[2]} y={LOGIN_BY} r={20} central />
            <Bola x={LOGIN_CX[3]} y={LOGIN_BY} r={19} />
            <Colgante x={LOGIN_CX[0]} pivoteY={LOGIN_PIV} ballY={LOGIN_BY} r={19} angulo={izq} colorHilo={colorBarra} />
            <Colgante x={LOGIN_CX[4]} pivoteY={LOGIN_PIV} ballY={LOGIN_BY} r={19} angulo={der} colorHilo={colorBarra} />
          </Svg>
          <Text
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: alto * 0.727,
              textAlign: "center",
              color: colorTexto,
              fontSize: alto * 0.092,
              letterSpacing: alto * 0.045,
              fontWeight: "400",
            }}
          >
            VIXXER
          </Text>
        </View>
      </Pressable>
    );
  }

  if (variante === "radar")
  {
    const cx = [20, 40, 60, 80, 100];
    return (
      <Svg width={alto} height={alto} viewBox="0 0 120 120">
        <Gradientes />
        <Circle cx="60" cy="60" r="55" fill="none" stroke={colorBarra} strokeWidth="2.4" opacity="0.55" />
        <Circle cx="60" cy="60" r="55" fill="none" stroke="#AEB7C3" strokeWidth="1" opacity="0.22" />
        <Bola x={cx[0]} y={60} r={10.5} />
        <Bola x={cx[1]} y={60} r={10.5} />
        <Bola x={cx[2]} y={60} r={11} central />
        <Bola x={cx[3]} y={60} r={10.5} />
        <Bola x={cx[4]} y={60} r={10.5} />
      </Svg>
    );
  }

  const cx = [46, 98, 150, 202, 254];
  const ancho = 300 * (alto / 58);
  return (
    <Svg width={ancho} height={alto} viewBox="0 0 300 58">
      <Gradientes />
      <Bola x={cx[0]} y={29} r={22} />
      <Bola x={cx[1]} y={29} r={22} />
      <Bola x={cx[3]} y={29} r={22} />
      <Bola x={cx[4]} y={29} r={22} />
      <Bola x={cx[2]} y={29} r={27} central />
    </Svg>
  );
}
