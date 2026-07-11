import { createAudioPlayer } from "expo-audio";

let player = null;
let actual = null;
let ultimo = null;
const oyentes = new Set();

function emitir()
{
  for (const oyente of oyentes)
  {
    oyente(actual, ultimo);
  }
}

function asegurarPlayer()
{
  if (!player)
  {
    player = createAudioPlayer(null, { updateInterval: 250 });
    player.addListener("playbackStatusUpdate", (estado) =>
    {
      ultimo = estado;
      emitir();
    });
  }
  return player;
}

export function suscribirAudio(oyente)
{
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function estadoAudio(id)
{
  return actual === id ? ultimo : null;
}

export function reproducirAudio(id, uri, velocidad = 1)
{
  const p = asegurarPlayer();
  if (actual !== id)
  {
    actual = id;
    ultimo = null;
    p.replace(uri);
    emitir();
  }
  try
  {
    p.setPlaybackRate(velocidad, "high");
  }
  catch (e)
  {
  }
  p.play();
}

export function pausarAudio()
{
  if (player)
  {
    player.pause();
  }
}

export function buscarAudio(id, segundos)
{
  if (player && actual === id)
  {
    player.seekTo(segundos);
  }
}

export function velocidadAudio(id, velocidad)
{
  if (player && actual === id)
  {
    try
    {
      player.setPlaybackRate(velocidad, "high");
    }
    catch (e)
    {
    }
  }
}
