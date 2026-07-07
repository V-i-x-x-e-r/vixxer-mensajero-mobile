import { View, TextInput, Pressable, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../tema";
import { useTeclado } from "../useTeclado";
import { Clip } from "../Clip";
import { Carita } from "../Carita";
import { Flecha } from "../Flecha";
import { Check } from "../Check";
import { Microfono } from "../Microfono";

export function BarraEntrada({ valor, onCambiar, onEnviar, onAdjuntar, onSticker, onMic, grabando, subiendo, editando, children })
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const tecladoAlto = useTeclado();
  const esWeb = Platform.OS === "web";
  const ocupado = subiendo || grabando;
  const hayTexto = !!valor.trim();
  const mostrarEnviar = hayTexto || !!editando || esWeb || !onMic;
  const enviarApagado = esWeb && !hayTexto && !editando;

  return (
    <View style={{ marginBottom: tecladoAlto }}>
      {children}
      <View style={[estilos.fila, { borderTopColor: colores.borde, paddingBottom: 12 + (tecladoAlto > 0 ? 0 : insets.bottom) }]}>
        {!esWeb && onAdjuntar ? (
          <Pressable
            onPress={onAdjuntar}
            disabled={ocupado}
            hitSlop={6}
            style={({ pressed }) => [estilos.icono, { opacity: ocupado ? 0.4 : 1 }, pressed && estilos.presionado]}
          >
            <Clip color={colores.muted} tamano={20} />
          </Pressable>
        ) : null}
        {!esWeb && onSticker ? (
          <Pressable
            onPress={onSticker}
            disabled={ocupado}
            hitSlop={6}
            style={({ pressed }) => [estilos.icono, { opacity: ocupado ? 0.4 : 1 }, pressed && estilos.presionado]}
          >
            <Carita color={colores.muted} tamano={20} />
          </Pressable>
        ) : null}
        <TextInput
          value={valor}
          onChangeText={onCambiar}
          placeholder={grabando ? "Grabando…" : "Mensaje"}
          placeholderTextColor={grabando ? colores.error : colores.placeholder}
          multiline
          editable={!grabando}
          style={[estilos.input, { color: colores.texto, backgroundColor: colores.surface, borderColor: colores.borde }]}
        />
        {mostrarEnviar ? (
          <Pressable
            onPress={onEnviar}
            disabled={enviarApagado}
            style={({ pressed }) => [estilos.enviar, { backgroundColor: colores.botonFondo, opacity: enviarApagado ? 0.4 : 1 }, pressed && estilos.presionado]}
          >
            {editando ? <Check color={colores.botonTexto} tamano={18} /> : <Flecha color={colores.botonTexto} tamano={20} />}
          </Pressable>
        ) : (
          <Pressable onPress={onMic} disabled={subiendo} style={({ pressed }) => [estilos.enviar, { backgroundColor: grabando ? colores.error : colores.botonFondo }, pressed && estilos.presionado]}>
            <Microfono color={colores.botonTexto} tamano={18} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 12, borderTopWidth: 1 },
  icono: { width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120 },
  enviar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  presionado: { opacity: 0.7 },
});
