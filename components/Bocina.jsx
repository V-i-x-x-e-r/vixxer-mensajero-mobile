import Svg, { Path } from "react-native-svg";

export function Bocina({ color = "#000", tamano = 22 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5 6.5 8.5H3.5v7h3L11 19V5Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <Path d="M15 9a4.2 4.2 0 0 1 0 6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Path d="M17.8 6.5a8 8 0 0 1 0 11" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}
