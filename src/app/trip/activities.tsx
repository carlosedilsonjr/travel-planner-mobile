import { Clock, Calendar as IconCalendar, PlusIcon, Tag } from "lucide-react-native";
import { Alert, Keyboard, SectionList, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { TripData } from "./[id]"
import dayjs from "dayjs";
import { colors } from '@/styles/colors'
import { Activity, ActivityProps } from "@/components/activity";
import { Calendar } from "@/components/calendar";
import { Loading } from "@/components/loading";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { db } from '../_layout'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'

type Props = {
  tripDetails: TripData
}

type TripActivities = {
  title: {
    dayNumber: number
    dayName: string
  }
  data: ActivityProps[]
}

enum ModalContent {
  NONE = 0,
  CALENDAR = 1,
  NEW_ACTIVITY = 2
}

export function Activities({ tripDetails }: Props) {
  const [isCreatingActivity, setIsCreatingActivity] = useState(false)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [showModal, setShowModal] = useState(ModalContent.NONE)
  const [activityTitle, setActivityTitle] = useState('')
  const [activityHour, setActivityHour] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [tripActivities, setTripActivities] = useState<TripActivities[]>([])

  function resetNewActivityFields() {
    setActivityDate('')
    setActivityTitle('')
    setActivityHour('')
    setShowModal(ModalContent.NONE)
  }

  async function handleCreateTripActivity() {
    try {
      if (!activityTitle || !activityDate || !activityHour) {
        Alert.alert('Cadastrar atividade', 'Preencha todos os campos.')
      }

      setIsCreatingActivity(true)

      await db.insert(schema.activities).values({
        trip_id: tripDetails.id,
        title: activityTitle,
        occurs_at: dayjs(activityDate).add(Number(activityHour), 'h').toDate()
      })

      Alert.alert('Nova atividade', 'Nova atividade cadastrada com sucesso.')
      await getTripActivities()
      resetNewActivityFields()
    } catch (error) {
      console.log(error)
    } finally {
      setIsCreatingActivity(false)
    }
  }

  async function getTripActivities() {
    try {
      setIsLoadingActivities(false)
      const activities = await db.query.activities.findMany({
        where: eq(schema.activities.trip_id, tripDetails.id)
      })
      const dates = Array.from({
        length:
          dayjs(tripDetails.ends_at).diff(tripDetails.starts_at, 'days') + 1
      }).map((_, addDays) => {
        return dayjs(tripDetails.starts_at).add(addDays, 'days').toISOString()
      })

      const activitiesData = dates.map(date => {
        return {
          date: date,
          activities: activities.filter(
            activity =>
              dayjs(activity.occurs_at).format('DD/MM/YY') ===
              dayjs(date).format('DD/MM/YY')
          )
        }
      })

      const activitiesToSectionList = activitiesData.map(dayActivity => ({
        title: {
          dayNumber: dayjs(dayActivity.date).date(),
          dayName: dayjs(dayActivity.date).format('dddd').replace('-feira', '')
        },
        data: dayActivity.activities.map(activity => ({
          id: activity.id,
          title: activity.title,
          hour: dayjs(activity.occurs_at).format('HH[:]mm[h]'),
          isBefore: dayjs(activity.occurs_at).isBefore(dayjs())
        }))
      }))

      setTripActivities(activitiesToSectionList)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  useEffect(() => {
    getTripActivities()
  }, [])

  return (
    <View className="flex-1">
      <View className="w-full flex-row mt-5 mb-5 items-center">
        <Text className="text-zinc-50 text-2xl font-semibold flex-1">
          Atividades
        </Text>

        <Button onPress={() => setShowModal(ModalContent.NEW_ACTIVITY)}>
          <PlusIcon color={colors.orange[950]} size={20} />
          <Button.Title>Nova atividade</Button.Title>
        </Button>
      </View>

      {isLoadingActivities ? (
        <Loading />
      ) : (
        <SectionList
          sections={tripActivities}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <Activity data={item} />}
          renderSectionHeader={({ section }) => (
            <View className="w-full">
              <Text className="text-zinc-50 text-2xl font-semibold py-2">
                Dia {section.title.dayNumber + ' '}
                <Text className="text-zinc-500 text-base font-regular capitalize">
                  {section.title.dayName}
                </Text>
              </Text>

              {section.data.length === 0 && (
                <Text className="text-zinc-500 font-regular text-sm mb-8">
                  Nenhuma atividade cadastrada nessa data
                </Text>
              )}
            </View>
          )}
          contentContainerClassName="gap-3 pb-48"
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        title="Cadastrar atividade"
        subtitle="Todos os convidados podem visualizar as atividades."
        visible={showModal === ModalContent.NEW_ACTIVITY}
        onClose={() => setShowModal(ModalContent.NONE)}
      >
        <View className="mt-4 mb-3">
          <Input variant="secondary">
            <Tag color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Qual atividade?"
              onChangeText={setActivityTitle}
              value={activityTitle}
            />
          </Input>

          <View className="w-full mt-2 flex-row gap-2">
            <Input variant="secondary" className="flex-1">
              <IconCalendar color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Data"
                onChangeText={setActivityDate}
                value={
                  activityDate ? dayjs(activityDate).format('DD [de] MMMM') : ''
                }
                onFocus={() => Keyboard.dismiss()}
                showSoftInputOnFocus={false}
                onPressIn={() => setShowModal(ModalContent.CALENDAR)}
              />
            </Input>

            <Input variant="secondary" className="flex-1">
              <Clock color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Horário"
                onChangeText={text =>
                  setActivityHour(text.replaceAll('.', '').replaceAll(',', ''))
                }
                value={activityHour}
                keyboardType="numeric"
                maxLength={2}
              />
            </Input>
          </View>
        </View>

        <Button
          onPress={handleCreateTripActivity}
          isLoading={isCreatingActivity}
        >
          <Button.Title>Cadastrar</Button.Title>
        </Button>
      </Modal>

      <Modal
        title="Selecionar data"
        subtitle="Selecione a data da atividade"
        visible={showModal === ModalContent.CALENDAR}
        onClose={() => setShowModal(ModalContent.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar
            onDayPress={day => setActivityDate(day.dateString)}
            markedDates={{ [activityDate]: { selected: true } }}
            initialDate={tripDetails.starts_at.toString()}
            minDate={tripDetails.starts_at.toString()}
            maxDate={tripDetails.ends_at.toString()}
          />

          <Button onPress={() => setShowModal(ModalContent.NEW_ACTIVITY)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}
