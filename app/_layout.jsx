import { useEffect, useRef, useState } from "react";
import { AppState, View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useFonts, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { ProveedorTema, useTema } from "../components/tema";
import { ProveedorSolicitudes } from "../components/Solicitudes";
import { BloqueoPin } from "../components/BloqueoPin";
import { tienePin } from "../lib/pin";
import { fuentes } from "../assets/themes/temas";

function Navegacion()
{
  const { colores } = useTema();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.fondo },
        headerTintColor: colores.texto,
        headerTitleStyle: { fontFamily: fuentes.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="registro" options={{ headerShown: false }} />
      <Stack.Screen name="recuperar" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ajustes" options={{ title: "Ajustes" }} />
      <Stack.Screen name="agregar" options={{ title: "Agregar contacto" }} />
      <Stack.Screen name="solicitudes" options={{ title: "Solicitudes" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Conversación" }} />
      <Stack.Screen name="perfil/[id]" options={{ title: "Contacto" }} />
      <Stack.Screen name="ble" options={{ title: "BLE (prueba)" }} />
    </Stack>
  );
}

function Contenido()
{
  const [bloqueado, setBloqueado] = useState(false);
  const tiene = useRef(false);

  useEffect(() =>
  {
    tienePin().then((t) =>
    {
      tiene.current = t;
      setBloqueado(t);
    });
    const sub = AppState.addEventListener("change", (estado) =>
    {
      if (estado === "active" && tiene.current)
      {
        setBloqueado(true);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <Navegacion />
      {bloqueado ? (
        <View style={StyleSheet.absoluteFill}>
          <BloqueoPin onDesbloquear={() => setBloqueado(false)} />
        </View>
      ) : null}
    </>
  );
}

export default function RootLayout()
{
  const [listas] = useFonts({ Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold });

  useEffect(() =>
  {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) =>
    {
      const de = resp.notification.request.content.data?.de;
      if (de)
      {
        router.push({ pathname: "/chat/[id]", params: { id: de } });
      }
    });
    return () => sub.remove();
  }, []);

  if (!listas)
  {
    return null;
  }

  return (
    <ProveedorTema>
      <ProveedorSolicitudes>
        <Contenido />
      </ProveedorSolicitudes>
    </ProveedorTema>
  );
}
