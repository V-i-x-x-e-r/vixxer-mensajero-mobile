import { Pressable } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useTema } from "./tema";

function Sol({ color })
{
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="4.2" />
      <Line x1="12" y1="1.5" x2="12" y2="4" />
      <Line x1="12" y1="20" x2="12" y2="22.5" />
      <Line x1="3.6" y1="3.6" x2="5.4" y2="5.4" />
      <Line x1="18.6" y1="18.6" x2="20.4" y2="20.4" />
      <Line x1="1.5" y1="12" x2="4" y2="12" />
      <Line x1="20" y1="12" x2="22.5" y2="12" />
      <Line x1="3.6" y1="20.4" x2="5.4" y2="18.6" />
      <Line x1="18.6" y1="5.4" x2="20.4" y2="3.6" />
    </Svg>
  );
}

function Luna({ color })
{
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}

export function BotonTema()
{
  const { oscuro, colores, alternar } = useTema();

  return (
    <Pressable
      onPress={alternar}
      hitSlop={8}
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: colores.borde,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {oscuro ? <Sol color={colores.texto} /> : <Luna color={colores.texto} />}
    </Pressable>
  );
}
