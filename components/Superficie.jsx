import { Vidrio } from "./Vidrio";
import { useTema } from "./tema";

export function Superficie({ style, children, radio = 16, opacidad = "E0", ...resto })
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
      {children}
    </Vidrio>
  );
}
