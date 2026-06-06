// Spanish date helpers for the research app

const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** "Viernes, 6 de junio de 2026" */
export function fullDateEs(date: Date): string {
  const dia = DIAS[date.getDay()]
  return `${dia}, ${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`
}

/** "6 de junio" */
export function shortDateEs(date: Date): string {
  return `${date.getDate()} de ${MESES[date.getMonth()]}`
}

/** Returns the Tuesday and Friday of the current week (Monday-based). */
export function weekRange(today: Date): { tuesday: Date; friday: Date } {
  const day = today.getDay() // 0 = Sunday ... 6 = Saturday
  // Distance from today back to Monday (treat Sunday as end of week)
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)

  const tuesday = new Date(monday)
  tuesday.setDate(monday.getDate() + 1)

  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  return { tuesday, friday }
}
