import { useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, runOnJS } from "react-native-reanimated";
import { useTema } from "../tema";
import { fuentes } from "../../assets/themes/temas";
import { Adjunto } from "../Adjunto";
import { TarjetaEnlace } from "../TarjetaEnlace";
import { extraerUrl } from "../../lib/enlaces";
import { Responder } from "../Responder";
import { tick } from "../../lib/haptica";
import { Image as ImagenExpo } from "expo-image";

const PressableAnimado = Animated.createAnimatedComponent(Pressable);
const UMBRAL = 30;

export function agrupar(reacciones)
{
  const conteo = {};
  const lista = Array.isArray(reacciones) ? reacciones : Object.values(reacciones || {});
  for (const e of lista)
  {
    conteo[e] = (conteo[e] || 0) + 1;
  }
  return Object.entries(conteo);
}

export function BurbujaMedible({ style, onSeleccionar, onPress, onResponder, children })
{
  const { colores } = useTema();
  const ref = useRef(null);
  const arrastre = useSharedValue(0);
  const armado = useSharedValue(false);

  function alMantener()
  {
    tick();
    ref.current?.measureInWindow((x, y, w, h) => onSeleccionar?.({ x, y, w, h }));
  }

  const contenido = (
    <Pressable ref={ref} onLongPress={onSeleccionar ? alMantener : undefined} onPress={onPress} delayLongPress={250} style={style}>
      {children}
    </Pressable>
  );

  const gesto = Gesture.Pan()
    .activeOffsetX(12)
    .failOffsetX(-12)
    .failOffsetY([-16, 16])
    .onUpdate((e) =>
    {
      const x = Math.min(60, Math.max(0, e.translationX * 0.6));
      arrastre.value = x;
      if (x > UMBRAL && !armado.value)
      {
        armado.value = true;
        runOnJS(tick)();
      }
      else if (x <= UMBRAL && armado.value)
      {
        armado.value = false;
      }
    })
    .onEnd(() =>
    {
      if (armado.value && onResponder)
      {
        runOnJS(onResponder)();
      }
      armado.value = false;
      arrastre.value = withSpring(0, { damping: 22, stiffness: 320 });
    })
    .onFinalize(() =>
    {
      arrastre.value = withSpring(0, { damping: 22, stiffness: 320 });
    });

  const estiloArrastre = useAnimatedStyle(() => ({ transform: [{ translateX: arrastre.value }] }));
  const estiloIcono = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, (arrastre.value - 12) / UMBRAL)) }));

  if (!onResponder)
  {
    return contenido;
  }

  return (
    <View>
      <Animated.View style={[estilos.responder, { backgroundColor: colores.surface, borderColor: colores.borde }, estiloIcono]} pointerEvents="none">
        <Responder color={colores.muted} tamano={16} />
      </Animated.View>
      <GestureDetector gesture={gesto}>
        <PressableAnimado
          ref={ref}
          onLongPress={onSeleccionar ? alMantener : undefined}
          onPress={onPress}
          delayLongPress={250}
          style={[style, estiloArrastre]}
        >
          {children}
        </PressableAnimado>
      </GestureDetector>
    </View>
  );
}

function TextoMensaje({ texto, mio, conMenciones, colores })
{
  const base = { color: mio ? colores.botonTexto : colores.texto, fontSize: 15 };
  if (!conMenciones || !/@/.test(String(texto)))
  {
    return <Text style={base}>{texto}</Text>;
  }
  const partes = String(texto).split(/(@[\w.\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00d1-]+)/g);
  return (
    <Text style={base}>
      {partes.map((p, i) => (p.startsWith("@") ? (
        <Text key={i} style={{ fontFamily: fuentes.semibold, color: mio ? colores.botonTexto : colores.botonFondo }}>{p}</Text>
      ) : (
        p
      )))}
    </Text>
  );
}

