import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useTema } from "./tema";

const REACCIONES = ["\u{1F44D}", "❤️", "\u{1F602}", "\u{1F62E}", "\u{1F622}", "\u{1F64F}"];

function Accion({ texto, onPress, colores, peligro = false })
{
  return (
    <Pressable onPress={onPress} style={estilos.accion}>
      <Text style={{ color: peligro ? colores.error : colores.texto, fontSize: 16 }}>{texto}</Text>
    </Pressable>
  );
}

export function AccionesMensaje({ mensaje, esMio, onReaccionar, onResponder, onCopiar, onEditar, onBorrar, onCerrar })
{
  const { colores } = useTema();

  if (!mensaje)
  {
    return null;
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={estilos.fondo} onPress={onCerrar}>
        <Pressable style={[estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }]} onPress={() => {}}>
          <View style={estilos.reacciones}>
            {REACCIONES.map((e) => (
              <Pressable key={e} onPress={() => onReaccionar(mensaje, e)} hitSlop={6}>
                <Text style={estilos.emoji}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <Accion texto="Responder" onPress={() => onResponder(mensaje)} colores={colores} />
          <Accion texto="Copiar" onPress={() => onCopiar(mensaje)} colores={colores} />
          {esMio ? <Accion texto="Editar" onPress={() => onEditar(mensaje)} colores={colores} /> : null}
          {esMio ? <Accion texto="Borrar" onPress={() => onBorrar(mensaje)} colores={colores} peligro /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  tarjeta: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 16, paddingBottom: 32, gap: 2 },
  reacciones: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8, marginBottom: 6 },
  emoji: { fontSize: 28 },
  accion: { paddingVertical: 14 },
});
