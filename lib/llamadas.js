import { router } from "expo-router";
import { obtenerSocket } from "./socket";

let webrtc = null;

function mod()
{
  if (!webrtc)
  {
    try
    {
      webrtc = require("react-native-webrtc");
    }
    catch (e)
    {
      webrtc = null;
    }
  }
  return webrtc;
}

export function llamadasDisponibles()
{
  return !!mod();
}

const ICE = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ],
};

function audioLlamada()
{
  try
  {
    return require("react-native-incall-manager").default;
  }
  catch (e)
  {
    return null;
  }
}

let pc = null;
let localStream = null;
let remoteStream = null;
let conId = null;
let conNombre = "";
let fase = "libre";
let esVideo = false;
let ofertaPendiente = null;
let candidatosPendientes = [];
const oyentes = new Set();

export function estadoLlamada()
{
  return { fase, con: conId, nombre: conNombre, video: esVideo, local: localStream, remoto: remoteStream };
}

export function alLlamada(cb)
{
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

function avisar()
{
  const e = estadoLlamada();
  for (const cb of oyentes)
  {
    cb(e);
  }
}

let altavoz = false;

async function abrirMedia(video)
{
  const { mediaDevices } = mod();
  localStream = await mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: "user" } : false });
  const audio = audioLlamada();
  if (audio)
  {
    audio.start({ media: video ? "video" : "audio" });
    altavoz = !!video;
    audio.setForceSpeakerphoneOn(altavoz);
  }
}

export function alternarAltavoz()
{
  const audio = audioLlamada();
  altavoz = !altavoz;
  if (audio)
  {
    audio.setForceSpeakerphoneOn(altavoz);
  }
  return altavoz;
}

export function altavozActivo()
{
  return altavoz;
}

async function crearPc(paraId)
{
  const { RTCPeerConnection } = mod();
  pc = new RTCPeerConnection(ICE);
  pc.addEventListener("icecandidate", (e) =>
  {
    if (e.candidate)
    {
      obtenerSocket()?.emit("llamada:ice", { para: paraId, candidato: e.candidate });
    }
  });
  pc.addEventListener("track", (e) =>
  {
    if (e.streams && e.streams[0])
    {
      remoteStream = e.streams[0];
      avisar();
    }
  });
  pc.addEventListener("connectionstatechange", () =>
  {
    if (pc && ["failed", "closed"].includes(pc.connectionState))
    {
      limpiar();
      avisar();
    }
  });
  for (const track of localStream.getTracks())
  {
    pc.addTrack(track, localStream);
  }
}

async function vaciarCandidatos()
{
  const { RTCIceCandidate } = mod();
  for (const c of candidatosPendientes)
  {
    try
    {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    }
    catch (e)
    {
    }
  }
  candidatosPendientes = [];
}

export async function iniciarLlamada(paraId, nombre, video)
{
  if (fase !== "libre" || !mod())
  {
    return false;
  }
  esVideo = !!video;
  conId = paraId;
  conNombre = nombre || "";
  fase = "llamando";
  candidatosPendientes = [];
  try
  {
    await abrirMedia(esVideo);
    await crearPc(paraId);
    const oferta = await pc.createOffer();
    await pc.setLocalDescription(oferta);
    obtenerSocket()?.emit("llamada:ofrecer", { para: paraId, sdp: pc.localDescription, video: esVideo });
    avisar();
    return true;
  }
  catch (e)
  {
    limpiar();
    avisar();
    return false;
  }
}

export async function contestar()
{
  const of = ofertaPendiente;
  if (!of || !mod())
  {
    return false;
  }
  const { RTCSessionDescription } = mod();
  try
  {
    await abrirMedia(esVideo);
    await crearPc(of.de);
    await pc.setRemoteDescription(new RTCSessionDescription(of.sdp));
    await vaciarCandidatos();
    const resp = await pc.createAnswer();
    await pc.setLocalDescription(resp);
    obtenerSocket()?.emit("llamada:contestar", { para: of.de, sdp: pc.localDescription });
    ofertaPendiente = null;
    fase = "activa";
    avisar();
    return true;
  }
  catch (e)
  {
    colgar();
    return false;
  }
}

export function colgar()
{
  if (conId)
  {
    obtenerSocket()?.emit("llamada:colgar", { para: conId });
  }
  limpiar();
  avisar();
}

function limpiar()
{
  const audio = audioLlamada();
  if (audio)
  {
    try
    {
      audio.stop();
    }
    catch (e)
    {
    }
  }
  altavoz = false;
  try
  {
    if (pc)
    {
      pc.close();
    }
  }
  catch (e)
  {
  }
  pc = null;
  try
  {
    if (localStream)
    {
      localStream.getTracks().forEach((t) => t.stop());
    }
  }
  catch (e)
  {
  }
  localStream = null;
  remoteStream = null;
  conId = null;
  conNombre = "";
  fase = "libre";
  esVideo = false;
  ofertaPendiente = null;
  candidatosPendientes = [];
}

export function alternarSilencio()
{
  const pista = localStream && localStream.getAudioTracks()[0];
  if (pista)
  {
    pista.enabled = !pista.enabled;
    return !pista.enabled;
  }
  return false;
}

export function cambiarCamara()
{
  const pista = localStream && localStream.getVideoTracks()[0];
  if (pista && pista._switchCamera)
  {
    pista._switchCamera();
  }
}

export function alternarCamara()
{
  const pista = localStream && localStream.getVideoTracks()[0];
  if (pista)
  {
    pista.enabled = !pista.enabled;
    return !pista.enabled;
  }
  return false;
}

export function escucharLlamadas()
{
  const socket = obtenerSocket();
  if (!socket || !mod())
  {
    return;
  }
  socket.off("llamada:ofrecer");
  socket.off("llamada:contestar");
  socket.off("llamada:ice");
  socket.off("llamada:colgar");
  socket.on("llamada:ofrecer", (data) =>
  {
    if (fase !== "libre")
    {
      socket.emit("llamada:colgar", { para: data.de });
      return;
    }
    ofertaPendiente = data;
    fase = "entrante";
    conId = data.de;
    conNombre = data.usuario || "";
    esVideo = !!data.video;
    candidatosPendientes = [];
    avisar();
    router.push({ pathname: "/llamada", params: { entrante: "1" } });
  });
  socket.on("llamada:contestar", async (data) =>
  {
    if (!pc || data.de !== conId)
    {
      return;
    }
    const { RTCSessionDescription } = mod();
    try
    {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      await vaciarCandidatos();
      fase = "activa";
      avisar();
    }
    catch (e)
    {
    }
  });
  socket.on("llamada:ice", async (data) =>
  {
    if (data.de !== conId || !data.candidato)
    {
      return;
    }
    if (pc && pc.remoteDescription)
    {
      const { RTCIceCandidate } = mod();
      try
      {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidato));
      }
      catch (e)
      {
      }
    }
    else
    {
      candidatosPendientes.push(data.candidato);
    }
  });
  socket.on("llamada:colgar", (data) =>
  {
    if (data.de === conId)
    {
      limpiar();
      avisar();
    }
  });
}
