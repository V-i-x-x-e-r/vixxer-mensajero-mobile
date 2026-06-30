import { AdjuntoImagen } from "./AdjuntoImagen";
import { AdjuntoVideo } from "./AdjuntoVideo";
import { AdjuntoAudio } from "./AdjuntoAudio";

export function Adjunto({ media, color, onMenu, seleccionando, onToggle })
{
  if (media.t === "video")
  {
    return <AdjuntoVideo media={media} color={color} onMenu={onMenu} seleccionando={seleccionando} onToggle={onToggle} />;
  }
  if (media.t === "audio")
  {
    return <AdjuntoAudio media={media} color={color} />;
  }
  return <AdjuntoImagen media={media} color={color} onMenu={onMenu} seleccionando={seleccionando} onToggle={onToggle} />;
}
