import { Tabs } from "expo-router";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Chat } from "../../components/Chat";
import { Amigos } from "../../components/Amigos";

export default function TabsLayout()
{
  const { colores } = useTema();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.texto,
        tabBarInactiveTintColor: colores.muted,
        tabBarStyle: { backgroundColor: colores.fondo, borderTopColor: colores.borde },
        tabBarLabelStyle: { fontFamily: fuentes.media, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{ title: "Chats", tabBarIcon: ({ color }) => <Chat color={color} tamano={24} /> }}
      />
      <Tabs.Screen
        name="amigos"
        options={{ title: "Amigos", tabBarIcon: ({ color }) => <Amigos color={color} tamano={24} /> }}
      />
    </Tabs>
  );
}
