import { View, StyleSheet } from "react-native";
import { Vidrio } from "./Vidrio";
import { useTema } from "./tema";

export function Superficie({ style, children, radio = 16, opacidad = "E0", brillo = true, ...resto })
{
  const { colores, oscuro } = useTema();
  return (
    <Vidrio
      tinte={oscuro ? "dark" : "light"}
      intensidad={50}
      style={[
        {
          backgroundColor: `${colores.surface}${opacidad}`,
          borderColor: colores.borde,
          borderWidth: 1,
          borderRadius: radio,
          overflow: "hidden",
        },
        style,
      ]}
      {...resto}
    >
      {brillo ? (
        <View pointerEvents="none" style={[estilos.brillo, { backgroundColor: oscuro ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.6)" }]} />
      ) : null}
      {children}
    </Vidrio>
  );
}

export function BrilloVidrio({ oscuro })
{
  return <View pointerEvents="none" style={[estilos.brillo, { backgroundColor: oscuro ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.6)" }]} />;
}

const estilos = StyleSheet.create({
  brillo: { position: "absolute", left: 12, right: 12, top: 0, height: StyleSheet.hairlineWidth * 2, opacity: 0.9 },
});
