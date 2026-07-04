import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export const PREFIJO_VINCULO = "vixxer-vinculo:";

export function VincularDispositivo({ visible, codigo, onCerrar })
{
  const { colores } = useTema();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={estilos.fondo} onPress={onCerrar}>
        <Pressable style={[estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
          <Text style={[estilos.titulo, { color: colores.texto }]}>Vincular otro dispositivo</Text>
          <Text style={[estilos.sub, { color: colores.muted }]}>
            En tu otro teléfono: inicia sesión, elige "Escanear desde tu otro teléfono" y apunta a este código.
          </Text>
          <View style={estilos.qr}>
            {codigo ? <QRCode value={PREFIJO_VINCULO + codigo} size={196} backgroundColor="#FFFFFF" color="#0A0A0A" /> : null}
          </View>
          <Text style={[estilos.aviso, { color: colores.error }]}>
            Este código da acceso a tus mensajes. No lo compartas ni le tomes captura.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  tarjeta: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: "center", gap: 8, maxWidth: 340, width: "100%" },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  sub: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  qr: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, marginVertical: 12 },
  aviso: { fontSize: 12, textAlign: "center", lineHeight: 17 },
});
