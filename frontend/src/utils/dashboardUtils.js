const formatDate = (updatedAt) => {
  if (!updatedAt) return "";

  const date = new Date(updatedAt);
  const now = new Date();

  const millisecDiff = Math.floor(now - date);
  const secDiff = Math.floor(millisecDiff / 1000);
  const minDiff = Math.floor(secDiff / 60);
  const hourDiff = Math.floor(minDiff / 60);
  const dateDiff = Math.floor(hourDiff / 24);
  const monthDiff = Math.floor(dateDiff / 30);
  const yearDiff = Math.floor(monthDiff / 12);

  const formatUnit = (val, unit) =>
    `${val} ${val === 1 ? unit : unit + "s"} ago`;

  if (yearDiff) return formatUnit(yearDiff, "year");
  if (monthDiff) return formatUnit(monthDiff, "month");
  if (dateDiff) return formatUnit(dateDiff, "day");
  if (hourDiff) return formatUnit(hourDiff, "hour");
  if (minDiff) return formatUnit(minDiff, "minute");
  if (secDiff) return formatUnit(secDiff, "second");

  return "Just now";
};

const formatCreationDate = (createdAt) => {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const parseInviteData = (rawText) => {
  if (!rawText || typeof rawText !== "string") return null;
  const text = rawText.trim();

  // If pasted an URL
  if (text.startsWith("http") || text.includes("?token")) {
    try {
      const url = new URL(text);

      // Path Name -> /room/{roomId}
      // Split to -> ["", "room", "{roomId}"]
      const pathName = url.pathname.split("/");
      const roomId = pathName.pop();

      // Token -> Query parameter /room/{roomId}?token={token}
      const token = url.searchParams.get("token");

      return { roomId, token };
    } catch {
      // When user types plain text, do nothing and return null
    }
  }

  try {
    const { roomId, token } = JSON.parse(text);
    if (roomId || token) return { roomId: roomId || "", token: token || "" };
  } catch {
    // When user types plain text, do nothing and return null
  }

  return null;
};

export { formatDate, formatCreationDate, parseInviteData };
