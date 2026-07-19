import fs from "fs";

export function getStoredMessages() {
  try {
    return JSON.parse(fs.readFileSync("../backend/src/messages.json").toString())
  } catch (e) {
    return {}
  }
}
