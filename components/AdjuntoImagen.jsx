import { useEffect, useState } from "react";
import { View, Image, Pressable, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "../lib/api";
import { descifrarArchivo } from "../lib/crypto";
import { leerCache, guardarCache } from "../lib/mediaCache";

const MAX_ANCHO = 248;
const MAX_ALTO = 320;

function medida(w, h)
{
  const escala = Math.min(MAX_ANCHO / w, MAX_ALTO / h, 1);
  return { width: Math.round(w * escala), height: Math.round(h * escala) };
}

export function AdjuntoImagen({ media, color })
{
  const [uri, setUri] = useState(() => leerCache(media.path) || null);
  const [dims, setDims] = useState(null);
  const [error, setError] = useState(false);
  const [abierta, setAbierta] = useState(false);

  useEffect(() =>
  {
    if (uri)
    {
      return;
    }
    let activo = true;
    (async () =>
    {
      try
      {
        const { url } = await api.urlMedia(media.path);
        const resp = await fetch(url);
        const bytes = new Uint8Array(await resp.arrayBuffer());
        const claro = descifrarArchivo(encodeBase64(bytes), media.k, media.n);
        if (activo && claro)
        {
          const dataUri = `data:${media.mime};base64,${claro}`;
          guardarCache(media.path, dataUri);
          setUri(dataUri);
        }
        else if (activo)
        {
          setError(true);
        }
      }
      catch (e)
      {
        if (activo)
        {
          setError(true);
        }
      }
    })();
    return () => { activo = false; };
  }, [media.path]);

  useEffect(() =>
  {
    if (!uri)
    {
      return;
    }
    let activo = true;
    Image.getSize(
      uri,
      (w, h) => activo && setDims(medida(w, h)),
      () => activo && setDims({ width: 210, height: 260 }),
    );
    return () => { activo = false; };
  }, [uri]);

  if (!uri || !dims)
  {
    return (
      <View style={estilos.caja}>
        {!error ? <ActivityIndicator color={color} /> : null}
      </View>
    );
  }

  return (
    <>
      <Pressable onPress={() => setAbierta(true)}>
        <Image source={{ uri }} style={[estilos.imagen, dims]} resizeMode="cover" />
      </Pressable>
      <Modal visible={abierta} transparent animationType="fade" onRequestClose={() => setAbierta(false)}>
        <Pressable style={estilos.fondo} onPress={() => setAbierta(false)}>
          <Image source={{ uri }} style={estilos.completa} resizeMode="contain" />
        </Pressable>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  imagen: { borderRadius: 14 },
  caja: { width: 210, height: 230, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  completa: { width: "100%", height: "100%" },
});
