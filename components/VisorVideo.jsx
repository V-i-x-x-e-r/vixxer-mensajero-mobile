import { useEffect, useRef, useState } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { duracionCorta } from "../lib/mediaPreview";
import { fuentes } from "../assets/themes/temas";

export function VisorVideo({ uri, onCerrar })
{
  const [controles, setControles] = useState(true);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [arrastre, setArrastre] = useState(null);
  const anchoBarra = useRef(1);
  const base = useRef({ pos: 0, t: Date.now() });
  const player = useVideoPlayer(uri, (p) =>
  {
    p.loop = false;
    p.play();
  });

  useEffect(() =>
  {
    if (!controles || pausado || arrastre != null)
    {
      return;
    }
    const t = setTimeout(() => setControles(false), 3000);
    return () => clearTimeout(t);
  }, [controles, pausado, arrastre]);

  useEffect(() =>
  {
    const t = setInterval(() =>
    {
      const nativo = player.currentTime || 0;
      const duracion = player.duration || 0;
      setDur(duracion);
      setPausado(!player.playing);
      if (!player.playing || arrastre != null)
      {
        base.current = { pos: nativo, t: Date.now() };
        setPos(nativo);
        return;
      }
      if (Math.abs(nativo - base.current.pos) > 0.35)
      {
        base.current = { pos: nativo, t: Date.now() };
      }
      const vivo = base.current.pos + (Date.now() - base.current.t) / 1000;
      setPos(duracion > 0 ? Math.min(duracion, vivo) : vivo);
    }, 45);
    return () => clearInterval(t);
  }, [player, arrastre]);

  function irA(segundos)
  {
    const objetivo = Math.min(Math.max(0, segundos), dur > 0 ? dur : segundos);
    try
    {
      player.currentTime = objetivo;
    }
    catch (e)
    {
    }
    if (Math.abs((player.currentTime || 0) - objetivo) > 0.4)
    {
      try
      {
        player.seekBy(objetivo - (player.currentTime || 0));
      }
      catch (e)
      {
      }
    }
    setPos(objetivo);
    base.current = { pos: objetivo, t: Date.now() };
  }

  function alternar()
  {
    if (player.playing)
    {
      player.pause();
      setControles(true);
    }
    else
    {
      if (dur > 0 && pos >= dur - 0.2)
      {
        irA(0);
      }
      player.play();
    }
  }

  const barrido = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => setArrastre(Math.min(1, Math.max(0, e.x / anchoBarra.current))))
    .onUpdate((e) => setArrastre(Math.min(1, Math.max(0, e.x / anchoBarra.current))))
    .onFinalize((e) =>
    {
      const frac = Math.min(1, Math.max(0, e.x / anchoBarra.current));
      if (dur > 0)
      {
        irA(frac * dur);
      }
      setArrastre(null);
    });

  const progreso = arrastre != null ? arrastre : dur > 0 ? Math.min(1, pos / dur) : 0;
  const tiempoActual = arrastre != null && dur > 0 ? arrastre * dur : pos;

  return (
    <View style={estilos.fondo}>
      <Pressable
        style={estilos.fondo}
        onPress={() =>
        {
          setControles(true);
          alternar();
        }}
      >
        <VideoView player={player} style={estilos.video} contentFit="contain" nativeControls={false} />
      </Pressable>

      {controles ? (
        <>
          <Pressable onPress={onCerrar} hitSlop={12} style={({ pressed }) => [estilos.cerrar, pressed && { opacity: 0.6 }]}>
            <Text style={estilos.cerrarTxt}>✕</Text>
          </Pressable>

          {pausado ? (
            <Pressable onPress={alternar} hitSlop={16} style={estilos.playCentro}>
              <Text style={[estilos.playCentroTxt, { marginLeft: 4 }]}>▶</Text>
            </Pressable>
          ) : null}

          <View style={estilos.panel}>
            <Pressable onPress={alternar} hitSlop={10} style={estilos.playChico}>
              <Text style={estilos.playChicoTxt}>{pausado ? "▶" : "❚❚"}</Text>
            </Pressable>
            <Text style={estilos.tiempo}>{duracionCorta(tiempoActual)}</Text>
            <GestureDetector gesture={barrido}>
              <View
                style={estilos.zonaBarra}
                onLayout={(e) => { anchoBarra.current = Math.max(1, e.nativeEvent.layout.width); }}
              >
                <View style={estilos.pista}>
                  <View style={[estilos.avance, { width: `${progreso * 100}%` }]} />
                </View>
                <View style={[estilos.perilla, { left: `${progreso * 100}%` }, arrastre != null && estilos.perillaActiva]} />
              </View>
            </GestureDetector>
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
  cerrar:
  {
    position: "absolute",
    top: 48,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cerrarTxt: { color: "#FFF", fontSize: 17, fontFamily: fuentes.semibold },
  playCentro:
  {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -34,
    marginLeft: -34,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  playCentroTxt: { color: "#FFF", fontSize: 26 },
  panel:
  {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playChico: { width: 24, alignItems: "center" },
  playChicoTxt: { color: "#FFF", fontSize: 16 },
  zonaBarra: { flex: 1, justifyContent: "center", height: 28 },
  pista: { height: 3.5, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.28)", overflow: "hidden" },
  avance: { height: "100%", backgroundColor: "#FFF", borderRadius: 2 },
  perilla:
  {
    position: "absolute",
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  perillaActiva: { transform: [{ scale: 1.35 }] },
  tiempo: { color: "rgba(255,255,255,0.92)", fontSize: 12, fontFamily: fuentes.media, minWidth: 34, textAlign: "center" },
});
