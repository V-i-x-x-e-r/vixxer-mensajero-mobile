import { useEffect } from "react";
import { Pressable } from "react-native";
import Svg, { Defs, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const AnimatedG = Animated.createAnimatedComponent(G);

function PenduloAnimado({ pivote, angulo, children })
{
  const props = useAnimatedProps(() => ({
    rotation: angulo.value,
  }));

  return (
    <AnimatedG animatedProps={props} originX={pivote} originY={24}>
      {children}
    </AnimatedG>
  );
}

function Bola({ x, central })
{
  return (
    <G>
      <Line x1={x} y1="24" x2={x} y2="123" stroke="#64748B" strokeWidth="1.4" opacity="0.72" />
      <Path
        d={`M ${x - 18} 145 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0`}
        fill={central ? "url(#metalCentro)" : "url(#metalBola)"}
      />
      <Path
        d={`M ${x - 11} 135 a10 8 0 0 1 13 -7`}
        stroke="#F8FAFC"
        strokeWidth="2"
        opacity="0.24"
        fill="none"
        strokeLinecap="round"
      />
      {central ? (
        <Path d={`M ${x - 10} 134 L ${x} 156 L ${x + 10} 134 L ${x + 4} 134 L ${x} 144 L ${x - 4} 134 Z`} fill="#080C12" opacity="0.92" />
      ) : null}
    </G>
  );
}

export function LogoPendulo({ alto = 40, quieto = false, velocidad = 1450, colorBarra = "#94A3B8", titulo = false })
{
  const izq = useSharedValue(0);
  const der = useSharedValue(0);
  const escala = alto / 210;
  const ancho = titulo ? 330 * escala : 300 * escala;

  function ciclo()
  {
    izq.value = withRepeat(withSequence(
      withTiming(-24, { duration: velocidad * 0.42, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: velocidad * 0.38, easing: Easing.in(Easing.cubic) }),
      withTiming(0, { duration: velocidad * 0.8 }),
    ), -1);
    der.value = withRepeat(withSequence(
      withTiming(0, { duration: velocidad * 0.8 }),
      withTiming(24, { duration: velocidad * 0.42, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: velocidad * 0.38, easing: Easing.in(Easing.cubic) }),
    ), -1);
  }

  useEffect(() =>
  {
    if (quieto)
    {
      izq.value = withRepeat(withSequence(
        withTiming(-5, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ), -1);
      der.value = 0;
      return;
    }
    ciclo();
  }, [quieto, velocidad]);

  function golpear()
  {
    izq.value = withSequence(
      withTiming(-30, { duration: 280, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 230, easing: Easing.in(Easing.cubic) }),
      withTiming(0, { duration: 300 }),
    );
    der.value = withDelay(420, withSequence(
      withTiming(30, { duration: 280, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }),
    ));
    setTimeout(ciclo, 1300);
  }

  return (
    <Pressable onPress={golpear} hitSlop={8}>
      <Svg width={ancho} height={alto} viewBox={titulo ? "0 0 330 210" : "30 0 300 180"}>
        <Defs>
          <RadialGradient id="metalBola" cx="35%" cy="28%" r="72%">
            <Stop offset="0%" stopColor="#EAF0F8" />
            <Stop offset="20%" stopColor="#8B96A8" />
            <Stop offset="58%" stopColor="#293241" />
            <Stop offset="100%" stopColor="#05080D" />
          </RadialGradient>
          <RadialGradient id="metalCentro" cx="38%" cy="26%" r="76%">
            <Stop offset="0%" stopColor="#F7FAFC" />
            <Stop offset="25%" stopColor="#A9B3C2" />
            <Stop offset="60%" stopColor="#303B4C" />
            <Stop offset="100%" stopColor="#070A10" />
          </RadialGradient>
        </Defs>

        {titulo ? (
          <Rect x="28" y="8" width="274" height="170" rx="26" fill="none" stroke="#293241" strokeWidth="7" />
        ) : null}
        <Line x1="58" y1="24" x2="302" y2="24" stroke={colorBarra} strokeWidth="7" strokeLinecap="round" opacity="0.88" />
        <Line x1="62" y1="28" x2="298" y2="28" stroke="#0B1018" strokeWidth="3" strokeLinecap="round" opacity="0.62" />

        <PenduloAnimado pivote={90} angulo={izq}>
          <Bola x={90} />
        </PenduloAnimado>
        <Bola x={135} />
        <Bola x={180} central />
        <Bola x={225} />
        <PenduloAnimado pivote={270} angulo={der}>
          <Bola x={270} />
        </PenduloAnimado>

        {titulo ? (
          <SvgText
            x="165"
            y="204"
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="28"
            fontWeight="300"
            letterSpacing="12"
          >
            VIXXER
          </SvgText>
        ) : null}
      </Svg>
    </Pressable>
  );
}
