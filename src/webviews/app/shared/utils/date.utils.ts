import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

export class DateUtils {
  static formatRelativeTime(date: string | Date | dayjs.Dayjs): string {
    const parsedDate = dayjs(date);

    if (!parsedDate.isValid()) {
      return 'Invalid date';
    }

    const now = dayjs();
    const diffInDays = now.diff(parsedDate, 'day');

    // For dates within the last 7 days, show relative format
    if (diffInDays <= 7) {
      if (diffInDays === 0) return 'today';
      if (diffInDays === 1) return 'yesterday';
      return `${diffInDays} days ago`;
    }

    // For older dates, show formatted date with time
    return parsedDate.format('D MMMM, YYYY [at] HH:mm');
  }

  static formatAbsoluteTime(date: string | Date | dayjs.Dayjs): string {
    const parsedDate = dayjs(date);

    if (!parsedDate.isValid()) {
      return 'Invalid date';
    }

    return parsedDate.format('D MMMM, YYYY [at] HH:mm');
  }

  static fromNow(date: string | Date | dayjs.Dayjs): string {
    const parsedDate = dayjs(date);

    if (!parsedDate.isValid()) {
      return 'Invalid date';
    }

    return parsedDate.fromNow();
  }

  static isValid(date: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date).isValid();
  }

  static isSameDay(date1: string | Date | dayjs.Dayjs, date2: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date1).isSame(dayjs(date2), 'day');
  }

  static isAfter(date1: string | Date | dayjs.Dayjs, date2: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date1).isAfter(dayjs(date2));
  }

  static isBefore(date1: string | Date | dayjs.Dayjs, date2: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date1).isBefore(dayjs(date2));
  }
}