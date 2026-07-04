import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

const DIR = `${FileSystem.documentDirectory}stickers/`;

async function asegurarDir()
{
  try
  {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
  catch (e)
  {
  }
}

export async function listarStickers()
{
  try
  {
    await asegurarDir();
    const nombres = await FileSystem.readDirectoryAsync(DIR);
    return nombres.filter((n) => n.endsWith(".png")).sort().reverse().map((n) => DIR + n);
  }
  catch (e)
  {
    return [];
  }
}

export async function crearSticker(uri)
{
  await asegurarDir();
  const r = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512 } }],
    { compress: 1, format: ImageManipulator.SaveFormat.PNG },
  );
  const destino = `${DIR}${Date.now()}.png`;
  await FileSystem.moveAsync({ from: r.uri, to: destino });
  return destino;
}

export async function borrarSticker(uri)
{
  try
  {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
  catch (e)
  {
  }
}
