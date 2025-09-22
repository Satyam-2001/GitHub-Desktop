export const generateAvatarUrl = (email: string, author: string): string => {
  // Generate a simple avatar URL - in real implementation you'd use GitHub API or Gravatar
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#f9ca24",
    "#6c5ce7",
    "#fd79a8",
  ];
  const safeEmail = email || "user@example.com";
  const colorIndex = safeEmail.charCodeAt(0) % colors.length;
  const color = colors[colorIndex] || colors[0];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    author || "Unknown",
  )}&background=${color.slice(1)}&color=fff&size=32`;
};
