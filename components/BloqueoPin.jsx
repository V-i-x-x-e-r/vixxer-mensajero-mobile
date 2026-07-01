import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { verificarPin } from "../lib/pin";
import { biometricoActivo, biometricoDisponible, autenticar } from "../lib/biometrico";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";
import { Logo } from "./Logo";
import { Huella } from "./Huella";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

export function BloqueoPin({ onDesbloquear })
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [conBio, setConBio] = useState(false);
  const intentado = useRef(false);

  async function probarBiometrico()
  {
    const activo = await biometricoActivo();
    const hay = await biometricoDisponible();
    if (!activo || !hay)
    {
      return;
    }
    setConBio(true);
    if (await autenticar())
    {
      onDesbloquear();
    }
  }

  useEffect(() =>
  {
    if (!intentado.current)
    {
      intentado.current = true;
      probarBiometrico();
    }
  }, []);

  async function pulsar(tecla)
  {
    if (tecla === "←")
    {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!tecla || pin.length >= 4)
    {
      return;
    }
    const nuevo = pin + tecla;
    setError(false);
    if (nuevo.length === 4)
    {
      if (await verificarPin(nuevo))
      {
        onDesbloquear();
      }
      else
      {
        setError(true);
        setPin("");
      }
      return;
    }
    setPin(nuevo);
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
      <View style={estilos.cabecera}>
        <Logo alto={30} />
        <Text style={[estilos.titulo, { color: colores.texto }]}>Introduce tu PIN</Text>
        {error ? <Text style={[estilos.error, { color: colores.error }]}>PIN incorrecto</Text> : null}
      </View>

      <View style={estilos.puntos}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[estilos.punto, { borderColor: colores.texto }, i < pin.length && { backgroundColor: colores.texto }]} />
        ))}
      </View>

      <View style={estilos.teclado}>
        {TECLAS.map((t, i) => (
          <Pressable key={i} onPress={() => pulsar(t)} disabled={!t} style={({ pressed }) => [estilos.tecla, pressed && t && { backgroundColor: colores.surface }]}>
            <Text style={[estilos.teclaTxt, { color: colores.texto }]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {conBio ? (
        <Pressable onPress={probarBiometrico} hitSlop={8} style={({ pressed }) => [estilos.bio, pressed && { opacity: 0.6 }]}>
          <Huella color={colores.muted} tamano={22} />
          <Text style={[estilos.bioTxt, { color: colores.muted }]}>Usar biometría</Text>
        </Pressable>
      ) : (
        <View style={estilos.bio} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, alignItems: "center", justifyContent: "space-between" },
  cabecera: { alignItems: "center", gap: 14 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  error: { fontSize: 14 },
  puntos: { flexDirection: "row", gap: 18 },
  punto: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  teclado: { width: 300, flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  tecla: { width: 90, height: 76, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  teclaTxt: { fontSize: 26, fontFamily: fuentes.media },
  bio: { minHeight: 30, flexDirection: "row", alignItems: "center", gap: 8 },
  bioTxt: { fontSize: 14, fontFamily: fuentes.media },
});
