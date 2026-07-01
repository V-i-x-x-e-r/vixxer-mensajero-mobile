import Svg, { Path, Rect } from "react-native-svg";

export function Archivar({ color, tamano = 20 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="3" width="20" height="5" rx="1" />
      <Path d="M4 8v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8" />
      <Path d="M10 12h4" />
    </Svg>
  );
}
