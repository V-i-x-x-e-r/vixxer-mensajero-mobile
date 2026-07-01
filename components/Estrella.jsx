import Svg, { Path } from "react-native-svg";

export function Estrella({ color, relleno, tamano = 14 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill={relleno || "none"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1.05 6.1L12 17.9l-5.45 2.9L7.6 13.8 3.2 9.5l6.1-.9z" />
    </Svg>
  );
}
