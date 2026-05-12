export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const formatSmartDateTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();

  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const time = date.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const fullDate = date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const weekday = date.toLocaleDateString("en-IN", {
    weekday: "long",
  });

  // TODAY
  if (diffDays === 0) {
    return `Today, ${time}`;
  }

  // YESTERDAY
  if (diffDays === 1) {
    return `Yesterday, ${time}`;
  }

  // LAST 7 DAYS → weekday
  if (diffDays > 1 && diffDays <= 7) {
    return `${weekday}, ${time}`;
  }

  // OLDER → full date
  return `${fullDate}, ${time}`;
};