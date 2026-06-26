import { useEffect, useState } from "react";
import { View, Image, Pressable, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "../lib/api";
import { descifrarArchivo } from "../lib/crypto";

export function AdjuntoImagen({ media, color })
{
  const [uri, setUri] = useState(null);
  const [error, setError] = useState(false);
  const [abierta, setAbierta] = useState(false);

  useEffect(() =>
  {
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
          setUri(`data:${media.mime};base64,${claro}`);
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

  if (!uri)
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
        <Image source={{ uri }} style={estilos.imagen} resizeMode="cover" />
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
  imagen: { width: 210, height: 260, borderRadius: 12 },
  caja: { width: 210, height: 260, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  completa: { width: "100%", height: "100%" },
});
