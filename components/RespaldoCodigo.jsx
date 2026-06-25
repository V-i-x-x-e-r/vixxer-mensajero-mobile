import { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export function RespaldoCodigo({ visible, codigo, onCerrar })
{
  const { colores } = useTema();
  const [copiado, setCopiado] = useState(false);

  async function copiar()
  {
    await Clipboard.setStringAsync(codigo || "");
    setCopiado(true);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={estilos.fondo}>
        <View style={[estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
          <Text style={[estilos.titulo, { color: colores.texto }]}>Tu código de recuperación</Text>
          <Text style={[estilos.texto, { color: colores.muted }]}>
            Guárdalo en un lugar seguro. Es lo único que recupera tus chats si reinstalas o cambias de teléfono.
            No se vuelve a mostrar y nadie más lo conoce.
          </Text>

          <Pressable onPress={copiar} style={[estilos.codigoCaja, { borderColor: colores.borde }]}>
            <Text
              style={[estilos.codigo, { color: colores.texto }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {codigo}
            </Text>
            <Text style={[estilos.copiar, { color: colores.muted }]}>{copiado ? "copiado" : "tocar para copiar"}</Text>
          </Pressable>

          <Pressable
            onPress={onCerrar}
            disabled={!copiado}
            style={({ pressed }) => [
              estilos.boton,
              { backgroundColor: colores.botonFondo, opacity: copiado ? 1 : 0.4 },
              pressed && estilos.presionado,
            ]}
          >
            <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold }}>Ya lo guardé</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  tarjeta: { width: "100%", maxWidth: 380, borderWidth: 1, borderRadius: 16, padding: 22, gap: 12 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  texto: { fontSize: 14, lineHeight: 20 },
  codigoCaja: { borderWidth: 1, borderRadius: 12, paddingVertical: 18, paddingHorizontal: 16, alignItems: "center", gap: 6, marginTop: 4 },
  codigo: { fontSize: 20, fontFamily: fuentes.bold, letterSpacing: 1, alignSelf: "stretch", textAlign: "center" },
  copiar: { fontSize: 12 },
  boton: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  presionado: { opacity: 0.6 },
});
