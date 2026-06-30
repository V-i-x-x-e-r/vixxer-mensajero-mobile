import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, Linking, StyleSheet } from "react-native";
import { disponible, pedirPermisos, escanear } from "../lib/ble";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";

export default function Ble()
{
  const { colores } = useTema();
  const [buscando, setBuscando] = useState(false);
  const [dispositivos, setDispositivos] = useState([]);
  const [estado, setEstado] = useState(disponible() ? "listo" : "ble-plx no está en este build");
  const detener = useRef(null);

  useEffect(() => () => detener.current && detener.current(), []);

  async function alternar()
  {
    if (buscando)
    {
      detener.current && detener.current();
      detener.current = null;
      setBuscando(false);
      setEstado("detenido");
      return;
    }
    if (!disponible())
    {
      setEstado("ble-plx no está en este build (rebuild)");
      return;
    }
    try
    {
      const permiso = await pedirPermisos();
      setEstado("permisos: " + permiso.detalle);
      if (!permiso.ok)
      {
        return;
      }
      setDispositivos([]);
      setBuscando(true);
      detener.current = escanear(
        (d) => setDispositivos((prev) => (prev.some((x) => x.id === d.id) ? prev : [...prev, { id: d.id, nombre: d.name || d.localName || "—", rssi: d.rssi }])),
        (e) => setEstado(String(e)),
      );
    }
    catch (e)
    {
      setEstado("error: " + (e && e.message ? e.message : String(e)));
      setBuscando(false);
    }
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Text style={[estilos.nota, { color: colores.muted }]}>
        Prueba de Bluetooth. Pulsa Buscar y deben aparecer dispositivos BLE cercanos.
      </Text>

      <View style={[estilos.estado, { borderColor: colores.borde }]}>
        <Text style={[estilos.estadoTxt, { color: colores.texto }]}>Estado: {estado}</Text>
      </View>

      <Pressable onPress={alternar} style={({ pressed }) => [estilos.boton, { backgroundColor: colores.botonFondo }, pressed && { opacity: 0.7 }]}>
        <Text style={[estilos.botonTxt, { color: colores.botonTexto }]}>{buscando ? "Detener" : "Buscar"}</Text>
      </Pressable>

      <Pressable onPress={() => Linking.openSettings()} style={({ pressed }) => [estilos.botonSec, { borderColor: colores.borde }, pressed && { opacity: 0.6 }]}>
        <Text style={[estilos.botonSecTxt, { color: colores.texto }]}>Abrir permisos de la app</Text>
      </Pressable>

      <FlatList
        data={dispositivos}
        keyExtractor={(d) => d.id}
        style={estilos.lista}
        renderItem={({ item }) => (
          <View style={[estilos.fila, { borderColor: colores.borde }]}>
            <Text style={[estilos.nombre, { color: colores.texto }]}>{item.nombre}</Text>
            <Text style={[estilos.detalle, { color: colores.muted }]}>{item.id} · {item.rssi} dBm</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={[estilos.detalle, { color: colores.muted, textAlign: "center", marginTop: 24 }]}>{buscando ? "Buscando…" : "Sin resultados aún."}</Text>}
      />
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
  lista: { marginTop: 16 },
  fila: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  nombre: { fontSize: 15, fontFamily: fuentes.media },
  detalle: { fontSize: 12, marginTop: 2 },
});
