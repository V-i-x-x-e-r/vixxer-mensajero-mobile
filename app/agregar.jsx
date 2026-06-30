import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as api from "../lib/api";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { Campo } from "../components/Campo";
import { Boton } from "../components/Boton";
import { EscanerQR } from "../components/EscanerQR";

export default function Agregar()
{
  const { colores } = useTema();
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);

  async function enviar(valor)
  {
    const codigoFinal = (valor ?? codigo).trim();
    if (!codigoFinal)
    {
      return;
    }
    setEstado("");
    setCargando(true);

    try
    {
      await api.solicitarAmigo(codigoFinal);
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

  function alLeerQR(valor)
  {
    setEscaneando(false);
    setCodigo(valor);
    enviar(valor);
  }

  const ok = estado === "Solicitud enviada";

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Text style={[estilos.ayuda, { color: colores.muted }]}>
        Pide a tu contacto su código de amigo y escríbelo, o escanea su código QR.
      </Text>
      <Campo
        valor={codigo}
        setValor={setCodigo}
        placeholder="Código de amigo"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {estado ? <Text style={{ color: ok ? colores.texto : colores.error, fontSize: 14 }}>{estado}</Text> : null}
      <Boton titulo="Enviar solicitud" onPress={() => enviar()} cargando={cargando} />

      <Pressable onPress={() => setEscaneando(true)} style={({ pressed }) => [estilos.escanear, { borderColor: colores.borde }, pressed && { opacity: 0.6 }]}>
        <Text style={[estilos.escanearTxt, { color: colores.texto }]}>Escanear código QR</Text>
      </Pressable>

      <EscanerQR visible={escaneando} onLeido={alLeerQR} onCerrar={() => setEscaneando(false)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 20, gap: 16 },
  ayuda: { fontSize: 14, lineHeight: 20 },
  escanear: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  escanearTxt: { fontSize: 15, fontFamily: fuentes.media },
});
