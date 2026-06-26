import { AdjuntoImagen } from "./AdjuntoImagen";
import { AdjuntoVideo } from "./AdjuntoVideo";
import { AdjuntoAudio } from "./AdjuntoAudio";

export function Adjunto({ media, color })
{
  if (media.t === "video")
  {
    return <AdjuntoVideo media={media} color={color} />;
  }
  if (media.t === "audio")
  {
    return <AdjuntoAudio media={media} color={color} />;
  }
  return <AdjuntoImagen media={media} color={color} />;
}
