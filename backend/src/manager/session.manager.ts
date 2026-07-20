import type { GeminiTurn, Messages } from "../types";
import fs from "fs";
import { MESSAGES_PATH } from "../utils/tool.utils";

class SessionManager {
  private static instance: SessionManager;
  private messages: Messages

  constructor() {
    this.messages = this.getStoredMessages()
  }
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) SessionManager.instance = new SessionManager();
    return SessionManager.instance
  };

  getStoredMessages() {
    try {
      return JSON.parse(fs.readFileSync(MESSAGES_PATH).toString())
    } catch (e) {
      return {}
    }
  }
  
  getAllMessages() {
    return this.messages;
  }
  
  storeAllMessages() {
    fs.writeFileSync(MESSAGES_PATH, JSON.stringify(this.messages))
  }
  
  getSessionMsg(sessionId: string) {
    return this.messages[sessionId] ?? []      
  }
  
  getMessages() {
    return this.messages;
  }

  setSessionMsg(key: string, sessionMsgs: GeminiTurn[]) {
    this.messages[key] = sessionMsgs;
  }

};

export const sessionManager = SessionManager.getInstance();
