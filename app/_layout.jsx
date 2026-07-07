import { useEffect, useRef, useState } from "react";
import { AppState, View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useFonts, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { ProveedorTema, useTema } from "../components/tema";
import { ProveedorSolicitudes } from "../components/Solicitudes";
import { BloqueoPin } from "../components/BloqueoPin";
import { tienePin } from "../lib/pin";
import { asegurarSocket } from "../lib/socket";
import { escucharLlamadas } from "../lib/llamadas";
import { arrancarSiActivo } from "../lib/cercania";
import { respaldoAutomatico } from "../lib/respaldo";
import { capturasBloqueadas, aplicarBloqueoCapturas } from "../lib/privacidad";
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
        animation: "slide_from_right",
        animationDuration: 220,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="registro" options={{ headerShown: false }} />
      <Stack.Screen name="recuperar" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ajustes" options={{ title: "Ajustes" }} />
      <Stack.Screen name="bloqueados" options={{ title: "Usuarios bloqueados" }} />
      <Stack.Screen name="agregar" options={{ title: "Agregar contacto" }} />
      <Stack.Screen name="solicitudes" options={{ title: "Solicitudes" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Conversación" }} />
      <Stack.Screen name="perfil/[id]" options={{ title: "Contacto" }} />
      <Stack.Screen name="multimedia/[id]" options={{ title: "Multimedia" }} />
      <Stack.Screen name="grupo/crear" options={{ title: "Nuevo grupo" }} />
      <Stack.Screen name="grupo/[id]" options={{ title: "Grupo" }} />
      <Stack.Screen name="grupo/info/[id]" options={{ title: "Info del grupo" }} />
      <Stack.Screen name="llamada" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="cercania" options={{ title: "Radar de cercanía" }} />
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
    asegurarSocket().then(() => escucharLlamadas()).catch(() => {});
    respaldoAutomatico();
    arrancarSiActivo().catch(() => {});
    const sub = AppState.addEventListener("change", (estado) =>
    {
      if (estado === "active")
      {
        asegurarSocket().then(() => escucharLlamadas()).catch(() => {});
        respaldoAutomatico();
        if (tiene.current)
        {
          setBloqueado(true);
        }
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
    capturasBloqueadas().then((v) => v && aplicarBloqueoCapturas(true));
  }, []);

  useEffect(() =>
  {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) =>
    {
      const datos = resp.notification.request.content.data || {};
      if (datos.de)
      {
        router.push({ pathname: "/chat/[id]", params: { id: datos.de } });
      }
      else if (datos.grupo)
      {
        router.push({ pathname: "/grupo/[id]", params: { id: datos.grupo } });
      }
    });
    return () => sub.remove();
  }, []);

  if (!listas)
  {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProveedorTema>
        <ProveedorSolicitudes>
          <Contenido />
        </ProveedorSolicitudes>
      </ProveedorTema>
    </GestureHandlerRootView>
  );
}
