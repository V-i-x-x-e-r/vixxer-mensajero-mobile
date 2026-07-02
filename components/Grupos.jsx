import Svg, { Path, Circle } from "react-native-svg";

export function Grupos({ color, tamano = 24 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="6.5" r="2.6" />
      <Circle cx="5" cy="9.5" r="2.2" />
      <Circle cx="19" cy="9.5" r="2.2" />
      <Path d="M8 20v-1.5a4 4 0 0 1 8 0V20" />
      <Path d="M2 20v-1a3.4 3.4 0 0 1 4.2-3.3" />
      <Path d="M22 20v-1a3.4 3.4 0 0 0-4.2-3.3" />
    </Svg>
  );
}
