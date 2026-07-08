import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing, Alert, Dimensions, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import Svg, { Circle, Line } from "react-native-svg";
import { estadoCercania, alCambio, listaPeers, cercaniaSoportada, activarModo } from "../lib/cercania";
import { estadisticasMesh } from "../lib/bleMensajeria";
import { obtenerSocket } from "../lib/socket";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { Logo } from "../components/Logo";

const AZUL = "#38BDF8";
const VERDE = "#22C55E";
const AMBAR = "#FFD166";

function anguloDe(id)
{
  let h = 0;
  for (let i = 0; i < id.length; i++)
  {
    h = (h * 31 + id.charCodeAt(i)) % 360;
  }
  return h;
}

function radioDe(rssi, maximo)
{
  const fuerza = Math.min(Math.max(-rssi - 40, 0), 60) / 60;
  return 44 + fuerza * (maximo - 60);
}

function barrasDe(rssi)
{
  if (rssi > -60) { return 3; }
  if (rssi > -80) { return 2; }
  return 1;
}

export default function Cercania()
{
  const { colores } = useTema();
  const [cerca, setCerca] = useState(estadoCercania());
  const [peers, setPeers] = useState(listaPeers());
  const [stats, setStats] = useState(estadisticasMesh());
  const [enLinea, setEnLinea] = useState(!!obtenerSocket()?.connected);
  const giro = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => alCambio((e) =>
  {
    setCerca(e);
    setPeers(listaPeers());
  }), []);

  useEffect(() =>
  {
    const reloj = setInterval(() =>
    {
      setStats(estadisticasMesh());
      setEnLinea(!!obtenerSocket()?.connected);
      setPeers(listaPeers());
    }, 2000);
    return () => clearInterval(reloj);
  }, []);

  useEffect(() =>
  {
    giro.setValue(0);
    const anim = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: peers.length > 0 ? 1900 : 3200, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [peers.length > 0]);

  useEffect(() =>
  {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  async function alternarRadar()
  {
    if (cerca.activo)
    {
      await activarModo(false);
      return;
    }
    const r = await activarModo(true);
    if (!r.ok && r.razon)
    {
      Alert.alert("No se pudo activar", r.razon);
    }
  }

  const lado = Math.min(Dimensions.get("window").width - 40, 340);
  const centro = lado / 2;
  const rotacion = giro.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const salida = enLinea
    ? { texto: "Servidor Vixxer", detalle: "Tienes internet: tus mensajes salen directo y actúas de puente para otros.", color: VERDE }
    : cerca.activo && peers.length > 0
      ? { texto: "Puente por cercanía", detalle: "Sin internet: tus mensajes saltan por Bluetooth hasta un teléfono con conexión.", color: AZUL }
      : cerca.activo
        ? { texto: "Buscando vixxers cerca…", detalle: "Sin internet y sin vixxers al alcance todavía.", color: AMBAR }
        : { texto: "Modo cercanía apagado", detalle: "Actívalo en Ajustes → Sin internet para mensajear sin red.", color: colores.muted };

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Stack.Screen options={{ title: "Radar de cercanía" }} />

      <View style={estilos.zonaRadar}>
        <View style={{ width: lado, height: lado }}>
          <Svg width={lado} height={lado}>
            {[0.32, 0.62, 0.94].map((f) => (
              <Circle key={f} cx={centro} cy={centro} r={(lado / 2) * f} stroke={colores.borde} strokeWidth="1" fill="none" />
            ))}
            <Line x1={centro} y1={6} x2={centro} y2={lado - 6} stroke={colores.borde} strokeWidth="0.5" />
            <Line x1={6} y1={centro} x2={lado - 6} y2={centro} stroke={colores.borde} strokeWidth="0.5" />
          </Svg>

          {cerca.activo ? (
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotacion }] }]} pointerEvents="none">
              <View style={[estilos.barrido, { left: centro - 1, height: centro - 8, backgroundColor: salida.color }]} />
              <View style={[estilos.estela, { left: centro - 5, height: centro - 8, backgroundColor: salida.color }]} />
            </Animated.View>
          ) : null}

          {cerca.activo ? (
            <Animated.View
              pointerEvents="none"
              style={[
                estilos.onda,
                {
                  left: centro - 24,
                  top: centro - 24,
                  borderColor: salida.color,
                  opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                  transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 3.4] }) }],
                },
              ]}
            />
          ) : null}

          {peers.map((p) =>
          {
            const ang = (anguloDe(p.id) * Math.PI) / 180;
            const r = radioDe(p.rssi, centro - 16);
            const x = centro + r * Math.cos(ang);
            const y = centro + r * Math.sin(ang);
            return (
              <View key={p.id} style={{ position: "absolute", left: x - 7, top: y - 7 }}>
                <Animated.View
                  style={[
                    estilos.peerOnda,
                    {
                      opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                      transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
                    },
                  ]}
                />
                <View style={[estilos.peer, { backgroundColor: AZUL }]}>
                  <View style={estilos.peerPulso} />
                </View>
                <Text style={[estilos.peerEtiqueta, { color: colores.muted }]}>
                  {String(p.id).replace(/[^A-Za-z0-9]/g, "").slice(-4).toUpperCase()}
                </Text>
              </View>
            );
          })}

          <Pressable onPress={alternarRadar} style={[estilos.centro, { left: centro - 24, top: centro - 24, backgroundColor: colores.fondo, borderColor: salida.color }]}>
            <Logo alto={22} />
          </Pressable>
        </View>

        <Text style={[estilos.conteo, { color: colores.texto }]}>
          {cerca.activo ? `${peers.length} vixxer${peers.length === 1 ? "" : "s"} cerca` : "radar apagado"}
        </Text>

        {cercaniaSoportada() ? (
          <Pressable
            onPress={alternarRadar}
            style={({ pressed }) => [estilos.botonRadar, { borderColor: colores.borde, backgroundColor: cerca.activo ? "transparent" : colores.botonFondo }, pressed && { opacity: 0.7 }]}
          >
            <Text style={{ color: cerca.activo ? colores.texto : colores.botonTexto, fontFamily: fuentes.semibold, fontSize: 13 }}>
              {cerca.activo ? "Apagar radar" : "Encender radar"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[estilos.panel, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
        <Text style={[estilos.panelTitulo, { color: colores.muted }]}>TU SALIDA A INTERNET</Text>
        <View style={estilos.salidaFila}>
          <View style={[estilos.punto, { backgroundColor: salida.color }]} />
          <Text style={[estilos.salidaTxt, { color: colores.texto }]}>{salida.texto}</Text>
        </View>
        <Text style={[estilos.salidaDetalle, { color: colores.muted }]}>{salida.detalle}</Text>
        {stats.ultimaRuta ? (
          <Text style={[estilos.salidaDetalle, { color: colores.muted }]}>
            Último salto: dispositivo {String(stats.ultimaRuta).slice(0, 8)}…
          </Text>
        ) : null}
      </View>

      <View style={estilos.statsFila}>
        {[
          { n: stats.enviados, t: "enviados\npor mesh" },
          { n: stats.recibidos, t: "recibidos\npor mesh" },
          { n: stats.reenviados, t: "reenviados\npara otros" },
          { n: stats.puente, t: "subidos como\npuente" },
        ].map((s) => (
          <View key={s.t} style={[estilos.stat, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text style={[estilos.statN, { color: colores.texto }]}>{s.n}</Text>
            <Text style={[estilos.statT, { color: colores.muted }]}>{s.t}</Text>
          </View>
        ))}
      </View>

      {peers.length > 0 ? (
        <View style={estilos.listaPeers}>
          {peers.slice(0, 4).map((p) => (
            <View key={p.id} style={estilos.peerFila}>
              <View style={estilos.senal}>
                {[1, 2, 3].map((b) => (
                  <View key={b} style={[estilos.barra, { height: 4 + b * 3, backgroundColor: b <= barrasDe(p.rssi) ? AZUL : colores.borde }]} />
                ))}
              </View>
              <Text style={[estilos.peerTxt, { color: colores.texto }]}>Vixxer {String(p.id).replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase()}</Text>
              <Text style={[estilos.peerRssi, { color: colores.muted }]}>{p.rssi} dBm</Text>
            </View>
          ))}
        </View>
      ) : null}

      {!cercaniaSoportada() ? (
        <Text style={[estilos.salidaDetalle, { color: colores.muted, textAlign: "center", padding: 20 }]}>
          Este build no trae el módulo de cercanía.
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  zonaRadar: { alignItems: "center", paddingTop: 24 },
  barrido: { position: "absolute", top: 8, width: 2, borderRadius: 1, opacity: 0.8 },
  estela: { position: "absolute", top: 8, width: 10, borderRadius: 5, opacity: 0.12 },
  onda: { position: "absolute", width: 48, height: 48, borderRadius: 24, borderWidth: 2 },
  peerOnda: { position: "absolute", left: -3, top: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: "#38BDF8" },
  peerEtiqueta: { position: "absolute", top: 16, left: -12, width: 40, textAlign: "center", fontSize: 9 },
  botonRadar: { marginTop: 10, borderWidth: 1, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8 },
  peer: { position: "absolute", width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  peerPulso: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFF" },
  centro: { position: "absolute", width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  conteo: { fontSize: 15, fontFamily: fuentes.semibold, marginTop: 10 },
  panel: { borderWidth: 1, borderRadius: 14, marginHorizontal: 20, marginTop: 18, padding: 16, gap: 6 },
  panelTitulo: { fontSize: 11, fontFamily: fuentes.semibold, letterSpacing: 1 },
  salidaFila: { flexDirection: "row", alignItems: "center", gap: 8 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  salidaTxt: { fontSize: 16, fontFamily: fuentes.semibold },
  salidaDetalle: { fontSize: 12, lineHeight: 17 },
  statsFila: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 12 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: "center", paddingVertical: 10, gap: 2 },
  statN: { fontSize: 18, fontFamily: fuentes.bold },
  statT: { fontSize: 9, textAlign: "center", lineHeight: 12 },
  listaPeers: { marginTop: 14, paddingHorizontal: 24, gap: 8 },
  peerFila: { flexDirection: "row", alignItems: "center", gap: 10 },
  senal: { flexDirection: "row", alignItems: "flex-end", gap: 2, width: 20 },
  barra: { width: 4, borderRadius: 1 },
  peerTxt: { flex: 1, fontSize: 14, fontFamily: fuentes.media },
  peerRssi: { fontSize: 12 },
});
