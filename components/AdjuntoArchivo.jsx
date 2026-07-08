import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { obtenerMedia } from "../lib/mediaRemota";
import { fuentes } from "../assets/themes/temas";
import { Documento } from "./Documento";

export function pesoLegible(bytes)
{
  if (!bytes)
  {
    return "";
  }
  if (bytes < 1024 * 1024)
  {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdjuntoArchivo({ media, color })
{
  const [abriendo, setAbriendo] = useState(false);

  async function abrir()
  {
    if (abriendo)
    {
      return;
    }
    setAbriendo(true);
    try
    {
      const archivo = await obtenerMedia(media);
      const Sharing = require("expo-sharing");
      await Sharing.shareAsync(archivo, { mimeType: media.mime || "application/octet-stream", dialogTitle: media.nombre });
    }
    catch (e)
    {
    }
    finally
    {
      setAbriendo(false);
    }
  }

  return (
    <Pressable onPress={abrir} style={estilos.fila}>
      <View style={estilos.icono}>
        {abriendo ? <ActivityIndicator color={color} /> : <Documento color={color} tamano={24} />}
      </View>
      <View style={estilos.centro}>
        <Text numberOfLines={1} style={[estilos.nombre, { color }]}>{media.nombre || "Documento"}</Text>
        <Text style={[estilos.peso, { color }]}>
          {pesoLegible(media.peso)}{media.peso ? " · " : ""}toca para abrir
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4, maxWidth: 230 },
  icono: { width: 30, alignItems: "center" },
  centro: { flexShrink: 1, gap: 1 },
  nombre: { fontSize: 14, fontFamily: fuentes.media },
  peso: { fontSize: 11, opacity: 0.75 },
});
