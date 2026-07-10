import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Platform, Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Vidrio } from "../Vidrio";
import { useTema } from "../tema";
import { useTeclado } from "../useTeclado";
import { fuentes } from "../../assets/themes/temas";
import { duracionCorta } from "../../lib/mediaPreview";
import { Clip } from "../Clip";
import { Carita } from "../Carita";
import { Flecha } from "../Flecha";
import { Check } from "../Check";
import { Microfono } from "../Microfono";
import { Bote } from "../Bote";
import { AdjuntoAudio } from "../AdjuntoAudio";

export function BarraEntrada({ valor, onCambiar, onEnviar, onAdjuntar, onSticker, audioDraft, onCancelarAudioDraft, onEnviarAudioDraft, grabando, grabPausado, tiempoGrabacion, onIniciarGrabacion, onPausarGrabacion, onCancelarGrabacion, onEnviarGrabacion, subiendo, editando, children })
{
  const { colores, oscuro } = useTema();
  const insets = useSafeAreaInsets();
  const tecladoAlto = useTeclado();
  const [pista, setPista] = useState(false);
  const pulso = useRef(new Animated.Value(0)).current;
  const esWeb = Platform.OS === "web";
  const ocupado = subiendo || grabando;
  const hayTexto = !!valor.trim();
  const mostrarEnviar = hayTexto || !!editando || esWeb || !onIniciarGrabacion;
  const enviarApagado = esWeb && !hayTexto && !editando;

  useEffect(() =>
  {
    if (!grabando || grabPausado)
    {
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [grabando, grabPausado]);

  useEffect(() =>
  {
    if (!pista)
    {
      return;
    }
    const t = setTimeout(() => setPista(false), 1600);
    return () => clearTimeout(t);
  }, [pista]);

  return (
    <View style={{ marginBottom: tecladoAlto }}>
      <Vidrio tinte={oscuro ? "dark" : "light"} style={[StyleSheet.absoluteFill, { backgroundColor: `${colores.surface}E6` }]} pointerEvents="none" />
      {children}
      {pista ? (
        <View style={[estilos.pista, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
          <Text style={[estilos.pistaTxt, { color: colores.texto }]}>Mantén presionado para grabar</Text>
        </View>
      ) : null}

      {grabando ? (
        <View style={[estilos.fila, { borderTopColor: colores.borde, paddingBottom: 12 + (tecladoAlto > 0 ? 0 : insets.bottom) }]}>
          <Pressable onPress={onCancelarGrabacion} hitSlop={8} style={({ pressed }) => [estilos.icono, pressed && estilos.presionado]}>
            <Bote color={colores.error} tamano={22} />
          </Pressable>
          <View style={estilos.grabCentro}>
            <Animated.View style={[estilos.grabPunto, { backgroundColor: colores.error, opacity: grabPausado ? 0.4 : pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] }) }]} />
            <Text style={[estilos.grabTiempo, { color: colores.texto }]}>{duracionCorta(tiempoGrabacion || 0)}</Text>
            <Text style={[estilos.grabTxt, { color: colores.muted }]}>{grabPausado ? "En pausa" : "Grabando"}</Text>
          </View>
          <Pressable onPress={onPausarGrabacion} hitSlop={8} style={({ pressed }) => [estilos.iconoRedondo, { borderColor: colores.borde }, pressed && estilos.presionado]}>
            <Text style={[estilos.simbolo, { color: colores.texto }]}>{grabPausado ? "▶" : "Ⅱ"}</Text>
          </Pressable>
          <Pressable onPress={onEnviarGrabacion} style={({ pressed }) => [estilos.enviar, { backgroundColor: colores.botonFondo }, pressed && estilos.presionado]}>
            <Check color={colores.botonTexto} tamano={18} />
          </Pressable>
        </View>
      ) : audioDraft ? (
        <View style={[estilos.fila, { borderTopColor: colores.borde, paddingBottom: 12 + (tecladoAlto > 0 ? 0 : insets.bottom) }]}>
          <Pressable onPress={onCancelarAudioDraft} hitSlop={8} style={({ pressed }) => [estilos.icono, pressed && estilos.presionado]}>
            <Bote color={colores.error} tamano={22} />
          </Pressable>
          <View style={[estilos.audioDraft, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <AdjuntoAudio media={{ ...audioDraft, local: audioDraft.uri, path: audioDraft.uri, mime: audioDraft.mime || "audio/mp4" }} color={colores.texto} compacto />
          </View>
          <Pressable onPress={onEnviarAudioDraft} disabled={subiendo} style={({ pressed }) => [estilos.enviar, { backgroundColor: colores.botonFondo, opacity: subiendo ? 0.45 : 1 }, pressed && estilos.presionado]}>
            <Flecha color={colores.botonTexto} tamano={20} />
          </Pressable>
        </View>
      ) : (
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
            placeholder="Mensaje"
            placeholderTextColor={colores.placeholder}
            multiline
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
            <Pressable
              onPress={() => setPista(true)}
              onLongPress={onIniciarGrabacion}
              delayLongPress={260}
              disabled={subiendo}
              style={({ pressed }) => [estilos.enviar, { backgroundColor: colores.botonFondo }, pressed && estilos.presionado]}
            >
              <Microfono color={colores.botonTexto} tamano={18} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 12, borderTopWidth: 1 },
  icono: { width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  iconoRedondo: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 3 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120 },
  enviar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  presionado: { opacity: 0.7 },
  pista: { alignSelf: "center", borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 6 },
  pistaTxt: { fontSize: 12, fontFamily: fuentes.media },
  grabCentro: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44 },
  grabPunto: { width: 10, height: 10, borderRadius: 5 },
  grabTiempo: { fontSize: 15, fontFamily: fuentes.semibold },
  grabTxt: { fontSize: 13 },
  simbolo: { fontSize: 15, fontFamily: fuentes.semibold },
  audioDraft: { flex: 1, borderWidth: 1, borderRadius: 18, paddingHorizontal: 8, paddingVertical: 5 },
});
