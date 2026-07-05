import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { estadoLlamada, alLlamada, iniciarLlamada, contestar, colgar, alternarSilencio, alternarAltavoz, altavozActivo, alternarCamara, cambiarCamara, llamadasDisponibles } from "../lib/llamadas";
import { fuentes } from "../assets/themes/temas";
import { Avatar } from "../components/Avatar";
import { Telefono } from "../components/Telefono";
import { Videollamada } from "../components/Videollamada";
import { Microfono } from "../components/Microfono";
import { Bocina } from "../components/Bocina";

function Video({ stream, estilo, espejo })
{
  const { RTCView } = require("react-native-webrtc");
  return <RTCView streamURL={stream.toURL()} style={estilo} objectFit="cover" mirror={espejo} zOrder={espejo ? 1 : 0} />;
}

function duracionTexto(segundos)
{
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Llamada()
{
  const insets = useSafeAreaInsets();
  const { id, usuario, video, entrante } = useLocalSearchParams();
  const [llamada, setLlamada] = useState(estadoLlamada());
  const [silencio, setSilencio] = useState(false);
  const [altavoz, setAltavoz] = useState(altavozActivo());
  const [camaraApagada, setCamaraApagada] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const reloj = useRef(null);

  useEffect(() => alLlamada(setLlamada), []);

  useEffect(() =>
  {
    if (!llamadasDisponibles())
    {
      router.back();
      return;
    }
    if (entrante !== "1" && id)
    {
      iniciarLlamada(id, usuario, video === "1");
    }
  }, []);

  useEffect(() =>
  {
    if (llamada.fase === "activa" && !reloj.current)
    {
      reloj.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    }
    if (llamada.fase !== "activa" && reloj.current)
    {
      clearInterval(reloj.current);
      reloj.current = null;
    }
    return () =>
    {
      if (reloj.current)
      {
        clearInterval(reloj.current);
        reloj.current = null;
      }
    };
  }, [llamada.fase]);

  useEffect(() =>
  {
    if (llamada.fase === "libre")
    {
      if (router.canGoBack())
      {
        router.back();
      }
      else
      {
        router.replace("/chats");
      }
    }
  }, [llamada.fase]);

  const nombre = llamada.nombre || usuario || "";
  const esEntrante = llamada.fase === "entrante";
  const conVideo = llamada.video;
  const etiqueta = llamada.fase === "llamando"
    ? "Llamando…"
    : esEntrante
      ? conVideo ? "Videollamada entrante" : "Llamada entrante"
      : duracionTexto(segundos);

  return (
    <View style={estilos.pantalla}>
      <Stack.Screen options={{ headerShown: false }} />

      {conVideo && llamada.remoto ? (
        <Video stream={llamada.remoto} estilo={StyleSheet.absoluteFill} espejo={false} />
      ) : (
        <View style={estilos.centro}>
          <Avatar nombre={nombre} tamano={120} />
          {conVideo && llamada.fase === "activa" ? (
            <Text style={estilos.esperando}>Esperando su video…</Text>
          ) : null}
        </View>
      )}

      {conVideo && llamada.local && !camaraApagada ? (
        <View style={[estilos.pip, { top: insets.top + 16 }]}>
          <Video stream={llamada.local} estilo={estilos.pipVideo} espejo />
        </View>
      ) : null}

      <View style={[estilos.encabezado, { paddingTop: insets.top + 20 }]} pointerEvents="none">
        <Text style={estilos.nombre}>{nombre}</Text>
        <Text style={estilos.etiqueta}>{etiqueta}</Text>
      </View>

      <View style={[estilos.controles, { paddingBottom: insets.bottom + 28 }]}>
        {esEntrante ? (
          <>
            <Pressable onPress={colgar} style={({ pressed }) => [estilos.boton, estilos.rojo, pressed && estilos.presionado]}>
              <Telefono color="#FFF" tamano={26} />
            </Pressable>
            <Pressable onPress={contestar} style={({ pressed }) => [estilos.boton, estilos.verde, pressed && estilos.presionado]}>
              {conVideo ? <Videollamada color="#FFF" tamano={26} /> : <Telefono color="#FFF" tamano={26} />}
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => setSilencio(alternarSilencio())}
              style={({ pressed }) => [estilos.boton, silencio ? estilos.claro : estilos.oscuro, pressed && estilos.presionado]}
            >
              <Microfono color={silencio ? "#0B0B0F" : "#FFF"} tamano={22} />
            </Pressable>
            <Pressable
              onPress={() => setAltavoz(alternarAltavoz())}
              style={({ pressed }) => [estilos.boton, altavoz ? estilos.claro : estilos.oscuro, pressed && estilos.presionado]}
            >
              <Bocina color={altavoz ? "#0B0B0F" : "#FFF"} tamano={22} />
            </Pressable>
            {conVideo ? (
              <>
                <Pressable
                  onPress={() => setCamaraApagada(alternarCamara())}
                  style={({ pressed }) => [estilos.boton, camaraApagada ? estilos.claro : estilos.oscuro, pressed && estilos.presionado]}
                >
                  <Videollamada color={camaraApagada ? "#0B0B0F" : "#FFF"} tamano={22} />
                </Pressable>
                <Pressable onPress={cambiarCamara} style={({ pressed }) => [estilos.boton, estilos.oscuro, pressed && estilos.presionado]}>
                  <Text style={estilos.girar}>↺</Text>
                </Pressable>
              </>
            ) : null}
            <Pressable onPress={colgar} style={({ pressed }) => [estilos.boton, estilos.rojo, pressed && estilos.presionado]}>
              <Telefono color="#FFF" tamano={26} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: "#0B0B0F" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  esperando: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  encabezado: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", gap: 4 },
  nombre: { color: "#FFF", fontSize: 24, fontFamily: fuentes.semibold },
  etiqueta: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontVariant: ["tabular-nums"] },
  pip: { position: "absolute", right: 16, width: 108, height: 160, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  pipVideo: { width: "100%", height: "100%" },
  controles: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 18 },
  boton: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center" },
  rojo: { backgroundColor: "#E5484D" },
  verde: { backgroundColor: "#22C55E" },
  oscuro: { backgroundColor: "rgba(255,255,255,0.18)" },
  claro: { backgroundColor: "#FFF" },
  girar: { color: "#FFF", fontSize: 26, marginTop: -2 },
  presionado: { opacity: 0.75 },
});
