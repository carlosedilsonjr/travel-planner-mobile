import "@/styles/global.css"

import { Slot } from "expo-router"
import { StatusBar, View } from "react-native"

export default function Layout() {
  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar barStyle={"light-content"} backgroundColor={'transparent'} translucent />

      <Slot />
    </View>
  )
}