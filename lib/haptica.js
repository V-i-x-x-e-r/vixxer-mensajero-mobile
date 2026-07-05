import { Platform } from "react-native";

function modulo()
{
  if (Platform.OS === "web")
  {
    return null;
  }
  try
  {
    return require("expo-haptics");
  }
  catch (e)
  {
    return null;
  }
}

export function tick()
{
  const h = modulo();
  if (h)
  {
    h.impactAsync(h.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function impacto()
{
  const h = modulo();
  if (h)
  {
    h.impactAsync(h.ImpactFeedbackStyle.Medium).catch(() => {});
  }
}

export function exito()
{
  const h = modulo();
  if (h)
  {
    h.notificationAsync(h.NotificationFeedbackType.Success).catch(() => {});
  }
}
