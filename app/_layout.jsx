import { Stack } from "expo-router";
import { useFonts, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { ProveedorTema, useTema } from "../components/tema";
import { ProveedorSolicitudes } from "../components/Solicitudes";
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
    </Stack>
  );
}

export default function RootLayout()
{
  const [listas] = useFonts({ Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold });

  if (!listas)
  {
    return null;
  }

  return (
    <ProveedorTema>
      <ProveedorSolicitudes>
        <Navegacion />
      </ProveedorSolicitudes>
    </ProveedorTema>
  );
}
