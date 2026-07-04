import { useEffect, useState } from "react";
import { Modal, View, Text, Image, Pressable, FlatList, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { listarStickers, crearSticker, borrarSticker } from "../lib/stickers";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export function SelectorSticker({ visible, onElegir, onCerrar })
{
  const { colores } = useTema();
  const [stickers, setStickers] = useState([]);
  const [borrando, setBorrando] = useState(null);

  useEffect(() =>
  {
    if (visible)
    {
      listarStickers().then(setStickers);
      setBorrando(null);
    }
  }, [visible]);

  async function crear()
  {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted)
    {
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (r.canceled || !r.assets[0])
    {
      return;
    }
    try
    {
      await crearSticker(r.assets[0].uri);
      setStickers(await listarStickers());
    }
    catch (e)
    {
    }
  }

  async function borrar(uri)
  {
    await borrarSticker(uri);
    setBorrando(null);
    setStickers(await listarStickers());
  }

  const datos = ["crear", ...stickers];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={estilos.fondo} onPress={onCerrar}>
        <Pressable style={[estilos.hoja, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
          <Text style={[estilos.titulo, { color: colores.texto }]}>Stickers</Text>
          <FlatList
            data={datos}
            keyExtractor={(s) => s}
            numColumns={4}
            columnWrapperStyle={estilos.fila}
            contentContainerStyle={estilos.lista}
            renderItem={({ item }) =>
              item === "crear" ? (
                <Pressable onPress={crear} style={({ pressed }) => [estilos.celda, estilos.crear, { borderColor: colores.borde }, pressed && estilos.presionado]}>
                  <Text style={[estilos.mas, { color: colores.muted }]}>+</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => (borrando === item ? setBorrando(null) : onElegir(item))}
                  onLongPress={() => setBorrando(item)}
                  delayLongPress={350}
                  style={({ pressed }) => [estilos.celda, pressed && estilos.presionado]}
                >
                  <Image source={{ uri: item }} style={estilos.sticker} resizeMode="contain" />
                  {borrando === item ? (
                    <Pressable onPress={() => borrar(item)} style={[estilos.borrar, { backgroundColor: colores.error }]}>
                      <Text style={estilos.borrarTxt}>✕</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              )
            }
            ListEmptyComponent={null}
          />
          <Text style={[estilos.nota, { color: colores.muted }]}>
            Toca + para crear un sticker desde una foto. Mantén presionado uno para borrarlo.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  hoja: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingTop: 16, paddingBottom: 28, maxHeight: "60%" },
  titulo: { fontSize: 16, fontFamily: fuentes.semibold, textAlign: "center", marginBottom: 10 },
  lista: { paddingHorizontal: 14, gap: 10 },
  fila: { gap: 10 },
  celda: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", maxWidth: "25%" },
  crear: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 14 },
  mas: { fontSize: 30, fontFamily: fuentes.media },
  sticker: { width: "92%", height: "92%" },
  borrar: { position: "absolute", top: 2, right: 2, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  borrarTxt: { color: "#FFF", fontSize: 12 },
  nota: { fontSize: 12, textAlign: "center", marginTop: 10, paddingHorizontal: 24 },
  presionado: { opacity: 0.7 },
});
