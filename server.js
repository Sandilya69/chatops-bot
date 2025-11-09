import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env and config/local.env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "config", "local.env") });

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Verify Slack signature (security)
function verifySlackSignature(req, res, buf) {
  const slackSignature = req.headers["x-slack-signature"];
  const timestamp = req.headers["x-slack-request-timestamp"]; 
  const hmac = crypto.createHmac("sha256", process.env.SLACK_SIGNING_SECRET);
  const [version, hash] = slackSignature.split("=");
  const baseString = `${version}:${timestamp}:${buf.toString()}`;
  const computed = hmac.update(baseString).digest("hex");
  if (crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"))) {
    return true;
  }
  res.status(400).send("Invalid Slack signature");
  return false;
}

// Middleware to capture raw body for signature verification
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Slash Command Route
app.post("/slack/command", async (req, res) => {
  const { command, text, user_name } = req.body;
  console.log(`Received command: ${command} from ${user_name}`);

  if (command === "/deploy") {
    return res.json({
      response_type: "ephemeral",
      text: `🚀 Deployment started for: *${text || "default-service"}*`,
    });
  } else if (command === "/status") {
    return res.json({
      response_type: "in_channel",
      text: `🟢 All systems operational.`,
    });
  } else if (command === "/rollback") {
    return res.json({
      response_type: "ephemeral",
      text: `⚠️ Rollback initiated for: *${text || "latest release"}*`,
    });
  } else if (command === "/approve") {
    return res.json({
      response_type: "ephemeral",
      text: `✅ Approval recorded for ${user_name}`,
    });
  } else {
    return res.json({
      response_type: "ephemeral",
      text: "Unknown command. Try /deploy, /status, /rollback, or /approve.",
    });
  }
});

// Interactivity (buttons/modals) route
app.post("/slack/interactions", (req, res) => {
  const payload = JSON.parse(req.body.payload);
  console.log("Interaction:", payload.type);
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`⚡ Slack ChatOps Bot running on port ${process.env.PORT || 3000}`);
});


