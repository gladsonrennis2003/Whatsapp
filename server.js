// Import required packages
const express = require("express");
const axios = require("axios");

// Initialize the express app
const app = express();
app.use(express.json());

// Define the port
const PORT = 3000;

// Your Graph API token
const GRAPH_API_TOKEN =
  "EAAMVPs806DwBO4XZBpufnrN3OLZAchTG2vvT426iIZAPP9P1ygU7dM77bcACr6p5Lk22dEw0GVVjq90Dl40ZAcRlDb9VfFZCwkak2fV4MyNleijrrGWjEGMn7Ucg8yyZC6AVr4tBoK1f9U6dsPXxMPehGrXhS9TJqOZBkpNZAit4W5IMLAB5jCMzKWG7UNHapm60agZDZD";

const VERIFY_TOKEN = "Hortisort@123"; // Replace with your actual verification token

let webhookData = []; // Array to store webhook data
const processedMessageIds = new Set(); // Set to track processed message IDs

// Webhook verification route
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully!");
      res.status(200).send(challenge);
    } else {
      console.error("Webhook verification failed.");
      res.sendStatus(403); // Forbidden
    }
  } else {
    console.error("Invalid webhook verification request.");
    res.sendStatus(400); // Bad Request
  }
});

// Webhook route to handle incoming messages
app.post("/webhook", async (req, res) => {
  try {
    console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

    // Store the webhook data
    webhookData.push(req.body);
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Respond immediately to the webhook
    res.sendStatus(200);

    if (message?.type === "text") {
      const businessPhoneNumberId =
        req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
      const messageId = message.id;

      // Check if this message ID has already been processed
      if (processedMessageIds.has(messageId)) {
        console.log(
          `Message ID ${messageId} has already been processed. Skipping...`
        );
        return;
      }

      // Add message ID to the processed set
      processedMessageIds.add(messageId);

      // Construct response text
      const responseText =
        "Contact Us:\nZentron Labs Pvt Ltd\n91 92095 95909\nhortisort.support@zentronlabs.com";

      console.log("Response text:", responseText); // Log the response text

      // Send the response message asynchronously
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v21.0/${businessPhoneNumberId}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: message.from,
          text: { body: responseText },
        },
      });

      console.log(`Response sent to ${message.from}`);

      // Mark the message as read
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v21.0/${businessPhoneNumberId}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        },
      });

      console.log(`Message ID ${messageId} marked as read.`);
    }
  } catch (error) {
    console.error(
      "Error processing webhook:",
      error.response?.data || error.message
    );
  }
});

// New route to expose the stored webhook data
app.get("/get-webhook-data", (req, res) => {
  res.json(webhookData); // Send the stored webhook data as JSON
});

// Simple route for root
app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here. Checkout README.md to start.</pre>`);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
