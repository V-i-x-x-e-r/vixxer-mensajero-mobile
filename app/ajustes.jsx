import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as api from "../lib/api";
import { cerrarSesion } from "../lib/storage";
import { desconectarSocket } from "../lib/socket";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { BotonTema } from "../components/BotonTema";

export default function Ajustes()
{
  const { colores } = useTema();
  const [codigo, setCodigo] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() =>
  {
    api.miCodigo().then((d) => setCodigo(d.codigo)).catch(() => {});
  }, []);

  async function copiar()
  {
    if (!codigo)
    {
      return;
    }
    await Clipboard.setStringAsync(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  async function cerrar()
  {
    desconectarSocket();
    await cerrarSesion();
    router.replace("/");
  }

  function salir()
  {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: cerrar },
    ]);
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Text style={[estilos.seccion, { color: colores.muted }]}>TU CÓDIGO DE AMIGO</Text>
      <Pressable onPress={copiar} style={({ pressed }) => [estilos.codigoCaja, { borderColor: colores.borde }, pressed && estilos.presionado]}>
        <Text style={[estilos.codigo, { color: colores.texto }]}>{codigo || "…"}</Text>
        <Text style={[estilos.copiar, { color: colores.muted }]}>{copiado ? "copiado" : "tocar para copiar"}</Text>
      </Pressable>

      <Text style={[estilos.seccion, { color: colores.muted, marginTop: 28 }]}>APARIENCIA</Text>
      <View style={[estilos.fila, { borderColor: colores.borde }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Tema claro / oscuro</Text>
        <BotonTema />
      </View>

      <Text style={[estilos.seccion, { color: colores.muted, marginTop: 28 }]}>CUENTA</Text>
      <Pressable onPress={salir} style={({ pressed }) => [estilos.salir, { borderColor: colores.borde }, pressed && estilos.presionado]}>
        <Text style={[estilos.salirTxt, { color: colores.error }]}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 20 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1, marginBottom: 10 },
  codigoCaja: { borderWidth: 1, borderRadius: 12, paddingVertical: 18, alignItems: "center", gap: 6 },
  codigo: { fontSize: 28, fontFamily: fuentes.bold, letterSpacing: 4 },
  copiar: { fontSize: 12 },
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
  presionado: { opacity: 0.6 },
});
