import { useState } from 'react'
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'

interface DatePickerFieldProps {
  label: string
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  required?: boolean
}

function parseDate(value: string): Date {
  if (!value) return new Date()
  const d = new Date(value + 'T00:00:00')
  return isNaN(d.getTime()) ? new Date() : d
}

function formatDisplay(value: string): string {
  if (!value) return 'Selecionar data'
  const d = new Date(value + 'T00:00:00')
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('pt-BR')
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DatePickerField({ label, value, onChange, required }: DatePickerFieldProps) {
  const [show, setShow] = useState(false)
  const [tempDate, setTempDate] = useState<Date>(parseDate(value))

  function handleChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShow(false)
      if (selected) onChange(toYMD(selected))
    } else {
      if (selected) setTempDate(selected)
    }
  }

  function handleIOSConfirm() {
    onChange(toYMD(tempDate))
    setShow(false)
  }

  function handleOpen() {
    setTempDate(parseDate(value))
    setShow(true)
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
        {label}{required ? ' *' : ''}
      </Text>
      <TouchableOpacity
        onPress={handleOpen}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#D1D5DB',
          borderRadius: 10,
          padding: 12,
          backgroundColor: '#F9FAFB',
          gap: 8,
        }}
      >
        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
        <Text style={{ fontSize: 14, color: value ? '#111827' : '#9CA3AF', flex: 1 }}>
          {formatDisplay(value)}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <TouchableOpacity onPress={handleIOSConfirm} style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
                  <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 15 }}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                locale="pt-BR"
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}
