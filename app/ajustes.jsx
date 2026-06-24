import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { cerrarSesion } from "../lib/storage";
import { desconectarSocket } from "../lib/socket";
import { useTema } from "../components/tema";
import { BotonTema } from "../components/BotonTema";

export default function Ajustes()
{
  const { colores } = useTema();

  async function salir()
  {
    desconectarSocket();
    await cerrarSesion();
    router.replace("/");
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Text style={[estilos.seccion, { color: colores.muted }]}>APARIENCIA</Text>
      <View style={[estilos.fila, { borderColor: colores.borde }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Tema claro / oscuro</Text>
        <BotonTema />
      </View>

      <Text style={[estilos.seccion, { color: colores.muted, marginTop: 28 }]}>CUENTA</Text>
      <Pressable onPress={salir} style={[estilos.salir, { borderColor: colores.borde }]}>
        <Text style={[estilos.salirTxt, { color: colores.error }]}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 20 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1, marginBottom: 10 },
  fila:
  {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  etiqueta: { fontSize: 15 },
  salir: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  salirTxt: { fontSize: 15, fontWeight: "600" },
});
