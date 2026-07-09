import { View, StyleSheet } from "react-native";
import { Vidrio } from "./Vidrio";

export function LiquidGlass({ children, style, intenso = false, borde, fondo, tinte = "dark" })
{
  return (
    <Vidrio
      tinte={tinte}
      intensidad={intenso ? 70 : 45}
      style={[
        estilos.base,
        {
          borderColor: borde || "rgba(255,255,255,0.16)",
          backgroundColor: fondo || "rgba(255,255,255,0.08)",
        },
        style,
      ]}
    >
      <View pointerEvents="none" style={estilos.brillo} />
      <View pointerEvents="none" style={estilos.sombraInterna} />
      {children}
    </Vidrio>
  );
}

const estilos = StyleSheet.create({
  base:
  {
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  brillo:
  {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  sombraInterna:
  {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
});
