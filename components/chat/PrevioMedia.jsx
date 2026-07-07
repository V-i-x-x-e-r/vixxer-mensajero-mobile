import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../tema";
import { fuentes } from "../../assets/themes/temas";
import { VistaPreviaVideo } from "../VistaPreviaVideo";
import { Flecha } from "../Flecha";

export function PrevioMedia({ visible, media, onCancelar, onEnviar })
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState("");

  useEffect(() =>
  {
    if (visible)
    {
      setCaption("");
    }
  }, [visible]);

  const esVideo = media && (media.esVideo || media.tipo === "video");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={estilos.fondo}>
        <View style={[estilos.arriba, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onCancelar} hitSlop={10}>
            <Text style={estilos.cerrar}>{"✕"}</Text>
          </Pressable>
        </View>
        {media ? (
          esVideo ? (
            <VistaPreviaVideo uri={media.uri} estilo={estilos.media} />
          ) : (
            <Image source={{ uri: media.uri }} contentFit="contain" style={estilos.media} />
          )
        ) : null}
        <View style={[estilos.abajo, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Añade un comentario…"
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline
            maxLength={500}
            style={estilos.campo}
          />
          <Pressable onPress={() => onEnviar(caption.trim() || undefined)} style={[estilos.enviar, { backgroundColor: colores.botonFondo }]}>
            <Flecha color={colores.botonTexto} tamano={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.94)" },
  arriba: { paddingHorizontal: 16, alignItems: "flex-end" },
  cerrar: { color: "#FFF", fontSize: 22 },
  media: { flex: 1, marginVertical: 10 },
  abajo: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14 },
  campo:
  {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    fontFamily: fuentes.media,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 110,
  },
  enviar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
});
