import Svg, { Path, Rect } from "react-native-svg";

export function Videollamada({ color = "#000", tamano = 22 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="6" width="13" height="12" rx="2.5" stroke={color} strokeWidth="1.7" />
      <Path d="m15.5 10.5 5-3v9l-5-3" stroke={color} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
