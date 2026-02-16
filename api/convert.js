module.exports = async function handler(req, res) {
  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // allows any website
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Your existing POST handling code goes below
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  // ... rest of your JSON → .lottie conversion code
};
