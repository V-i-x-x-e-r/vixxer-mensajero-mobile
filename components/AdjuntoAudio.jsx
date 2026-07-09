import { useEffect, useState } from "react";
import { View, Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { obtenerMedia } from "../lib/mediaRemota";
import { leerCache } from "../lib/mediaCache";
import { duracionCorta } from "../lib/mediaPreview";
import { barrasDeterministas } from "../lib/audioWave";
import { fuentes } from "../assets/themes/temas";

const VELOCIDADES = [1, 1.5, 2];
const ANCHO_ONDA = 172;

function conAlpha(color, alpha)
{
  return typeof color === "string" && color.length === 7 ? `${color}${alpha}` : `rgba(255,255,255,0.${alpha === "33" ? "20" : "10"})`;
}

export function AdjuntoAudio({ media, color, compacto })
{
  const [uri, setUri] = useState(() => media.local || leerCache(media.path) || null);
  const [velocidad, setVelocidad] = useState(0);
  const [posSuave, setPosSuave] = useState(0);
  const player = useAudioPlayer(null);
  const estado = useAudioPlayerStatus(player);
  const barras = Array.isArray(media.wf) && media.wf.length > 0 ? media.wf : barrasDeterministas(media.path || media.local);

  useEffect(() =>
  {
    if (uri)
    {
      return;
    }
    let activo = true;
    obtenerMedia({ ...media, mime: media.mime || "audio/m4a" })
      .then((final) => activo && setUri(final))
      .catch(() => {});
    return () => { activo = false; };
  }, [media.path]);

  useEffect(() =>
  {
    if (uri)
    {
      player.replace(uri);
    }
  }, [uri]);

  useEffect(() =>
  {
    if (!(estado && estado.playing))
    {
      setPosSuave(estado?.currentTime || 0);
      return;
    }
    const base = estado.currentTime || 0;
    const inicio = Date.now();
    const ritmo = VELOCIDADES[velocidad];
    const t = setInterval(() => setPosSuave(base + ((Date.now() - inicio) / 1000) * ritmo), 90);
    return () => clearInterval(t);
  }, [estado?.playing, estado?.currentTime, velocidad]);

  const duracion = estado && estado.duration ? estado.duration : media.dur || 0;
  const posicion = posSuave;
  const progreso = duracion > 0 ? Math.min(1, posicion / duracion) : 0;
  const reproduciendo = estado && estado.playing;
  const tiempo = duracionCorta(reproduciendo || posicion > 0.3 ? Math.max(0, duracion - posicion) : duracion) || "0:00";

  function alternar()
  {
    if (!uri)
    {
      return;
    }
    if (reproduciendo)
    {
      player.pause();
    }
    else
    {
      if (duracion > 0 && posicion >= duracion - 0.15)
      {
        player.seekTo(0);
      }
      player.play();
    }
  }

  function buscar(e)
  {
    if (!uri || duracion <= 0)
    {
      return;
    }
    const ancho = compacto ? 136 : ANCHO_ONDA;
    const x = Math.min(1, Math.max(0, e.nativeEvent.locationX / ancho));
    player.seekTo(x * duracion);
  }

  function cambiarVelocidad()
  {
    const sig = (velocidad + 1) % VELOCIDADES.length;
    setVelocidad(sig);
    try
    {
      player.setPlaybackRate(VELOCIDADES[sig], "high");
    }
    catch (e)
    {
    }
  }

  return (
    <View style={[estilos.tarjeta, compacto && estilos.tarjetaCompacta, { borderColor: conAlpha(color, "33"), backgroundColor: conAlpha(color, "12") }]}>
      <Pressable onPress={alternar} hitSlop={8} style={[estilos.play, { borderColor: conAlpha(color, "40"), backgroundColor: conAlpha(color, "18") }]}>
        {!uri ? (
          <ActivityIndicator color={color} />
        ) : (
          <Text style={[estilos.playTxt, { color }]}>{reproduciendo ? "Ⅱ" : "▶"}</Text>
        )}
      </Pressable>
      <View style={estilos.centro}>
        <Pressable onPress={buscar} style={[estilos.onda, compacto && estilos.ondaCompacta]}>
          {barras.map((v, i) => (
            <View
              key={i}
              style={{
                width: compacto ? 2.2 : 2.5,
                height: 5 + v * (compacto ? 19 : 24),
                borderRadius: 3,
                backgroundColor: color,
                opacity: (i + 0.5) / barras.length <= progreso ? 1 : 0.35,
              }}
            />
          ))}
        </Pressable>
        <View style={estilos.tiempoFila}>
          <Text style={[estilos.tiempo, { color }]}>{tiempo}</Text>
          {!compacto ? <Text style={[estilos.tiempo, { color, opacity: 0.55 }]}>{duracionCorta(duracion) || "0:00"}</Text> : null}
        </View>
      </View>
      {uri && !compacto ? (
        <Pressable onPress={cambiarVelocidad} hitSlop={6} style={[estilos.velocidad, { borderColor: color }]}>
          <Text style={[estilos.velocidadTxt, { color }]}>{VELOCIDADES[velocidad]}x</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { minWidth: 248, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 22, paddingHorizontal: 10, paddingVertical: 9 },
  tarjetaCompacta: { minWidth: 0, flex: 1, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 0, backgroundColor: "transparent" },
  play: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  playTxt: { fontSize: 18, fontFamily: fuentes.semibold, marginLeft: 1 },
  centro: { gap: 3 },
  onda: { width: ANCHO_ONDA, height: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ondaCompacta: { width: 136, height: 22 },
  tiempoFila: { flexDirection: "row", justifyContent: "space-between" },
  tiempo: { fontSize: 11, opacity: 0.8 },
  velocidad: { borderWidth: 1, borderRadius: 14, width: 46, height: 30, alignItems: "center", justifyContent: "center" },
  velocidadTxt: { fontSize: 11, fontFamily: fuentes.semibold },
});
