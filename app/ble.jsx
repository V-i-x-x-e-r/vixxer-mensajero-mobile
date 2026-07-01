import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Switch, FlatList, Linking, StyleSheet } from "react-native";
import { disponible, pedirPermisos, escanear, anunciar, detenerAnuncio, anuncioDisponible, alRecibir, conectarYEnviar } from "../lib/ble";
import { registrarPeer, olvidarPeers, iniciarPuente, detenerPuente } from "../lib/bleMensajeria";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";

export default function Ble()
{
  const { colores } = useTema();
  const [buscando, setBuscando] = useState(false);
  const [soloVixxer, setSoloVixxer] = useState(true);
  const [puente, setPuente] = useState(false);
  const [dispositivos, setDispositivos] = useState([]);
  const [objetivo, setObjetivo] = useState(null);
  const [recibidos, setRecibidos] = useState([]);
  const [estado, setEstado] = useState(disponible() ? "listo" : "ble-plx no está en este build");
  const detener = useRef(null);
  const quitarRx = useRef(null);

  useEffect(() => () =>
  {
    detener.current && detener.current();
    quitarRx.current && quitarRx.current();
    detenerAnuncio();
    detenerPuente();
    olvidarPeers();
  }, []);

  async function alternarPuente()
  {
    if (puente)
    {
      detenerAnuncio();
      detenerPuente();
      quitarRx.current && quitarRx.current();
      quitarRx.current = null;
      setPuente(false);
      setEstado("puente apagado");
      return;
    }
    if (!anuncioDisponible())
    {
      setEstado("módulo de puente no está en este build (haz un eas build nuevo)");
      return;
    }
    const p = await pedirPermisos();
    if (!p.ok)
    {
      setEstado("permisos: " + p.detalle);
      return;
    }
    const ok = anunciar();
    if (!ok)
    {
      setEstado("no se pudo anunciar (adaptador/permiso)");
      return;
    }
    await iniciarPuente();
    quitarRx.current = alRecibir((texto) =>
    {
      let etiqueta = texto;
      try
      {
        const obj = JSON.parse(texto);
        etiqueta = obj.t === "ping" ? `ping: ${obj.texto}` : `sobre para ${String(obj.destinatarioId || "").slice(0, 8)}…`;
      }
      catch (e)
      {
      }
      setRecibidos((prev) => [{ id: `${Date.now()}-${Math.random()}`, etiqueta }, ...prev].slice(0, 30));
    });
    setPuente(true);
    setEstado("puente activo: anunciando, sirviendo y escuchando");
  }

  async function alternarBuscar()
  {
    if (buscando)
    {
      detener.current && detener.current();
      detener.current = null;
      setBuscando(false);
      setEstado("búsqueda detenida");
      return;
    }
    if (!disponible())
    {
      setEstado("ble-plx no está en este build (rebuild)");
      return;
    }
    const permiso = await pedirPermisos();
    if (!permiso.ok)
    {
      setEstado("permisos: " + permiso.detalle);
      return;
    }
    setDispositivos([]);
    setBuscando(true);
    detener.current = escanear(
      (d) =>
      {
        registrarPeer(d.id);
        setDispositivos((prev) => (prev.some((x) => x.id === d.id) ? prev : [...prev, { id: d.id, nombre: d.name || d.localName || "Vixxer", rssi: d.rssi }]));
      },
      (e) => setEstado(String(e)),
      soloVixxer,
    );
  }

  async function enviarPrueba()
  {
    if (!objetivo)
    {
      setEstado("elige un dispositivo de la lista");
      return;
    }
    setEstado("enviando prueba…");
    const carga = JSON.stringify({ t: "ping", texto: "Hola desde Vixxer", ts: Date.now() });
    const ok = await conectarYEnviar(objetivo, carga);
    setEstado(ok ? "prueba enviada ✓" : "no se pudo enviar (¿el otro tiene el puente activo?)");
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Text style={[estilos.nota, { color: colores.muted }]}>
        Puente sin internet. En ambos teléfonos activa el puente. En uno busca, elige el otro y envía la prueba: debe aparecer en Recibidos del otro.
      </Text>

      <View style={[estilos.estado, { borderColor: colores.borde }]}>
        <Text style={[estilos.estadoTxt, { color: colores.texto }]}>Estado: {estado}</Text>
      </View>

      <Pressable onPress={alternarPuente} style={({ pressed }) => [estilos.boton, { backgroundColor: puente ? colores.error : colores.botonFondo }, pressed && { opacity: 0.7 }]}>
        <Text style={[estilos.botonTxt, { color: colores.botonTexto }]}>{puente ? "Apagar puente" : "Activar puente"}</Text>
      </Pressable>

      <Pressable onPress={alternarBuscar} style={({ pressed }) => [estilos.botonSec, { borderColor: colores.borde }, pressed && { opacity: 0.6 }]}>
        <Text style={[estilos.botonSecTxt, { color: colores.texto }]}>{buscando ? "Detener búsqueda" : "Buscar dispositivos"}</Text>
      </Pressable>

      <Pressable onPress={enviarPrueba} disabled={!objetivo} style={({ pressed }) => [estilos.botonSec, { borderColor: colores.borde, opacity: objetivo ? 1 : 0.4 }, pressed && { opacity: 0.6 }]}>
        <Text style={[estilos.botonSecTxt, { color: colores.texto }]}>Enviar prueba al elegido</Text>
      </Pressable>

      <View style={[estilos.switchFila, { borderColor: colores.borde }]}>
        <Text style={[estilos.switchTxt, { color: colores.texto }]}>Solo teléfonos Vixxer</Text>
        <Switch
          value={soloVixxer}
          onValueChange={setSoloVixxer}
          disabled={buscando}
          trackColor={{ true: colores.texto, false: colores.borde }}
          thumbColor={colores.fondo}
        />
      </View>

      <Pressable onPress={() => Linking.openSettings()} style={({ pressed }) => [estilos.botonSec, { borderColor: colores.borde }, pressed && { opacity: 0.6 }]}>
        <Text style={[estilos.botonSecTxt, { color: colores.muted }]}>Abrir permisos de la app</Text>
      </Pressable>

      <Text style={[estilos.seccion, { color: colores.muted }]}>DISPOSITIVOS</Text>
      <FlatList
        data={dispositivos}
        keyExtractor={(d) => d.id}
        style={estilos.lista}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setObjetivo(item.id)}
            style={({ pressed }) => [estilos.fila, { borderColor: objetivo === item.id ? colores.botonFondo : colores.borde }, pressed && { opacity: 0.6 }]}
          >
            <Text style={[estilos.nombre, { color: colores.texto }]}>{item.nombre}{objetivo === item.id ? "  ·  elegido" : ""}</Text>
            <Text style={[estilos.detalle, { color: colores.muted }]}>{item.id} · {item.rssi} dBm</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={[estilos.detalle, { color: colores.muted, textAlign: "center", marginTop: 12 }]}>{buscando ? "Buscando…" : "Sin resultados aún."}</Text>}
      />

      {recibidos.length > 0 ? (
        <>
          <Text style={[estilos.seccion, { color: colores.muted }]}>RECIBIDOS</Text>
          <FlatList
            data={recibidos}
            keyExtractor={(r) => r.id}
            style={estilos.listaCorta}
            renderItem={({ item }) => (
              <View style={[estilos.fila, { borderColor: colores.borde }]}>
                <Text style={[estilos.nombre, { color: colores.texto }]}>{item.etiqueta}</Text>
              </View>
            )}
          />
        </>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 20 },
  nota: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  estado: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
  estadoTxt: { fontSize: 12, fontFamily: fuentes.media },
  boton: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  botonTxt: { fontSize: 15, fontFamily: fuentes.semibold },
  botonSec: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  botonSecTxt: { fontSize: 14, fontFamily: fuentes.media },
  switchFila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginTop: 10 },
  switchTxt: { fontSize: 14 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  lista: { maxHeight: 200 },
  listaCorta: { maxHeight: 150 },
  fila: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  nombre: { fontSize: 15, fontFamily: fuentes.media },
  detalle: { fontSize: 12, marginTop: 2 },
});
