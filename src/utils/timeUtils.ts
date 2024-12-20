export const addMinutes = (isoString: string, minutes: number): string => {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) {
      // If we got an invalid date, assume it's a time string like "HH:mm"
      const [hours, mins] = isoString.split(':').map(Number)
      const today = new Date()
      today.setHours(hours, mins, 0, 0)
      today.setMinutes(today.getMinutes() + minutes)
      return today.toISOString()
    }
    date.setMinutes(date.getMinutes() + minutes)
    return date.toISOString()
  } catch (error) {
    console.error('Error in addMinutes:', error)
    return isoString // Return original string if we can't process it
  }
}

export const formatTimeToAMPM = (timeString: string): string => {
  try {
    let hours: number
    let minutes: number

    if (timeString.includes('T')) {
      // Handle ISO string
      const date = new Date(timeString)
      if (isNaN(date.getTime())) throw new Error('Invalid date')
      hours = date.getHours()
      minutes = date.getMinutes()
    } else {
      // Handle "HH:mm" format
      [hours, minutes] = timeString.split(':').map(Number)
    }

    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch (error) {
    console.error('Error in formatTimeToAMPM:', error)
    return timeString // Return original string if we can't process it
  }
}

export const isWeekday = (date: Date) => {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

export const generateTimeBlocks = (): { time: string }[] => {
  const blocks: { time: string }[] = []
  const today = new Date()
  today.setHours(6, 0, 0, 0) // Start at 6 AM

  for (let i = 0; i < 32; i++) { // 16 hours * 2 blocks per hour
    const time = today.toISOString()
    blocks.push({ time })
    today.setMinutes(today.getMinutes() + 30)
  }
  return blocks
}

export const createScheduledTime = (date: Date, timeString: string): string => {
  try {
    // Validate timeString format
    if (!timeString.match(/^\d{2}:\d{2}$/)) {
      throw new Error('Invalid time format. Expected HH:mm');
    }

    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Validate hours and minutes
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid hours or minutes');
    }

    const scheduledTime = new Date(date);
    scheduledTime.setHours(hours, minutes, 0, 0);
    return scheduledTime.toISOString();
  } catch (error) {
    console.error('Error in createScheduledTime:', error);
    // Return current time if we can't process it
    const now = new Date();
    return now.toISOString();
  }
}

export const getTimeStringFromISO = (isoString: string): string => {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) {
      // If it's already in HH:mm format, return as is
      if (isoString.match(/^\d{2}:\d{2}$/)) return isoString
      throw new Error('Invalid date')
    }
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error in getTimeStringFromISO:', error)
    return '00:00' // Return default time if we can't process it
  }
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
} 