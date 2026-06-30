import { useEffect, useRef } from "react";
import { Modal, View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export function Confirmacion({ visible, titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = "Cancelar", destructivo = false, onConfirmar, onCancelar })
{
  const { colores } = useTema();
  const escala = useRef(new Animated.Value(0.95)).current;
  const opacidad = useRef(new Animated.Value(0)).current;

  useEffect(() =>
  {
    if (visible)
    {
      Animated.parallel([
        Animated.spring(escala, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }),
        Animated.timing(opacidad, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    }
    else
    {
      escala.setValue(0.95);
      opacidad.setValue(0);
    }
  }, [visible]);

  const colorConfirmar = destructivo ? colores.error : colores.texto;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <Pressable style={estilos.fondo} onPress={onCancelar}>
        <Animated.View style={{ opacity: opacidad, transform: [{ scale: escala }], width: "100%", maxWidth: 360 }}>
          <Pressable style={[estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text style={[estilos.titulo, { color: colores.texto }]}>{titulo}</Text>
            {mensaje ? <Text style={[estilos.mensaje, { color: colores.muted }]}>{mensaje}</Text> : null}
            <View style={estilos.acciones}>
              <Pressable onPress={onCancelar} style={({ pressed }) => [estilos.boton, { borderColor: colores.borde }, pressed && estilos.presionado]}>
                <Text style={[estilos.botonTxt, { color: colores.texto }]}>{textoCancelar}</Text>
              </Pressable>
              <Pressable onPress={onConfirmar} style={({ pressed }) => [estilos.boton, { borderColor: colores.borde }, pressed && estilos.presionado]}>
                <Text style={[estilos.botonTxt, { color: colorConfirmar }]}>{textoConfirmar}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  tarjeta: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 6 },
  titulo: { fontSize: 17, fontFamily: fuentes.semibold },
  mensaje: { fontSize: 14, lineHeight: 20 },
  acciones: { flexDirection: "row", gap: 10, marginTop: 16 },
  boton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  botonTxt: { fontSize: 15, fontFamily: fuentes.semibold, textAlign: "center" },
  presionado: { opacity: 0.6 },
});
