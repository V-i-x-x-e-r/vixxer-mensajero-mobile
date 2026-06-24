import { View, Text, Image } from "react-native";

const PALETA = ["#35D487", "#65A7FF", "#FFD166", "#FF6B5E", "#8B7CFF", "#22C55E"];

function colorDe(nombre)
{
  let h = 0;
  for (let i = 0; i < nombre.length; i++)
  {
    h = nombre.charCodeAt(i) + ((h << 5) - h);
  }
  return PALETA[Math.abs(h) % PALETA.length];
}

export function Avatar({ nombre = "", uri = null, tamano = 40 })
{
  if (uri)
  {
    return <Image source={{ uri }} style={{ width: tamano, height: tamano, borderRadius: tamano / 2 }} />;
  }

  const inicial = (nombre.trim()[0] || "?").toUpperCase();

  return (
    <View
      style={{
        width: tamano,
        height: tamano,
        borderRadius: tamano / 2,
        backgroundColor: colorDe(nombre),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#0A0A0A", fontWeight: "700", fontSize: tamano * 0.42 }}>{inicial}</Text>
    </View>
  );
}
