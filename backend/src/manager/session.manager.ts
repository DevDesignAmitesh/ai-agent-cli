import type { GeminiTurn, Messages } from "../types";
import { getStoredMessages } from "../utils/session.utils";
import fs from "fs";

class SessionManager {
  private static instance: SessionManager;
  private messages: Messages

  constructor() {
    this.messages = getStoredMessages()
  }
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) SessionManager.instance = new SessionManager();
    return SessionManager.instance
  };

  getAllMessages() {
    return this.messages;
  }
  
  storeAllMessages(messages: Messages) {
    fs.writeFileSync("../backend/src/messages.json", JSON.stringify(messages))
  }
  
  getSessionMsg(sessionId: string) {
    let sessionMessages: GeminiTurn[];
      
    if (this.getSessionMessages(`summarized-${sessionId}`)) {
      sessionMessages = this.getSessionMessages(`summarized-${sessionId}`)!
    } else if (this.getSessionMessages(sessionId)) {
      sessionMessages = this.getSessionMessages(sessionId)!;
    } else {
      sessionMessages = [];
    }
    
    return { sessionMessages };
  }
  
  getMessages() {
    return this.messages;
  }
  
  getSessionMessages(key: string) {
    return this.messages[key];
  }

  setSessionMsg(key: string, sessionMsgs: GeminiTurn[]) {
    this.messages[key] = sessionMsgs;
  }

};

export const sessionManager = SessionManager.getInstance();
