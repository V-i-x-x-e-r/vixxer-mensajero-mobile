import { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

export function AnilloProgreso({ progreso, tamano = 44, grosor = 3.5, color = "#fff" })
{
  const giro = useRef(new Animated.Value(0)).current;
  const indeterminado = progreso == null;
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;

  useEffect(() =>
  {
    if (!indeterminado)
    {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [indeterminado]);

  const rotacion = giro.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const visible = indeterminado ? circunferencia * 0.72 : circunferencia * (1 - Math.min(1, Math.max(0, progreso)));

  return (
    <View style={[estilos.fondo, { width: tamano + 12, height: tamano + 12, borderRadius: (tamano + 12) / 2 }]}>
      <Animated.View style={indeterminado ? { transform: [{ rotate: rotacion }] } : { transform: [{ rotate: "-90deg" }] }}>
        <Svg width={tamano} height={tamano}>
          <Circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={grosor}
            fill="none"
          />
          <Circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            stroke={color}
            strokeWidth={grosor}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={visible}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
});
