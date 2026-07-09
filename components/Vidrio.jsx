import { View, Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

const nativo = requireOptionalNativeModule("ExpoBlur");
let BlurView = null;
if (nativo && Platform.OS === "ios")
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
      <BlurView intensity={intensidad} tint={tinte} style={style} {...resto}>
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
