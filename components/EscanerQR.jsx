import { useEffect, useRef } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export function EscanerQR({ visible, onLeido, onCerrar })
{
  const { colores } = useTema();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const leido = useRef(false);

  useEffect(() =>
  {
    if (visible)
    {
      leido.current = false;
      if (permiso && !permiso.granted)
      {
        pedirPermiso();
      }
    }
  }, [visible]);

  function alEscanear({ data })
  {
    if (leido.current || !data)
    {
      return;
    }
    leido.current = true;
    onLeido(data.trim());
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View style={estilos.pantalla}>
        {permiso?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={alEscanear}
          />
        ) : (
          <View style={estilos.centro}>
            <Text style={estilos.aviso}>Necesitamos la cámara para escanear el código QR.</Text>
            <Pressable onPress={pedirPermiso} style={estilos.permiso}>
              <Text style={estilos.permisoTxt}>Permitir cámara</Text>
            </Pressable>
          </View>
        )}

        <View style={estilos.marco} pointerEvents="none" />

        <Pressable onPress={onCerrar} style={estilos.cerrar}>
          <Text style={estilos.cerrarTxt}>Cerrar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  centro: { alignItems: "center", gap: 16, padding: 32 },
  aviso: { color: "#FFF", fontSize: 15, textAlign: "center", lineHeight: 22 },
  permiso: { borderWidth: 1, borderColor: "#FFF", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  permisoTxt: { color: "#FFF", fontFamily: fuentes.semibold },
  marco: { position: "absolute", width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: "rgba(255,255,255,0.85)" },
  cerrar: { position: "absolute", bottom: 56, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.6)" },
  cerrarTxt: { color: "#FFF", fontSize: 15, fontFamily: fuentes.semibold },
});
