import { View, Text } from "react-native";
import { fuentes } from "../assets/themes/temas";

export function Badge({ cantidad, estilo })
{
  if (!cantidad || cantidad <= 0)
  {
    return null;
  }

  const texto = cantidad > 9 ? "9+" : String(cantidad);

  return (
    <View
      style={[
        {
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          paddingHorizontal: 5,
          backgroundColor: "#FF3B30",
          alignItems: "center",
          justifyContent: "center",
        },
        estilo,
      ]}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: fuentes.semibold }}>{texto}</Text>
    </View>
  );
}
