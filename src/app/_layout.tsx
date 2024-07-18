import "@/styles/global.css"
import "@/utils/dayJsLocaleConfig"
import { openDatabaseSync } from 'expo-sqlite/next'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import migrations from '../../drizzle/migrations'
import { Slot } from 'expo-router'
import { StatusBar, View, Text } from 'react-native'
import {
  useFonts,
  Inter_500Medium,
  Inter_400Regular,
  Inter_600SemiBold
} from '@expo-google-fonts/inter'
import * as schema from '@/db/schema'

import { Loading } from '@/components/loading'

const expoDb = openDatabaseSync('db.db')
export const db = drizzle(expoDb, { schema })

export default function Layout() {
  useDrizzleStudio(expoDb)
  const { success, error } = useMigrations(db, migrations)
  const [fonstLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold
  })

  if (!fonstLoaded) {
    return <Loading />
  }

  if (error) {
    return (
      <View>
        <Text>Migration error: {error.message}</Text>
      </View>
    )
  }

  if (!success) {
    return (
      <View>
        <Text>Migration is in progress...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar barStyle={"light-content"} backgroundColor={"transparent"} translucent />

      <Slot />
    </View>
  )
}
