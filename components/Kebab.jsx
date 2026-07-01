import Svg, { Rect } from "react-native-svg";

export function Kebab({ color, tamano = 20 })
{
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill={color}>
      <Rect x="9.4" y="3.4" width="5.2" height="5.2" rx="2.1" />
      <Rect x="9.4" y="9.4" width="5.2" height="5.2" rx="2.1" />
      <Rect x="9.4" y="15.4" width="5.2" height="5.2" rx="2.1" />
    </Svg>
  );
}
