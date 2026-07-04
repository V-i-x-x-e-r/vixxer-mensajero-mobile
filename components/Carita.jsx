import Svg, { Circle, Path } from "react-native-svg";

export function Carita({ color = "#000", tamano = 22 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="9" cy="10" r="1.2" fill={color} />
      <Circle cx="15" cy="10" r="1.2" fill={color} />
      <Path d="M8.5 14.5c.9 1.2 2.1 1.9 3.5 1.9s2.6-.7 3.5-1.9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}
