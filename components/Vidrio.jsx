import { View } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

const nativo = requireOptionalNativeModule("ExpoBlur");
let BlurView = null;
if (nativo)
{
  try
  {
    BlurView = require("expo-blur").BlurView;
  }
  catch (e)
  {
    BlurView = null;
  }
}

export function Vidrio({ intensidad = 45, tinte = "dark", style, children, ...resto })
{
  if (BlurView)
  {
    return (
      <BlurView intensity={intensidad} tint={tinte} experimentalBlurMethod="dimezisBlurView" style={style} {...resto}>
        {children}
      </BlurView>
    );
  }
  return (
    <View style={style} {...resto}>
      {children}
    </View>
  );
}
