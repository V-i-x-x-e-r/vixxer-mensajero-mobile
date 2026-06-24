import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as api from "../lib/api";
import { useTema } from "../components/tema";
import { Campo } from "../components/Campo";
import { Boton } from "../components/Boton";

export default function Agregar()
{
  const { colores } = useTema();
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar()
  {
    setEstado("");
    setCargando(true);

    try
    {
      await api.solicitarAmigo(codigo.trim());
      setEstado("Solicitud enviada");
      setCodigo("");
    }
    catch (e)
    {
      if (e.status === 404)
      {
        setEstado("Código no encontrado");
      }
      else if (e.status === 409)
      {
        setEstado("Ya enviaste una solicitud");
      }
      else if (e.status === 400)
      {
        setEstado("Ese es tu propio código");
      }
      else
      {
        setEstado("No se pudo enviar la solicitud");
      }
    }
    finally
    {
      setCargando(false);
    }
  }

  const ok = estado === "Solicitud enviada";

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Text style={[estilos.ayuda, { color: colores.muted }]}>
        Pide a tu contacto su código de amigo y escríbelo aquí.
      </Text>
      <Campo
        valor={codigo}
        setValor={setCodigo}
        placeholder="Código de amigo"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {estado ? <Text style={{ color: ok ? colores.texto : colores.error, fontSize: 14 }}>{estado}</Text> : null}
      <Boton titulo="Enviar solicitud" onPress={enviar} cargando={cargando} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 20, gap: 16 },
  ayuda: { fontSize: 14, lineHeight: 20 },
});
