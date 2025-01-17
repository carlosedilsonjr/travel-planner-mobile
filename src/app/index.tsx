import { MapPin, Calendar as IconCalendar, Settings2, UserRoundPlus, ArrowRight, X, AtSign } from "lucide-react-native"
import { Alert, Image, Keyboard, Text, View } from "react-native"
import { DateData } from "react-native-calendars"
import { useEffect, useState } from "react"
import { router } from "expo-router"
import dayjs from "dayjs"

import { calendarUtils, DatesSelected } from "@/utils/calendarUtils"
import { validateInput } from "@/utils/validateInput"
import { tripServer } from "@/server/trip-server"
import { tripStorage } from "@/storage/trip"
import { colors } from "@/styles/colors"
import { Input } from "@/components/input"
import { Modal } from "@/components/modal"
import { Button } from "@/components/button"
import { Loading } from "@/components/loading"
import { GuestEmail } from "@/components/email"
import { Calendar } from "@/components/calendar"
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { db } from './_layout'

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAILS = 2
}

enum ModalContent {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2
}

export default function Index() {
  const [isGettingTrip, setIsGettingTrip] = useState(true)
  const [isCreatingTip, setIsCreatingTip] = useState(false)
  const [showModal, setShowModal] = useState(ModalContent.NONE)
  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS)
  const [destination, setDestination] = useState('')
  const [emailToInvite, setEmailToInvite] = useState('')
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected)

  function handleNextStepForm() {
    if (
      destination.length === 0 ||
      !selectedDates.startsAt ||
      !selectedDates.endsAt
    ) {
      return Alert.alert(
        'Detalhes da viagem',
        'Preencha todas as informações da viagem para seguir.'
      )
    }

    if (destination.length < 4) {
      return Alert.alert(
        'Detalhes da viagem',
        'Destino deve ter pelo menos 4 caracteres.'
      )
    }

    if (stepForm === StepForm.TRIP_DETAILS) {
      return setStepForm(StepForm.ADD_EMAILS)
    }

    Alert.alert('Nova viagem', 'Confirmar viagem?', [
      {
        text: 'Não',
        style: 'cancel'
      },
      {
        text: 'Sim',
        onPress: createTrip
      }
    ])
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay
    })

    setSelectedDates(dates)
  }

  function handleRemoveEmail(emailToRemove: string) {
    setEmailsToInvite(prevState =>
      prevState.filter(email => email !== emailToRemove)
    )
  }

  function handleAddEmail() {
    if (!validateInput.email(emailToInvite)) {
      return Alert.alert('Convidado', 'Email inválido')
    }

    const emailAlreadyExists = emailsToInvite.find(
      email => email === emailToInvite
    )

    if (emailAlreadyExists) {
      return Alert.alert('Convidado', 'Email já foi adicionado!')
    }

    setEmailsToInvite(prevState => [...prevState, emailToInvite])
    setEmailToInvite('')
  }

  async function saveTrip(tripId: string) {
    try {
      await tripStorage.save(tripId)
      router.navigate(`/trip/${tripId}`)
    } catch (error) {
      Alert.alert(
        'Salvar viagem',
        'Não foi possível salvar o id da viagem no dispositivo.'
      )
      console.log(error)
      setIsCreatingTip(false)
    }
  }

  async function createTrip() {
    try {
      setIsCreatingTip(true)

      const newTrip = await db
        .insert(schema.trips)
        .values({
          destination: destination,
          starts_at: dayjs(selectedDates.startsAt?.dateString).toDate(),
          ends_at: dayjs(selectedDates.endsAt?.dateString).toDate()
        })
        .returning()

      await db.insert(schema.participants).values({
        name: 'Carlos Junior',
        email: 'carlosedilsonabj@gmail.com',
        is_owner: true,
        is_confirmed: true,
        trip_id: newTrip[0].id
      })

      emailsToInvite.map(async email => {
        await db
          .insert(schema.participants)
          .values({ email, trip_id: newTrip[0].id })
      })

      Alert.alert('Nova viagem', 'Viagem criado com sucesso!', [
        {
          text: 'Ok. Continuar.',
          onPress: () => saveTrip(newTrip[0].id)
        }
      ])
    } catch (error) {
      console.log(error)
      setIsCreatingTip(false)
    }
  }

  async function getTrip() {
    try {
      const tripId = await tripStorage.get()
      // const trip = await db.query.trips.findFirst()

      if (!tripId) {
        return setIsGettingTrip(false)
      }

      const trip = await db.query.trips.findFirst({
        where: eq(schema.trips.id, tripId)
      })

      if (trip) {
        return router.navigate(`/trip/${trip.id}`)
      }
    } catch (error) {
      setIsGettingTrip(false)
      console.log(error)
    }
  }

  useEffect(() => {
    // tripStorage.clearStorage() // CLEAR THE TRIP FROM YOUR PHONE
    getTrip()
  }, [])

  if (isGettingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 items-center justify-center px-5">
      <Image
        source={require('@/assets/logo.png')}
        className="h-8"
        resizeMode="contain"
      />

      <Image source={require('@/assets/bg.png')} className="absolute" />

      <Text className="text-zinc-400 font-regular text-center text-lg mt-3">
        Convide seus amigos e planeje sua{'\n'}próxima viagem
      </Text>

      <View className="w-full bg-zinc-900 p-4 rounded-lg my-8 border border-zinc-800">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Para onde?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            value={destination}
            onChangeText={setDestination}
            style={{ color: colors.zinc[300] }}
            autoCorrect={false}
          />
        </Input>

        <Input>
          <IconCalendar color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Quando?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            value={selectedDates.formatDatesInText}
            style={{ color: colors.zinc[300] }}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPressIn={() =>
              stepForm === StepForm.TRIP_DETAILS &&
              setShowModal(ModalContent.CALENDAR)
            }
          />
        </Input>

        {stepForm === StepForm.ADD_EMAILS && (
          <>
            <View className="border-b py-3 border-zinc-800">
              <Button
                variant="secondary"
                onPress={() => {
                  setStepForm(StepForm.TRIP_DETAILS)
                }}
              >
                <Button.Title>Alterar Local/Data</Button.Title>
                <Settings2 color={colors.zinc[200]} size={20} />
              </Button>
            </View>

            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Quem estará na viagem?"
                style={{ color: colors.zinc[300] }}
                autoCorrect={false}
                value={
                  emailsToInvite.length > 0
                    ? `${emailsToInvite.length} pessoa(s) convidada(s)`
                    : ''
                }
                onPress={() => {
                  Keyboard.dismiss()
                  setShowModal(ModalContent.GUESTS)
                }}
                showSoftInputOnFocus={false}
              />
            </Input>
          </>
        )}

        <Button onPress={handleNextStepForm} isLoading={isCreatingTip}>
          <Button.Title>
            {stepForm === StepForm.TRIP_DETAILS
              ? 'Continuar'
              : 'Confirmar Viagem'}
          </Button.Title>

          <ArrowRight color={colors.orange[950]} size={20} />
        </Button>
      </View>

      <Text className="text-zinc-500 font-regular text-center text-base">
        Ao planejar sua viagem pela plann.er você automaticamente concorda com
        nossos
        <Text className="text-zinc-300 underline">
          {' '}
          termos de uso e políticas de privacidade.
        </Text>
      </Text>

      <Modal
        title="Selecionar datas"
        subtitle="Selecione a data de ida e volta da viagem"
        visible={showModal == ModalContent.CALENDAR}
        onClose={() => setShowModal(ModalContent.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar
            minDate={dayjs().toISOString()}
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
          />

          <Button onPress={() => setShowModal(ModalContent.NONE)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Selecionar convidados"
        subtitle="Os convidados irão receber e-mails para confirmar a participação na viagem."
        visible={showModal === ModalContent.GUESTS}
        onClose={() => setShowModal(ModalContent.NONE)}
      >
        <View className="my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-start">
          {emailsToInvite.length > 0 ? (
            emailsToInvite.map(email => (
              <GuestEmail
                key={email}
                email={email}
                onRemove={() => handleRemoveEmail(email)}
              />
            ))
          ) : (
            <Text className="text-zinc-600 text-base font-regular">
              Nenhum email adicionado.
            </Text>
          )}
        </View>

        <View className="gap-4 mt-4">
          <Input variant="secondary">
            <AtSign color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Digite o email do convidado"
              keyboardType="email-address"
              onChangeText={text => setEmailToInvite(text.toLowerCase())}
              value={emailToInvite}
              returnKeyType="send"
              onSubmitEditing={handleAddEmail}
            />
          </Input>

          <Button onPress={handleAddEmail}>
            <Button.Title>Convidar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}
