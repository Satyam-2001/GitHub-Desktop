import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

export class CommitDate {
  private readonly _date: dayjs.Dayjs;

  constructor(date: string | Date | dayjs.Dayjs) {
    dayjs.extend(relativeTime);
    this._date = dayjs(date);

    if (!this._date.isValid()) {
      throw new Error("Invalid date provided");
    }
  }

  get value(): Date {
    return this._date.toDate();
  }

  get formatted(): string {
    const now = dayjs();
    const diffInDays = now.diff(this._date, "day");

    // For dates within the last 7 days, show relative format
    if (diffInDays <= 7) {
      if (diffInDays === 0) return "today";
      if (diffInDays === 1) return "yesterday";
      return `${diffInDays} days ago`;
    }

    // For older dates, show formatted date with time
    return this._date.format("D MMMM, YYYY [at] HH:mm");
  }

  get relative(): string {
    return this._date.fromNow();
  }

  get iso(): string {
    return this._date.toISOString();
  }

  isAfter(other: CommitDate): boolean {
    return this._date.isAfter(other._date);
  }

  isBefore(other: CommitDate): boolean {
    return this._date.isBefore(other._date);
  }

  equals(other: CommitDate): boolean {
    return this._date.isSame(other._date);
  }
}
