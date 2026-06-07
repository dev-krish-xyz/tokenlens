'use client'
import { useQueryState, parseAsInteger } from 'nuqs'

export function useDateRange() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(7))
  return { days, setDays }
}
