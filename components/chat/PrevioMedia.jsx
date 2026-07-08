import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../tema";
import { fuentes } from "../../assets/themes/temas";
import { VistaPreviaVideo } from "../VistaPreviaVideo";
import { Flecha } from "../Flecha";

function esVideo(item)
{
  return item && (item.esVideo || item.tipo === "video");
}

export function PrevioMedia({ visible, items, onCancelar, onEnviar })
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [indice, setIndice] = useState(0);
  const [caps, setCaps] = useState({});

  useEffect(() =>
  {
    if (visible)
    {
      setIndice(0);
      setCaps({});
    }
  }, [visible]);

  const lista = items || [];
  const actual = lista[Math.min(indice, lista.length - 1)] || null;

  function enviar()
  {
    onEnviar(lista.map((item, i) => ({ ...item, cap: (caps[i] || "").trim() || undefined })));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={estilos.fondo}>
        <View style={[estilos.arriba, { paddingTop: insets.top + 8 }]}>
          {lista.length > 1 ? <Text style={estilos.contador}>{indice + 1} de {lista.length}</Text> : <View />}
          <Pressable onPress={onCancelar} hitSlop={10}>
            <Text style={estilos.cerrar}>{"✕"}</Text>
          </Pressable>
        </View>

        {actual ? (
          esVideo(actual) ? (
            <VistaPreviaVideo key={actual.uri} uri={actual.uri} estilo={estilos.media} />
          ) : (
            <Image source={{ uri: actual.uri }} contentFit="contain" style={estilos.media} />
          )
        ) : null}

        {lista.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.tira} contentContainerStyle={estilos.tiraContenido}>
            {lista.map((item, i) => (
              <Pressable key={item.uri + i} onPress={() => setIndice(i)}>
                <Image
                  source={{ uri: item.uri }}
                  contentFit="cover"
                  style={[estilos.mini, i === indice && { borderColor: colores.botonFondo, borderWidth: 2 }]}
                />
                {esVideo(item) ? <Text style={estilos.miniPlay}>▶</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={[estilos.abajo, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            value={caps[indice] || ""}
            onChangeText={(t) => setCaps((prev) => ({ ...prev, [indice]: t }))}
            placeholder="Añade un comentario…"
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline
            maxLength={500}
            style={estilos.campo}
          />
          <Pressable onPress={enviar} style={[estilos.enviar, { backgroundColor: colores.botonFondo }]}>
            <Flecha color={colores.botonTexto} tamano={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.94)" },
  arriba: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  contador: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: fuentes.media },
  cerrar: { color: "#FFF", fontSize: 22 },
  media: { flex: 1, marginVertical: 10 },
  tira: { maxHeight: 64, marginBottom: 8 },
  tiraContenido: { paddingHorizontal: 14, gap: 8, alignItems: "center" },
  mini: { width: 54, height: 54, borderRadius: 10 },
  miniPlay: { position: "absolute", alignSelf: "center", top: 18, color: "#FFF", fontSize: 16 },
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
