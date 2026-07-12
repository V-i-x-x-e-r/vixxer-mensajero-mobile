import { createAudioPlayer } from "expo-audio";

let player = null;
let sub = null;
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

function soltar()
{
  if (sub)
  {
    sub.remove();
    sub = null;
  }
  if (player)
  {
    try
    {
      player.release();
    }
    catch (e)
    {
    }
    player = null;
  }
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
  if (actual !== id || !player)
  {
    soltar();
    actual = id;
    ultimo = null;
    player = createAudioPlayer(uri, { updateInterval: 250 });
    sub = player.addListener("playbackStatusUpdate", (estado) =>
    {
      ultimo = estado;
      emitir();
    });
    emitir();
  }
  try
  {
    player.setPlaybackRate(velocidad, "high");
  }
  catch (e)
  {
  }
  player.play();
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
