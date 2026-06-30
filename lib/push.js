import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function prepararCanal()
{
  if (Platform.OS === "android")
  {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Mensajes",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function registrarPush()
{
  if (!Device.isDevice)
  {
    return;
  }
  try
  {
    await prepararCanal();
    const actual = await Notifications.getPermissionsAsync();
    let permiso = actual.status;
    if (permiso !== "granted")
    {
      const pedido = await Notifications.requestPermissionsAsync();
      permiso = pedido.status;
    }
    if (permiso !== "granted")
    {
      return;
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.guardarPushToken(token, Platform.OS);
  }
  catch (e)
  {
  }
}
