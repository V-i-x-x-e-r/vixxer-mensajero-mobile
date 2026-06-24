import Svg, { Path } from "react-native-svg";

export function Visto({ color, leido = false, tamano = 14 })
{
  if (leido)
  {
    return (
      <Svg width={tamano + 5} height={tamano} viewBox="0 0 21 16" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 8.5l3.5 3.5L12 3" />
        <Path d="M8.5 12l0.8 0.8L20 3" />
      </Svg>
    );
  }

  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 8.5l4 4 8-9" />
    </Svg>
  );
}
