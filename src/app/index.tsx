import { MapPin, Calendar as IconCalendar, Settings2, UserRoundPlus, ArrowRight, X } from "lucide-react-native"
import { Image, Text, View } from "react-native"
import { useState } from "react"

import { colors } from "@/styles/colors"
import { Input } from "@/components/Input"
import { Button } from "@/components/Button"

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAILS = 2,
}

export default function Index() {
  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS)
  const [local, setLocal] = useState('')
  const [date, setDate] = useState('')

  function handleNextStepForm() {
    if (stepForm === StepForm.TRIP_DETAILS) {
      return setStepForm(StepForm.ADD_EMAILS)
    }
  }

  return (
    <View className="flex-1 items-center justify-center px-5">
      <Image source={require("@/assets/logo.png")} className="h-8" resizeMode="contain" />

      <Image source={require("@/assets/bg.png")} className="absolute" />

      <Text className="text-zinc-400 font-regular text-center text-lg mt-3">
        Convide seus amigos e planeje sua{"\n"}próxima viagem
      </Text>

      <View className="w-full bg-zinc-900 p-4 rounded-lg my-8 border border-zinc-800">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field placeholder="Para onde?" editable={stepForm === StepForm.TRIP_DETAILS} value={local}
            onChangeText={setLocal} style={{ color: colors.zinc[300] }}
          />
          <X color={colors.zinc[400]} size={20} onPress={() => { setLocal('') }}
            opacity={local ? 1 : 0}
          />
        </Input>

        <Input>
          <IconCalendar color={colors.zinc[400]} size={20} />
          <Input.Field placeholder="Quando?" editable={stepForm === StepForm.TRIP_DETAILS} value={date}
            onChangeText={setDate} style={{ color: colors.zinc[300] }}
          />
          <X color={colors.zinc[400]} size={20} onPress={() => { setDate('') }}
            opacity={date ? 1 : 0}
          />
        </Input>

        {stepForm === StepForm.ADD_EMAILS && (
          <>
            <View className="border-b py-3 border-zinc-800">
              <Button variant="secondary" onPress={() => { setStepForm(StepForm.TRIP_DETAILS) }}>
                <Button.Title>
                  Alterar Local/Data
                </Button.Title>
                <Settings2 color={colors.zinc[200]} size={20} />
              </Button>
            </View>

            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field placeholder="Quem estará na viagem?" style={{ color: colors.zinc[300] }} />
            </Input>
          </>
        )}

        <Button onPress={handleNextStepForm}>
          <Button.Title>
            {stepForm === StepForm.TRIP_DETAILS ? "Continuar" : "Confirmar Viagem"}
          </Button.Title>

          <ArrowRight color={colors.orange[950]} size={20} />
        </Button>
      </View>

      <Text className="text-zinc-500 font-regular text-center text-base">
        Ao planejar sua viagem pela plann.er você automaticamente concorda com nossos
        <Text className="text-zinc-300 underline"> termos de uso e políticas de privacidade.</Text>
      </Text>
    </View>
  )
}
