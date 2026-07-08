import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Dimensions } from "react-native";
import { useTema } from "./tema";
import { Vidrio } from "./Vidrio";
import { fuentes } from "../assets/themes/temas";
import { Responder } from "./Responder";
import { Reenviar } from "./Reenviar";
import { Copiar } from "./Copiar";
import { Lapiz } from "./Lapiz";
import { Bote } from "./Bote";
import { Check } from "./Check";
import { Pin } from "./Pin";
import { Descargar } from "./Descargar";
import { Ojo } from "./Ojo";

const REACCIONES = ["\u{1F44D}", "❤️", "\u{1F602}", "\u{1F62E}", "\u{1F622}", "\u{1F64F}"];
const ANCHO = 300;

function Accion({ icono, etiqueta, onPress, color })
{
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [estilos.accion, pressed && estilos.presionado]}>
      {icono}
      <Text style={[estilos.accionTxt, { color }]}>{etiqueta}</Text>
    </Pressable>
  );
}

export function AccionesMensaje({ sel, esMio, esMedia, fijado, onReaccionar, onResponder, onReenviar, onSeleccionar, onCopiar, onEditar, onBorrar, onBorrarLocal, onInfo, onDescargar, onFijar, onCerrar })
{
  const { colores, oscuro } = useTema();
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
  const visibles = [
    onResponder,
    onReenviar,
    onSeleccionar,
    onFijar,
    esMedia && onDescargar,
    !esMedia && onCopiar,
    esMio && onInfo,
    esMio && !esMedia && onEditar,
    esMio && onBorrar,
    onBorrarLocal,
  ].filter(Boolean).length;
  const porFila = Math.floor((ancho - 16) / 68);
  const alto = (onReaccionar ? 52 : 8) + Math.max(1, Math.ceil(visibles / porFila)) * 56;
  const arriba = sel.y - alto - 8 > 70;
  const top = arriba ? sel.y - alto - 8 : sel.y + sel.h + 8;
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
        <Vidrio tinte={oscuro ? "dark" : "light"} style={[estilos.barra, { width: ancho, top, left, backgroundColor: `${colores.surface}E0`, borderColor: colores.borde }]}>
          {onReaccionar ? (
            <>
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
            </>
          ) : null}

          <View style={estilos.acciones}>
            {onResponder ? <Accion icono={<Responder color={colores.texto} tamano={20} />} etiqueta="Responder" onPress={() => onResponder(mensaje)} color={colores.texto} /> : null}
            {onReenviar ? <Accion icono={<Reenviar color={colores.texto} tamano={20} />} etiqueta="Reenviar" onPress={() => onReenviar(mensaje)} color={colores.texto} /> : null}
            {onSeleccionar ? <Accion icono={<Check color={colores.texto} tamano={20} />} etiqueta="Seleccionar" onPress={() => onSeleccionar(mensaje)} color={colores.texto} /> : null}
            {onFijar ? <Accion icono={<Pin color={colores.texto} tamano={20} />} etiqueta={fijado ? "Quitar" : "Fijar"} onPress={() => onFijar(mensaje)} color={colores.texto} /> : null}
            {esMedia && onDescargar ? <Accion icono={<Descargar color={colores.texto} tamano={20} />} etiqueta="Descargar" onPress={() => onDescargar(mensaje)} color={colores.texto} /> : null}
            {!esMedia && onCopiar ? <Accion icono={<Copiar color={colores.texto} tamano={20} />} etiqueta="Copiar" onPress={() => onCopiar(mensaje)} color={colores.texto} /> : null}
            {esMio && onInfo ? <Accion icono={<Ojo color={colores.texto} tamano={20} />} etiqueta="Info" onPress={() => onInfo(mensaje)} color={colores.texto} /> : null}
            {esMio && !esMedia && onEditar ? <Accion icono={<Lapiz color={colores.texto} tamano={20} />} etiqueta="Editar" onPress={() => onEditar(mensaje)} color={colores.texto} /> : null}
            {onBorrarLocal ? <Accion icono={<Bote color={colores.texto} tamano={20} />} etiqueta="Para mí" onPress={() => onBorrarLocal(mensaje)} color={colores.texto} /> : null}
            {esMio && onBorrar ? <Accion icono={<Bote color={colores.error} tamano={20} />} etiqueta="Borrar" onPress={() => onBorrar(mensaje)} color={colores.error} /> : null}
          </View>
        </Vidrio>

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
    overflow: "hidden",
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
  acciones: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", rowGap: 6 },
  accion: { width: 68, alignItems: "center", gap: 3, paddingVertical: 4 },
  accionTxt: { fontSize: 11, fontFamily: fuentes.media },
  presionado: { opacity: 0.6 },
  oculto: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
