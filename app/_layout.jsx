import { Stack } from "expo-router";
import { ProveedorTema, useTema } from "../components/tema";

function Navegacion()
{
  const { colores } = useTema();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.fondo },
        headerTintColor: colores.texto,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="registro" options={{ headerShown: false }} />
      <Stack.Screen name="chats" options={{ headerShown: false }} />
      <Stack.Screen name="ajustes" options={{ title: "Ajustes" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Conversación" }} />
    </Stack>
  );
}

export default function RootLayout()
{
  return (
    <ProveedorTema>
      <Navegacion />
    </ProveedorTema>
  );
}
