import {
  format,
  parseISO,
  differenceInMinutes,
  isPast,
  addDays,
  startOfDay,
} from 'date-fns';

export const formatDate = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'MMM d, yyyy');
  } catch {
    return isoString;
  }
};

export const formatTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return isoString;
  }
};

export const formatDateTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'MMM d, yyyy h:mm a');
  } catch {
    return isoString;
  }
};

export const formatTimeRange = (startsAt: string, endsAt: string): string => {
  try {
    return `${format(parseISO(startsAt), 'h:mm a')} – ${format(parseISO(endsAt), 'h:mm a')}`;
  } catch {
    return `${startsAt} – ${endsAt}`;
  }
};

export const getMinutesUntil = (startsAt: string): number => {
  try {
    return differenceInMinutes(parseISO(startsAt), new Date());
  } catch {
    return 0;
  }
};

export const isCancellationBlocked = (startsAt: string): boolean => {
  const minutes = getMinutesUntil(startsAt);
  return minutes < 60;
};

export const isSlotInPast = (endsAt: string): boolean => {
  try {
    return isPast(parseISO(endsAt));
  } catch {
    return false;
  }
};

export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getNext7Days = (): Array<{ dateString: string; label: string; dayName: string }> => {
  const days: Array<{ dateString: string; label: string; dayName: string }> = [];
  const today = startOfDay(new Date());

  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    days.push({
      dateString: format(d, 'yyyy-MM-dd'),
      label: format(d, 'MMM d'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEE'),
    });
  }
  return days;
};

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
