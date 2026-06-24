import Svg, { Circle, Path } from "react-native-svg";

export function Reloj({ color, tamano = 12 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </Svg>
  );
}