export function Burbuja({ mio, autor, cita, citaMini, borrado, media, texto, meta, reacciones, onMenu, onPress, onResponder, seleccionando, onToggle, resaltada, aparecer, conMenciones })
{
  const { colores } = useTema();
  const grupos = agrupar(reacciones);
  const urlEnlace = !media && !borrado && typeof texto === "string" ? extraerUrl(texto) : null;
  const mediaVisual = media && (media.t === "img" || media.t === "video" || media.t === "sticker");
  const mediaSolo = mediaVisual && !borrado && !cita && !media.cap;
  const mediaConTexto = mediaVisual && !borrado && !cita && !!media.cap;
  const Contenedor = aparecer ? Animated.View : View;

  return (
    <Contenedor
      entering={aparecer ? FadeInDown.duration(180) : undefined}
      style={resaltada
        ? mio
          ? { backgroundColor: `${colores.botonFondo}1F`, borderRightWidth: 3, borderRightColor: colores.botonFondo, borderRadius: 10 }
          : { backgroundColor: `${colores.botonFondo}1F`, borderLeftWidth: 3, borderLeftColor: colores.botonFondo, borderRadius: 10 }
        : null}
    >
      {autor ? <Text style={[estilos.autor, { color: colores.botonFondo }]}>{autor}</Text> : null}
      <BurbujaMedible
        onSeleccionar={borrado ? undefined : onMenu}
        onPress={onPress}
        onResponder={borrado || seleccionando ? undefined : onResponder}
        style={[
          estilos.burbuja,
          mediaSolo
            ? { alignSelf: mio ? "flex-end" : "flex-start", paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }
            : mediaConTexto
              ? {
                  alignSelf: mio ? "flex-end" : "flex-start",
                  paddingHorizontal: 4,
                  paddingVertical: 4,
                  overflow: "hidden",
                  backgroundColor: mio ? colores.botonFondo : colores.surface,
                  borderWidth: mio ? 0 : 1,
                  borderColor: colores.borde,
                }
              : mio
              ? { alignSelf: "flex-end", backgroundColor: colores.botonFondo }
              : { alignSelf: "flex-start", backgroundColor: colores.surface, borderWidth: 1, borderColor: colores.borde },
        ]}
      >
        {cita ? (
          <View style={[estilos.cita, { borderColor: mio ? colores.botonTexto : colores.borde }]}>
            <Text numberOfLines={2} style={{ flex: 1, color: mio ? colores.botonTexto : colores.muted, fontSize: 13, opacity: 0.8 }}>
              {cita}
            </Text>
            {citaMini ? <ImagenExpo source={{ uri: citaMini }} contentFit="cover" style={estilos.citaMini} /> : null}
          </View>
        ) : null}

        {borrado ? (
          <Text style={{ color: mio ? colores.botonTexto : colores.muted, fontSize: 15, fontStyle: "italic", opacity: 0.8 }}>
            Este mensaje fue eliminado
          </Text>
        ) : media ? (
          <Adjunto media={media} color={mio ? colores.botonTexto : colores.texto} seleccionando={seleccionando} onToggle={onToggle} onMenu={seleccionando ? undefined : onMenu} />
        ) : (
          <TextoMensaje texto={texto} mio={mio} conMenciones={conMenciones} colores={colores} />
        )}

        {urlEnlace ? <TarjetaEnlace url={urlEnlace} claro={mio} /> : null}

        {media && media.cap && !borrado ? (
          <Text style={[estilos.caption, mediaConTexto && estilos.captionMedia, { color: mio ? colores.botonTexto : colores.texto }]}>
            {media.cap}
          </Text>
        ) : null}

        {meta ? (
          mediaSolo ? (
            <View style={estilos.metaMedia} pointerEvents="box-none">{meta}</View>
          ) : (
            <View style={estilos.meta}>{meta}</View>
          )
        ) : null}
      </BurbujaMedible>

      {grupos.length > 0 ? (
        <View style={[estilos.reacciones, { alignSelf: mio ? "flex-end" : "flex-start" }]}>
          {grupos.map(([emoji, n]) => (
            <View key={emoji} style={[estilos.reaccion, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
              <Text style={estilos.reaccionTxt}>{emoji}{n > 1 ? ` ${n}` : ""}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Contenedor>
  );
}

const estilos = StyleSheet.create({
  autor: { fontSize: 12, fontFamily: fuentes.semibold, marginLeft: 6, marginBottom: 2 },
  burbuja: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  cita: { flexDirection: "row", alignItems: "center", gap: 8, borderLeftWidth: 3, paddingLeft: 8, marginBottom: 6, opacity: 0.9, minWidth: 120 },
  citaMini: { width: 36, height: 36, borderRadius: 7 },
  caption: { fontSize: 14, marginTop: 6 },
  captionMedia: { paddingHorizontal: 7, paddingTop: 5, paddingBottom: 2, marginTop: 0 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5, marginTop: 3 },
  metaMedia:
  {
    position: "absolute",
    bottom: 6,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  responder:
  {
    position: "absolute",
    left: 2,
    top: "50%",
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reacciones: { flexDirection: "row", gap: 4, marginTop: 3 },
  reaccion: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 },
  reaccionTxt: { fontSize: 12 },
});
