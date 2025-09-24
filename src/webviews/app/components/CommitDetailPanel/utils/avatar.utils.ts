export const generateAvatarUrl = (email: string, name: string): string => {
  const safeEmail = email || "user@example.com";
  const safeName = name || "Unknown";

  // Try to extract GitHub username from email or name
  let username = "";

  // If email looks like a GitHub email (contains github in domain)
  if (safeEmail.includes("@") && !safeEmail.includes("noreply.github.com")) {
    // Use email prefix as potential username
    username = safeEmail.split("@")[0];
  } else if (safeEmail.includes("users.noreply.github.com")) {
    // Extract username from GitHub noreply email format
    const match = safeEmail.match(/(\d+\+)?(.+)@users\.noreply\.github\.com/);
    if (match) {
      username = match[2];
    }
  }

  // If we couldn't get username from email, try to use name
  if (!username) {
    // Clean the name to make it username-like (remove spaces, special chars)
    username = safeName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9-]/g, "");
  }

  // Fallback to a default if still no username
  if (!username) {
    username = "octocat";
  }

  const avatarUrl = `https://github.com/${username}.png?size=32`;
  console.log("Generated GitHub avatar URL:", avatarUrl);

  return avatarUrl;
};
