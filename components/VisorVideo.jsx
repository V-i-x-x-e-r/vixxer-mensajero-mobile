import { useEffect, useRef, useState } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { duracionCorta } from "../lib/mediaPreview";

const ANCHO_BARRA = { flex: 1 };

export function VisorVideo({ uri, onCerrar })
{
  const [controles, setControles] = useState(true);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [pausado, setPausado] = useState(false);
  const barra = useRef(0);
  const player = useVideoPlayer(uri, (p) =>
  {
    p.loop = false;
    p.play();
  });

  useEffect(() =>
  {
    const t = setInterval(() =>
    {
      setPos(player.currentTime || 0);
      setDur(player.duration || 0);
      setPausado(!player.playing);
    }, 250);
    return () => clearInterval(t);
  }, [player]);

  function alternar()
  {
    if (player.playing)
    {
      player.pause();
    }
    else
    {
      if (dur > 0 && pos >= dur - 0.2)
      {
        player.currentTime = 0;
      }
      player.play();
    }
  }

  function buscar(e)
  {
    if (dur <= 0 || barra.current <= 0)
    {
      return;
    }
    const x = Math.min(1, Math.max(0, e.nativeEvent.locationX / barra.current));
    player.currentTime = x * dur;
  }

  const progreso = dur > 0 ? Math.min(1, pos / dur) : 0;

  return (
    <View style={estilos.fondo}>
      <Pressable style={estilos.fondo} onPress={() => setControles((v) => !v)}>
        <VideoView player={player} style={estilos.video} contentFit="contain" nativeControls={false} />
      </Pressable>

      {controles ? (
        <>
          <Pressable onPress={onCerrar} hitSlop={12} style={({ pressed }) => [estilos.cerrar, pressed && { opacity: 0.6 }]}>
            <Text style={estilos.cerrarTxt}>✕</Text>
          </Pressable>

          <Pressable onPress={alternar} hitSlop={16} style={estilos.play} pointerEvents="box-only">
            <Text style={estilos.playTxt}>{pausado ? "▶" : "❚❚"}</Text>
          </Pressable>

          <View style={estilos.abajo} pointerEvents="box-none">
            <Text style={estilos.tiempo}>{duracionCorta(pos)}</Text>
            <Pressable
              onPress={buscar}
              onLayout={(e) => { barra.current = e.nativeEvent.layout.width; }}
              style={[ANCHO_BARRA, estilos.zonaBarra]}
              hitSlop={{ top: 14, bottom: 14 }}
            >
              <View style={estilos.pista}>
                <View style={[estilos.avance, { width: `${progreso * 100}%` }]} />
              </View>
              <View style={[estilos.perilla, { left: `${progreso * 100}%` }]} />
            </Pressable>
            <Text style={estilos.tiempo}>{duracionCorta(dur)}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1 },
  cerrar: { position: "absolute", top: 44, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  cerrarTxt: { color: "#FFF", fontSize: 20, fontWeight: "600" },
  play:
  {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  playTxt: { color: "#FFF", fontSize: 24 },
  abajo:
  {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  zonaBarra: { justifyContent: "center", height: 24 },
  pista: { height: 3.5, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  avance: { height: "100%", backgroundColor: "#FFF" },
  perilla: { position: "absolute", marginLeft: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFF" },
  tiempo: { color: "#FFF", fontSize: 12, minWidth: 34, textAlign: "center" },
});
