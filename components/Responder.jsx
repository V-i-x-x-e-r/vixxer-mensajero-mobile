import Svg, { Path } from "react-native-svg";

export function Responder({ color, tamano = 20 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 14L4 9l5-5" />
      <Path d="M4 9h11a5 5 0 0 1 5 5v5" />
    </Svg>
  );
}
