import { useEffect } from "react";
import { Pressable } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const AnimatedG = Animated.createAnimatedComponent(G);

const CENTROS = [50, 100, 150, 200, 250];
const PIVOTE = 8;
const BOLA_Y = 56;
const R = 24;

function Bola({ x, colorHilo, conHilo, central })
{
  return (
    <G>
      {conHilo ? <Line x1={x} y1={PIVOTE} x2={x} y2={BOLA_Y - R + 2} stroke={colorHilo} strokeWidth="1.6" opacity="0.72" /> : null}
      <Circle cx={x} cy={BOLA_Y} r={central ? R + 1 : R} fill={central ? "url(#vxMetalV)" : "url(#vxMetal)"} />
      <Ellipse cx={x - 8} cy={BOLA_Y - 10} rx="8" ry="5.2" fill="#FFFFFF" opacity={central ? 0.34 : 0.28} />
      {central ? (
        <G>
          <Path d={`M ${x - 11} ${BOLA_Y - 9} L ${x} ${BOLA_Y + 14} L ${x + 11} ${BOLA_Y - 9}`} fill="none" stroke="#080F14" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <Path d={`M ${x - 11} ${BOLA_Y - 11} L ${x} ${BOLA_Y + 12} L ${x + 11} ${BOLA_Y - 11}`} fill="none" stroke="#EAF0F8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      ) : null}
    </G>
  );
}

function Colgante({ pivote, angulo, colorHilo, central })
{
  const props = useAnimatedProps(() => ({ rotation: angulo.value }));
  return (
    <AnimatedG animatedProps={props} originX={pivote} originY={PIVOTE}>
      <Bola x={pivote} colorHilo={colorHilo} conHilo central={central} />
    </AnimatedG>
  );
}

export function LogoPendulo({ alto = 40, quieto = false, velocidad = 1450, colorBarra = "#5A6880", colorTexto = "#F2F5F9", titulo = false })
{
  const izq = useSharedValue(0);
  const der = useSharedValue(0);
  const vbAlto = titulo ? 132 : 88;
  const escala = alto / vbAlto;
  const ancho = 300 * escala;
  const colorHilo = colorBarra;

  function ciclo()
  {
    izq.value = withRepeat(withSequence(
      withTiming(-15, { duration: velocidad * 0.4, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: velocidad * 0.36, easing: Easing.in(Easing.cubic) }),
      withTiming(0, { duration: velocidad * 0.9 }),
    ), -1);
    der.value = withRepeat(withSequence(
      withTiming(0, { duration: velocidad * 0.9 }),
      withTiming(15, { duration: velocidad * 0.4, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: velocidad * 0.36, easing: Easing.in(Easing.cubic) }),
    ), -1);
  }

  useEffect(() =>
  {
    if (quieto)
    {
      izq.value = withRepeat(withSequence(
        withTiming(-4, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      ), -1);
      der.value = 0;
      return;
    }
    ciclo();
  }, [quieto, velocidad]);

  function golpear()
  {
    izq.value = withSequence(
      withTiming(-20, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 240, easing: Easing.in(Easing.cubic) }),
      withTiming(0, { duration: 320 }),
    );
    der.value = withDelay(440, withSequence(
      withTiming(20, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }),
    ));
    setTimeout(ciclo, 1400);
  }

  return (
    <Pressable onPress={golpear} hitSlop={8}>
      <Svg width={ancho} height={alto} viewBox={`0 0 300 ${vbAlto}`}>
        <Defs>
          <RadialGradient id="vxMetal" cx="37%" cy="29%" r="72%">
            <Stop offset="0%" stopColor="#EEF2F8" />
            <Stop offset="16%" stopColor="#AEB8C6" />
            <Stop offset="40%" stopColor="#5C6A80" />
            <Stop offset="66%" stopColor="#2C3849" />
            <Stop offset="100%" stopColor="#080F14" />
          </RadialGradient>
          <RadialGradient id="vxMetalV" cx="39%" cy="27%" r="76%">
            <Stop offset="0%" stopColor="#F5F8FC" />
            <Stop offset="18%" stopColor="#BAC4D2" />
            <Stop offset="42%" stopColor="#3B4A63" />
            <Stop offset="70%" stopColor="#1A2333" />
            <Stop offset="100%" stopColor="#05090E" />
          </RadialGradient>
        </Defs>

        {titulo ? <Rect x="28" y="4" width="244" height="8" rx="4" fill={colorBarra} opacity="0.9" /> : null}

        <Colgante pivote={CENTROS[0]} angulo={izq} colorHilo={colorHilo} />
        <Bola x={CENTROS[1]} colorHilo={colorHilo} conHilo />
        <Bola x={CENTROS[2]} colorHilo={colorHilo} conHilo central />
        <Bola x={CENTROS[3]} colorHilo={colorHilo} conHilo />
        <Colgante pivote={CENTROS[4]} angulo={der} colorHilo={colorHilo} />

        {titulo ? (
          <SvgText x="150" y="120" textAnchor="middle" fill={colorTexto} fontSize="26" fontWeight="300" letterSpacing="13">
            VIXXER
          </SvgText>
        ) : null}
      </Svg>
    </Pressable>
  );
}
