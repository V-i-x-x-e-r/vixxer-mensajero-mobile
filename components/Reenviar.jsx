import Svg, { Path } from "react-native-svg";

export function Reenviar({ color, tamano = 20 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 14l5-5-5-5" />
      <Path d="M20 9H9a5 5 0 0 0-5 5v5" />
    </Svg>
  );
}
