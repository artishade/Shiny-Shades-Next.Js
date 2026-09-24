/* ===================================================
   Customer Live Chat Server Store & State Manager
   In-memory store with persistence helpers for active customer chat sessions,
   mode toggles (AI Mode vs Manual Mode), and message history.
   =================================================== */

export interface CustomerChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'agent' | 'system';
  text: string;
  timestamp: string;
}

export interface CustomerConversation {
  sessionId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  mode: 'ai' | 'manual';
  messages: CustomerChatMessage[];
  createdAt: string;
  updatedAt: string;
  unreadForAdmin: number;
  unreadForCustomer: number;
}

interface ChatStoreState {
  globalMode: 'ai' | 'manual';
  conversations: Record<string, CustomerConversation>;
}

// Global singleton across hot-reloads in Node runtime
const globalForChat = globalThis as unknown as {
  customerChatStoreState?: ChatStoreState;
};

if (!globalForChat.customerChatStoreState) {
  globalForChat.customerChatStoreState = {
    globalMode: 'ai',
    conversations: {},
  };
}

const state = globalForChat.customerChatStoreState!;

/** Format current time string */
export const formatChatTime = (): string => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Get global default chat mode */
export const getGlobalChatMode = (): 'ai' | 'manual' => {
  return state.globalMode || 'ai';
};

/** Set global default chat mode */
export const setGlobalChatMode = (mode: 'ai' | 'manual'): 'ai' | 'manual' => {
  state.globalMode = mode;
  return state.globalMode;
};

/** Get or initialize a customer conversation by sessionId */
export const getOrCreateConversation = (
  sessionId: string,
  customerInfo?: { name?: string; phone?: string; email?: string }
): CustomerConversation => {
  if (!sessionId) sessionId = 'session_' + Math.random().toString(36).substring(2, 9);

  if (!state.conversations[sessionId]) {
    const now = new Date().toISOString();
    state.conversations[sessionId] = {
      sessionId,
      customerName: customerInfo?.name || `Customer #${sessionId.slice(-4).toUpperCase()}`,
      customerPhone: customerInfo?.phone,
      customerEmail: customerInfo?.email,
      mode: state.globalMode || 'ai',
      messages: [
        {
          id: 'welcome_msg',
          sender: 'ai',
          text: 'Hello! 👋 Welcome to Shiny Shades. How can I assist you today? Ask about our latest sarees, dresses, order tracking, or delivery!',
          timestamp: formatChatTime(),
        },
      ],
      createdAt: now,
      updatedAt: now,
      unreadForAdmin: 0,
      unreadForCustomer: 0,
    };
  } else if (customerInfo) {
    if (customerInfo.name) state.conversations[sessionId].customerName = customerInfo.name;
    if (customerInfo.phone) state.conversations[sessionId].customerPhone = customerInfo.phone;
    if (customerInfo.email) state.conversations[sessionId].customerEmail = customerInfo.email;
  }

  return state.conversations[sessionId];
};

/** Get all conversations sorted by last updated time */
export const getAllConversations = (): CustomerConversation[] => {
  return Object.values(state.conversations).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

/** Set mode for a specific conversation customly (AI vs Manual) */
export const setConversationMode = (
  sessionId: string,
  mode: 'ai' | 'manual'
): CustomerConversation | null => {
  const conv = state.conversations[sessionId];
  if (!conv) return null;

  const previousMode = conv.mode;
  conv.mode = mode;
  conv.updatedAt = new Date().toISOString();

  // Add system notice if mode changed
  if (previousMode !== mode) {
    const noticeText =
      mode === 'manual'
        ? '👤 System Notice: Switched to Manual Support Mode. A live human support agent is now handling this conversation.'
        : '🤖 System Notice: Switched to AI Assistant Mode. AI will automatically respond to customer inquiries.';

    conv.messages.push({
      id: 'system_' + Date.now().toString(),
      sender: 'system',
      text: noticeText,
      timestamp: formatChatTime(),
    });
  }

  return conv;
};

/** Add message to a conversation */
export const addChatMessage = (
  sessionId: string,
  message: { sender: 'user' | 'ai' | 'agent' | 'system'; text: string }
): CustomerConversation => {
  const conv = getOrCreateConversation(sessionId);
  const now = new Date().toISOString();

  const newMsg: CustomerChatMessage = {
    id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 5),
    sender: message.sender,
    text: message.text,
    timestamp: formatChatTime(),
  };

  conv.messages.push(newMsg);
  conv.updatedAt = now;

  if (message.sender === 'user') {
    conv.unreadForAdmin += 1;
  } else if (message.sender === 'agent' || message.sender === 'ai') {
    conv.unreadForCustomer += 1;
    if (message.sender === 'agent') {
      conv.unreadForAdmin = 0; // Admin replied, mark as read
    }
  }

  return conv;
};

/** Mark messages as read by admin */
export const markReadByAdmin = (sessionId: string): void => {
  if (state.conversations[sessionId]) {
    state.conversations[sessionId].unreadForAdmin = 0;
  }
};

/** Mark messages as read by customer */
export const markReadByCustomer = (sessionId: string): void => {
  if (state.conversations[sessionId]) {
    state.conversations[sessionId].unreadForCustomer = 0;
  }
};

/** Clear messages for a conversation */
export const clearConversation = (sessionId: string): CustomerConversation | null => {
  const conv = state.conversations[sessionId];
  if (!conv) return null;
  conv.messages = [
    {
      id: 'welcome_' + Date.now(),
      sender: 'system',
      text: 'Conversation history cleared.',
      timestamp: formatChatTime(),
    },
  ];
  conv.unreadForAdmin = 0;
  conv.unreadForCustomer = 0;
  conv.updatedAt = new Date().toISOString();
  return conv;
};

/** Delete a conversation */
export const deleteConversation = (sessionId: string): boolean => {
  if (state.conversations[sessionId]) {
    delete state.conversations[sessionId];
    return true;
  }
  return false;
};
