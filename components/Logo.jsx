import { View } from "react-native";
import { barras } from "../assets/themes/temas";

export function Logo({ alto = 28 })
{
  const ancho = Math.round(alto * 0.27);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", height: alto, gap: Math.round(ancho * 0.7) }}>
      {barras.map((color) => (
        <View
          key={color}
          style={{ width: ancho, height: alto, borderRadius: ancho / 2, backgroundColor: color }}
        />
      ))}
    </View>
  );
}
