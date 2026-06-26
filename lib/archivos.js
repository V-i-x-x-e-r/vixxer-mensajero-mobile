import * as FileSystem from "expo-file-system/legacy";

export async function leerBase64(uri)
{
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export async function escribirTemp(base64, ext)
{
  const uri = `${FileSystem.cacheDirectory}vx-${Date.now()}.${ext}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}
