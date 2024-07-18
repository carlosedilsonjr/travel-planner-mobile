import { Calendar as IconCalendar, CalendarRange, Info, MapPin, Settings2, User, Mail } from "lucide-react-native";
import { Alert, Keyboard, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DateData } from "react-native-calendars";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Details } from "./details";
import { colors } from "@/styles/colors";
import { Activities } from "./activities";
import { tripStorage } from "@/storage/trip";
import { validateInput } from "@/utils/validateInput";
import { TripDetails, tripServer } from "@/server/trip-server";
import { participantsServer } from "@/server/participants-server";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { Calendar } from "@/components/calendar";
import { Loading } from "@/components/loading";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { db } from '../_layout'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'

export type TripData = TripDetails & {
  when: string
}

enum ModalContent {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2,
  CONFIRM_ATTENDENCE = 3
}

export default function Trip() {
  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)
  const [isConfirmingAttendence, setIsConfirmingAttendence] = useState(false)
  const [showModal, setShowModal] = useState(ModalContent.NONE)
  const [option, setOption] = useState<'activity' | 'details'>('activity')
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
  const [tripDetails, setTripDetails] = useState({} as TripData)
  const [destination, setDestination] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const tripParams = useLocalSearchParams<{
    id: string
    participant?: string
  }>()

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true)

      if (tripParams.participant) {
        setShowModal(ModalContent.CONFIRM_ATTENDENCE)
      }

      if (!tripParams.id) {
        return router.back()
      }

      // const trip = await tripServer.getById(tripParams.id)
      const trip = await db.query.trips.findFirst({
        where: eq(schema.trips.id, tripParams.id)
      })
      const maxLengthDestination = 14

      if (trip) {
        const destination =
          trip.destination!.length > maxLengthDestination
            ? trip.destination!.slice(0, maxLengthDestination) + '...'
            : trip.destination
        const starts_at = dayjs(trip.starts_at).format('DD')
        const ends_at = dayjs(trip.ends_at).format('DD')
        const month = dayjs(trip.starts_at).format('MMM')

        setDestination(trip.destination!)

        setTripDetails({
          destination: trip.destination!,
          ends_at: trip.ends_at!.toDateString(),
          starts_at: trip.starts_at!.toDateString(),
          id: trip.id,
          is_confirmed: trip.is_confirmed!,
          when: `${destination} de ${starts_at} a ${ends_at} de ${month}.`
        })
      } else {
        return router.back()
      }
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoadingTrip(false)
    }
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay
    })

    setSelectedDates(dates)
  }

  async function handleUpdateTrip() {
    try {
      if (!tripParams.id) {
        return
      }

      if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
        return Alert.alert(
          'Atualizar viagem',
          'Lembre-se de, além de preencher o destino, selecione a data de início de fim da viagem.'
        )
      }

      setIsUpdatingTrip(true)

      await db
        .update(schema.trips)
        .set({
          destination,
          starts_at: dayjs(selectedDates.startsAt.dateString).toDate(),
          ends_at: dayjs(selectedDates.endsAt.dateString).toDate()
        })
        .where(eq(schema.trips.id, tripParams.id))

      Alert.alert('Atualizar viagens', 'Viagem atualizada com sucesso.', [
        {
          text: 'OK',
          onPress: () => {
            setShowModal(ModalContent.NONE)
            getTripDetails()
          }
        }
      ])
    } catch (error) {
      console.log(error)
    } finally {
      setIsUpdatingTrip(false)
    }
  }

  async function handleConfirmAttendence() {
    try {
      if (!tripParams.id || !tripParams.participant) {
        return
      }

      if (!guestName.trim() || !guestEmail.trim()) {
        return Alert.alert(
          'Confirmação',
          'Preencha nome e email para confirmar a viagem.'
        )
      }

      if (!validateInput.email(guestEmail.trim())) {
        return Alert.alert('Confirmação', 'Email inválido.')
      }

      setIsConfirmingAttendence(true)

      await db
        .update(schema.participants)
        .set({
          email: guestEmail.trim(),
          name: guestName
        })
        .where(eq(schema.participants.id, tripParams.participant))

      Alert.alert('Confirmação', 'Viagem confirmada com sucesso.')
      await tripStorage.save(tripParams.id)
      setShowModal(ModalContent.NONE)
    } catch (error) {
      console.log(error)
      Alert.alert('Confirmação', 'Não foi possível confriamr.')
    } finally {
      setIsConfirmingAttendence(false)
    }
  }

  async function handleRemoveTrip() {
    try {
      Alert.alert(
        'Remover viagem',
        'Tem certeza que deseja remover a viagem?',
        [
          {
            text: 'Não',
            style: 'cancel'
          },
          {
            text: 'Sim',
            onPress: async () => {
              await tripStorage.remove()
              router.navigate('/')
            }
          }
        ]
      )
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getTripDetails()
  }, [])

  if (isLoadingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 px-5 pt-16">
      <Input variant="tertiary">
        <MapPin color={colors.zinc[400]} size={20} />
        <Input.Field value={tripDetails.when} readOnly />

        <TouchableOpacity
          activeOpacity={0.6}
          className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
          onPress={() => setShowModal(ModalContent.UPDATE_TRIP)}
        >
          <Settings2 color={colors.zinc[400]} size={20} />
        </TouchableOpacity>
      </Input>

      {option === 'activity' ? (
        <Activities tripDetails={tripDetails} />
      ) : (
        <Details tripId={tripDetails.id} />
      )}

      <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
        <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
          <Button
            className="flex-1"
            onPress={() => setOption('activity')}
            variant={option === 'activity' ? 'primary' : 'secondary'}
          >
            <CalendarRange
              color={
                option === 'activity' ? colors.orange[950] : colors.zinc[200]
              }
              size={20}
            />
            <Button.Title>Atividades</Button.Title>
          </Button>

          <Button
            className="flex-1"
            onPress={() => setOption('details')}
            variant={option === 'details' ? 'primary' : 'secondary'}
          >
            <Info
              color={
                option === 'details' ? colors.orange[950] : colors.zinc[200]
              }
              size={20}
            />
            <Button.Title>Detalhes</Button.Title>
          </Button>
        </View>
      </View>

      <Modal
        title="Atualizar viagem"
        subtitle="Somente quem criou a viagem pode editar."
        visible={showModal === ModalContent.UPDATE_TRIP}
        onClose={() => setShowModal(ModalContent.NONE)}
      >
        <View className="gap-2 my-4">
          <Input variant="secondary">
            <MapPin color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Para onde?"
              onChangeText={setDestination}
              value={destination}
              autoCorrect={false}
            />
          </Input>

          <Input variant="secondary">
            <IconCalendar color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Quando?"
              value={selectedDates.formatDatesInText}
              onPressIn={() => setShowModal(ModalContent.CALENDAR)}
              onFocus={() => Keyboard.dismiss()}
            />
          </Input>

          <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
            <Button.Title>Atualizar</Button.Title>
          </Button>

          <TouchableOpacity activeOpacity={0.8} onPress={handleRemoveTrip}>
            <Text className="text-red-400 text-center mt-6">
              Remover viagem
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

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

          <Button onPress={() => setShowModal(ModalContent.UPDATE_TRIP)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Confirmar presença"
        visible={showModal === ModalContent.CONFIRM_ATTENDENCE}
      >
        <View className="gap-4 mt-4">
          <Text className="text-zinc-400 font-regular leading-6 my-2">
            Você foi convidado(a) para participar de uma viagem para
            <Text className="font-semibold text-zinc-100">
              {' '}
              {tripDetails.destination}{' '}
            </Text>
            nas datas de
            <Text className="font-semibold text-zinc-100">
              {' '}
              {dayjs(tripDetails.starts_at).date()} a{' '}
              {dayjs(tripDetails.ends_at).date()} de{' '}
              {dayjs(tripDetails.ends_at).format('MMMM')}. {'\n\n'}
            </Text>
            Para confirmar sua presença na viagem, preencha os dados abaixo:
          </Text>

          <Input variant="secondary">
            <User color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Seu nome completo"
              onChangeText={setGuestName}
            />
          </Input>

          <Input variant="secondary">
            <Mail color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Email de confirmação"
              onChangeText={setGuestEmail}
            />
          </Input>

          <Button
            onPress={handleConfirmAttendence}
            isLoading={isConfirmingAttendence}
          >
            <Button.Title>Confirmar minha presença</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}
