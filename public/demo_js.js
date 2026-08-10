// demo_js.js
// Upload this file to see JavaScript syntax highlighting
// Keywords: blue | Strings: orange | Comments: green | Functions: yellow

/**
 * Fetch user data with retry logic.
 * Demonstrates async/await, template literals, and error handling.
 */
async function fetchUserData(userId) {
  const MAX_RETRIES = 3;
  const BASE_URL = "https://api.txttoimage.app/v1";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}`, {
        headers: { "Authorization": `Bearer ${process.env.API_KEY}` },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
      if (attempt === MAX_RETRIES) return { error: "max_retries_exceeded" };
    }
  }
}

// ---- Usage ----
const users = ["alice_dev", "bob_ops", null, undefined];
for (const user of users) {
  fetchUserData(user ?? "guest").then(r => console.log(r));
}
