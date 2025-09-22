import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

export const formatCommitDate = (dateString: string): string => {
  // Initialize dayjs plugins
  dayjs.extend(relativeTime);

  // Handle undefined or null dateString
  const safeDateString = dateString || "";

  // If it's already a relative format (contains "ago"), return as is
  if (safeDateString.includes("ago") || safeDateString.includes("just now")) {
    return safeDateString;
  }

  // Parse the date using dayjs
  const date = dayjs(safeDateString);

  // Check if it's a valid date
  if (!date.isValid()) {
    return safeDateString || "Invalid date"; // Return original if parsing fails
  }

  const now = dayjs();
  const diffInDays = now.diff(date, "day");

  // For dates within the last 7 days, show relative format
  if (diffInDays <= 7) {
    if (diffInDays === 0) return "today";
    if (diffInDays === 1) return "yesterday";
    return `${diffInDays} days ago`;
  }

  // For older dates, show formatted date with time
  return date.format("D MMMM, YYYY [at] HH:mm");
};
