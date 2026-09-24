/* ===================================================
   Admin Live Customer Chat Management API
   Allows store admins to view all active customer conversations,
   customly switch conversation mode between 'ai' and 'manual',
   toggle global default mode, send live admin replies, and manage chats.
   =================================================== */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  addChatMessage,
  clearConversation,
  deleteConversation,
  getAllConversations,
  getGlobalChatMode,
  getOrCreateConversation,
  markReadByAdmin,
  setConversationMode,
  setGlobalChatMode,
} from '@/lib/customerChatStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Return all active conversations and current global chat mode
  if (req.method === 'GET') {
    const conversations = getAllConversations();
    const globalMode = getGlobalChatMode();

    return res.status(200).json({
      success: true,
      globalMode,
      conversations,
      totalActive: conversations.length,
      unreadTotal: conversations.reduce((acc, c) => acc + c.unreadForAdmin, 0),
    });
  }

  // POST: Admin Actions
  if (req.method === 'POST') {
    const { action, sessionId, mode, message } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required' });
    }

    // 1. Toggle global default mode
    if (action === 'set_global_mode') {
      if (mode !== 'ai' && mode !== 'manual') {
        return res.status(400).json({ error: 'Mode must be "ai" or "manual"' });
      }
      const newGlobalMode = setGlobalChatMode(mode);
      return res.status(200).json({
        success: true,
        message: `Global default chat mode set to ${newGlobalMode.toUpperCase()}`,
        globalMode: newGlobalMode,
      });
    }

    // Require sessionId for remaining conversation-specific actions
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required for this action' });
    }

    // 2. Customly set mode for a specific conversation (AI vs Manual)
    if (action === 'set_mode') {
      if (mode !== 'ai' && mode !== 'manual') {
        return res.status(400).json({ error: 'Mode must be "ai" or "manual"' });
      }
      const updatedConv = setConversationMode(sessionId, mode);
      if (!updatedConv) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      return res.status(200).json({
        success: true,
        message: `Conversation ${sessionId} mode switched to ${mode.toUpperCase()}`,
        conversation: updatedConv,
      });
    }

    // 3. Admin sends a human reply
    if (action === 'send_reply') {
      const trimmedText = (message || '').trim();
      if (!trimmedText) {
        return res.status(400).json({ error: 'Reply text cannot be empty' });
      }

      // Add agent reply message
      const updatedConv = addChatMessage(sessionId, {
        sender: 'agent',
        text: trimmedText,
      });

      markReadByAdmin(sessionId);

      return res.status(200).json({
        success: true,
        message: 'Admin reply sent successfully',
        conversation: updatedConv,
      });
    }

    // 4. Mark conversation as read by admin
    if (action === 'mark_read') {
      markReadByAdmin(sessionId);
      const conv = getOrCreateConversation(sessionId);
      return res.status(200).json({
        success: true,
        conversation: conv,
      });
    }

    // 5. Clear conversation history
    if (action === 'clear_chat') {
      const conv = clearConversation(sessionId);
      return res.status(200).json({
        success: true,
        message: 'Conversation cleared',
        conversation: conv,
      });
    }

    // 6. Delete conversation
    if (action === 'delete_chat') {
      const deleted = deleteConversation(sessionId);
      return res.status(200).json({
        success: deleted,
        message: deleted ? 'Conversation deleted' : 'Conversation not found',
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
