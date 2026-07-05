import { useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTema } from "../tema";
import { fuentes } from "../../assets/themes/temas";
import { Adjunto } from "../Adjunto";
import { tick } from "../../lib/haptica";

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

export function BurbujaMedible({ style, onSeleccionar, onPress, children })
{
  const ref = useRef(null);

  function alMantener()
  {
    tick();
    ref.current?.measureInWindow((x, y, w, h) => onSeleccionar?.({ x, y, w, h }));
  }

  return (
    <Pressable ref={ref} onLongPress={onSeleccionar ? alMantener : undefined} onPress={onPress} delayLongPress={250} style={style}>
      {children}
    </Pressable>
  );
}

export function Burbuja({ mio, autor, cita, borrado, media, texto, meta, reacciones, onMenu, onPress, seleccionando, onToggle, resaltada })
{
  const { colores } = useTema();
  const grupos = agrupar(reacciones);
  const mediaSolo = media && !borrado && !cita;

  return (
    <View style={resaltada ? { backgroundColor: colores.surface } : null}>
      {autor ? <Text style={[estilos.autor, { color: colores.botonFondo }]}>{autor}</Text> : null}
      <BurbujaMedible
        onSeleccionar={borrado ? undefined : onMenu}
        onPress={onPress}
        style={[
          estilos.burbuja,
          mediaSolo
            ? { alignSelf: mio ? "flex-end" : "flex-start", paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }
            : mio
              ? { alignSelf: "flex-end", backgroundColor: colores.botonFondo }
              : { alignSelf: "flex-start", backgroundColor: colores.surface, borderWidth: 1, borderColor: colores.borde },
        ]}
      >
        {cita ? (
          <View style={[estilos.cita, { borderColor: mio ? colores.botonTexto : colores.borde }]}>
            <Text numberOfLines={1} style={{ color: mio ? colores.botonTexto : colores.muted, fontSize: 13, opacity: 0.8 }}>
              {cita}
            </Text>
          </View>
        ) : null}

        {borrado ? (
          <Text style={{ color: mio ? colores.botonTexto : colores.muted, fontSize: 15, fontStyle: "italic", opacity: 0.8 }}>
            Este mensaje fue eliminado
          </Text>
        ) : media ? (
          <Adjunto media={media} color={mio ? colores.botonTexto : colores.texto} seleccionando={seleccionando} onToggle={onToggle} onMenu={seleccionando ? undefined : onMenu} />
        ) : (
          <Text style={{ color: mio ? colores.botonTexto : colores.texto, fontSize: 15 }}>{texto}</Text>
        )}

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
    </View>
  );
}

const estilos = StyleSheet.create({
  autor: { fontSize: 12, fontFamily: fuentes.semibold, marginLeft: 6, marginBottom: 2 },
  burbuja: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  cita: { borderLeftWidth: 3, paddingLeft: 8, marginBottom: 6, opacity: 0.9 },
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
  reacciones: { flexDirection: "row", gap: 4, marginTop: 3 },
  reaccion: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 },
  reaccionTxt: { fontSize: 12 },
});
