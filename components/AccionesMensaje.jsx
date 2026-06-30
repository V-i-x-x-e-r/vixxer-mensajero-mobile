import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Dimensions } from "react-native";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";
import { Responder } from "./Responder";
import { Reenviar } from "./Reenviar";
import { Copiar } from "./Copiar";
import { Lapiz } from "./Lapiz";
import { Bote } from "./Bote";

const REACCIONES = ["\u{1F44D}", "❤️", "\u{1F602}", "\u{1F62E}", "\u{1F622}", "\u{1F64F}"];
const ANCHO = 300;
const ALTO = 108;

function Accion({ icono, etiqueta, onPress, color })
{
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [estilos.accion, pressed && estilos.presionado]}>
      {icono}
      <Text style={[estilos.accionTxt, { color }]}>{etiqueta}</Text>
    </Pressable>
  );
}

export function AccionesMensaje({ sel, esMio, esMedia, onReaccionar, onResponder, onReenviar, onCopiar, onEditar, onBorrar, onCerrar })
{
  const { colores } = useTema();
  const entrada = useRef(null);
  const [emoji, setEmoji] = useState("");

  useEffect(() =>
  {
    setEmoji("");
  }, [sel]);

  if (!sel)
  {
    return null;
  }

  const mensaje = sel.mensaje;
  const { width: W } = Dimensions.get("window");
  const ancho = Math.min(ANCHO, W - 24);
  const arriba = sel.y - ALTO - 8 > 70;
  const top = arriba ? sel.y - ALTO - 8 : sel.y + sel.h + 8;
  const left = Math.max(12, Math.min(esMio ? sel.x + sel.w - ancho : sel.x, W - ancho - 12));

  function abrirEmoji()
  {
    entrada.current?.focus();
  }

  function alEmoji(t)
  {
    const limpio = t.trim();
    if (limpio)
    {
      onReaccionar(mensaje, limpio);
    }
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={estilos.fondo} onPress={onCerrar}>
        <View style={[estilos.barra, { width: ancho, top, left, backgroundColor: colores.surface, borderColor: colores.borde }]}>
          <View style={estilos.reacciones}>
            {REACCIONES.map((e) => (
              <Pressable key={e} onPress={() => onReaccionar(mensaje, e)} hitSlop={6}>
                <Text style={estilos.emoji}>{e}</Text>
              </Pressable>
            ))}
            <Pressable onPress={abrirEmoji} hitSlop={6} style={[estilos.mas, { borderColor: colores.borde }]}>
              <Text style={{ color: colores.texto, fontSize: 18 }}>+</Text>
            </Pressable>
          </View>

          <View style={[estilos.separador, { backgroundColor: colores.borde }]} />

          <View style={estilos.acciones}>
            <Accion icono={<Responder color={colores.texto} tamano={20} />} etiqueta="Responder" onPress={() => onResponder(mensaje)} color={colores.texto} />
            <Accion icono={<Reenviar color={colores.texto} tamano={20} />} etiqueta="Reenviar" onPress={() => onReenviar(mensaje)} color={colores.texto} />
            {esMedia ? null : <Accion icono={<Copiar color={colores.texto} tamano={20} />} etiqueta="Copiar" onPress={() => onCopiar(mensaje)} color={colores.texto} />}
            {esMio && !esMedia ? <Accion icono={<Lapiz color={colores.texto} tamano={20} />} etiqueta="Editar" onPress={() => onEditar(mensaje)} color={colores.texto} /> : null}
            {esMio ? <Accion icono={<Bote color={colores.error} tamano={20} />} etiqueta="Borrar" onPress={() => onBorrar(mensaje)} color={colores.error} /> : null}
          </View>
        </View>

        <TextInput
          ref={entrada}
          value={emoji}
          onChangeText={alEmoji}
          caretHidden
          style={estilos.oculto}
        />
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1 },
  barra:
  {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  reacciones: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  emoji: { fontSize: 24 },
  mas: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  separador: { height: 1, marginVertical: 2 },
  acciones: { flexDirection: "row", justifyContent: "space-around" },
  accion: { alignItems: "center", gap: 3, paddingVertical: 4, paddingHorizontal: 6 },
  accionTxt: { fontSize: 11, fontFamily: fuentes.media },
  presionado: { opacity: 0.6 },
  oculto: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
