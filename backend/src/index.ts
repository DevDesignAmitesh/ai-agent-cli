import { agentLoop } from './agent-loop.';
import { type GeminiTurn, type Messages } from './types';
import { askQuestion } from './utils';
import fs from "fs";

let firstTimeLoop = true;
const messages: Messages = getStoredMessages();


function getStoredMessages() {
  try {
    return JSON.parse(fs.readFileSync("../backend/src/messages.json").toString())
  } catch (e) {
    console.log("read file error", e)
    return {}
  }
}

async function getSessionId() {
  let sessionId = null;
  const answer = await askQuestion("\n\nProvide previous SESSION_ID= else press enter. ");
    
  if (!answer) {
    sessionId = crypto.randomUUID();
  } else {
    sessionId = answer.trim();
  }

  let sessionMessages: GeminiTurn[];
    
  if (messages[`summarized-${sessionId}`]) {
    sessionMessages = messages[`summarized-${sessionId}`]!
  } else if (messages[sessionId]) {
    sessionMessages = messages[sessionId]!;
  } else {
    sessionMessages = []
  }
  
  return { sessionId };
}

function getSessionMessages(sessionId: string) {
  let sessionMessages: GeminiTurn[];
  
  if (messages[`summarized-${sessionId}`]) {
    sessionMessages = messages[`summarized-${sessionId}`]!
  } else if (messages[sessionId]) {
    sessionMessages = messages[sessionId]!;
  } else {
    sessionMessages = []
  }
  
  return { sessionMessages };
}

console.log("ALL_SESSION_IDs", Object.keys(messages));

const { sessionId } = await getSessionId();

console.log("\nCURRENT_SESSION_ID\n", sessionId);

async function main(firstTime: boolean) {
  const answer = await askQuestion(firstTime? "How can i help you? " : "Any follow up? ");
  
  if (answer.trim().toLowerCase() === "no") process.exit(0);
  
  const { sessionMessages } = getSessionMessages(sessionId);

  const res = await agentLoop(answer, sessionMessages, messages, sessionId);

  if (!res.success) process.exit(1);

  firstTimeLoop = false;
  main(firstTimeLoop)
}

main(firstTimeLoop);

