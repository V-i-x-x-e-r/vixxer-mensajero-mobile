import { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
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
  const [personalizado, setPersonalizado] = useState(false);
  const [emoji, setEmoji] = useState("");

  useEffect(() =>
  {
    setPersonalizado(false);
    setEmoji("");
  }, [mensaje]);

  if (!mensaje)
  {
    return null;
  }

  function confirmar()
  {
    const limpio = emoji.trim();
    if (limpio)
    {
      onReaccionar(mensaje, limpio);
    }
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={estilos.fondo} onPress={onCerrar}>
        <Pressable style={[estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }]} onPress={() => {}}>
          {personalizado ? (
            <View style={estilos.personalizado}>
              <TextInput
                value={emoji}
                onChangeText={setEmoji}
                onSubmitEditing={confirmar}
                placeholder="Pon un emoji"
                placeholderTextColor={colores.placeholder}
                autoFocus
                maxLength={8}
                style={[estilos.entrada, { color: colores.texto, borderColor: colores.borde }]}
              />
              <Pressable onPress={confirmar} style={[estilos.usar, { backgroundColor: colores.botonFondo }]}>
                <Text style={{ color: colores.botonTexto, fontSize: 14 }}>Reaccionar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={estilos.reacciones}>
              {REACCIONES.map((e) => (
                <Pressable key={e} onPress={() => onReaccionar(mensaje, e)} hitSlop={6}>
                  <Text style={estilos.emoji}>{e}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setPersonalizado(true)} hitSlop={6} style={[estilos.mas, { borderColor: colores.borde }]}>
                <Text style={{ color: colores.texto, fontSize: 22 }}>+</Text>
              </Pressable>
            </View>
          )}

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
  reacciones: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 8, marginBottom: 6 },
  emoji: { fontSize: 28 },
  mas: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  personalizado: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, marginBottom: 6 },
  entrada: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 22, textAlign: "center" },
  usar: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  accion: { paddingVertical: 14 },
});
