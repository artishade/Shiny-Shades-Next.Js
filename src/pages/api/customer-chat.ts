/* ===================================================
   Customer Live Chat API
   Handles customer message receiving, conversation fetching,
   and Gemini AI auto-response generation when conversation is in 'ai' mode.
   =================================================== */

import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';
import {
  addChatMessage,
  formatChatTime,
  getOrCreateConversation,
  markReadByCustomer,
  type CustomerConversation,
} from '@/lib/customerChatStore';
import { fetchProducts, fetchCategories } from '@/lib/supabase';

// Helper to construct AI prompt with store knowledge
async function buildStoreContext() {
  let productSummary = '';
  let categorySummary = '';

  try {
    const products = await fetchProducts();
    if (products && products.length > 0) {
      productSummary = products
        .slice(0, 15)
        .map((p) => `- ${p.name} (${p.category_name || 'General'}): ৳${p.price} ${p.stock > 0 ? '(In Stock)' : '(Out of Stock)'}`)
        .join('\n');
    }
  } catch (err) {
    console.warn('Could not fetch products for AI context:', err);
  }

  try {
    const categories = await fetchCategories();
    if (categories && categories.length > 0) {
      categorySummary = categories.map((c) => `- ${c.name}`).join(', ');
    }
  } catch (err) {
    console.warn('Could not fetch categories for AI context:', err);
  }

  return `
You are the polite, helpful, and sophisticated AI Customer Support Assistant for "Shiny Shades" - a premier luxury feminine fashion brand in Bangladesh.

Store Information & Policies:
- Brand: Shiny Shades (Exclusive Women's Fashion, Sarees, Salwar Kameez, Party Wear, Western, Kurtis)
- Delivery Charge: Inside Dhaka: ৳80 (1-2 days delivery). Outside Dhaka: ৳150 (2-4 days delivery via courier).
- Payment Methods: Cash on Delivery (COD), bKash, Nagad.
- Return Policy: 7-day hassle-free exchange for sizing or damage issues.
- Order Tracking: Customers can track their orders at "/track-order" by entering their Order Number.

Available Categories: ${categorySummary || 'Sarees, Party Wear, Salwar Kameez, Designer Kurtis'}

Featured Products:
${productSummary || '- Premium Silk Sarees, Designer Velvet Party Wear, Embroidered Anarkali'}

Instructions for replies:
1. Always reply politely in Bengali or English based on the language used by the customer.
2. Keep responses warm, helpful, elegant, and concise (2-4 short sentences).
3. If the user asks for human support, inform them that a human support agent can be connected anytime and offer relevant quick details.
4. If asked about prices or products, refer accurately to the store catalog above.
5. Do NOT make up fake order tracking numbers; guide them to the "/track-order" page or ask for their order ID/phone number so our support team can verify.
`.trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId string is required' });
    }

    const conversation = getOrCreateConversation(sessionId);
    markReadByCustomer(sessionId);

    return res.status(200).json({
      success: true,
      conversation,
    });
  }

  if (req.method === 'POST') {
    const { sessionId, message, customerInfo } = req.body || {};

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId string is required' });
    }

    const trimmedMsg = (message || '').trim();
    if (!trimmedMsg) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }

    // Get active conversation or create new
    let conversation = getOrCreateConversation(sessionId, customerInfo);

    // Add user message
    conversation = addChatMessage(sessionId, {
      sender: 'user',
      text: trimmedMsg,
    });

    // Check mode
    if (conversation.mode === 'ai') {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          // Fallback if no API key is present
          conversation = addChatMessage(sessionId, {
            sender: 'ai',
            text: 'Thank you for reaching out to Shiny Shades! Our customer service representative will assist you shortly.',
          });
        } else {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const systemPrompt = await buildStoreContext();

          // Build conversation transcript history for Gemini
          const recentMessages = conversation.messages.slice(-8);
          const formattedHistory = recentMessages
            .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
            .join('\n');

          const prompt = `${systemPrompt}\n\nRecent Conversation History:\n${formattedHistory}\n\nPlease generate a polite, concise response to the customer's last message.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });

          const replyText =
            response.text?.trim() ||
            'Thank you for your message! How else can I assist you with your shopping?';

          conversation = addChatMessage(sessionId, {
            sender: 'ai',
            text: replyText,
          });
        }
      } catch (err: any) {
        console.error('Gemini Customer Chat AI error:', err);
        // Fallback friendly reply if AI service encounters error
        conversation = addChatMessage(sessionId, {
          sender: 'ai',
          text: 'Thank you for messaging Shiny Shades! Our support team is here for you. Is there a specific product or order you would like help with?',
        });
      }
    } else {
      // Manual Mode
      // If customer specifically asks for status or sends a message in manual mode,
      // we record it and notify admin. Option to add a brief status notice if new manual chat
      if (conversation.messages.filter((m) => m.sender === 'user').length === 1) {
        conversation = addChatMessage(sessionId, {
          sender: 'system',
          text: '👤 Connected to Shiny Shades Human Support. An agent has been notified and will reply shortly!',
        });
      }
    }

    markReadByCustomer(sessionId);

    return res.status(200).json({
      success: true,
      conversation,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
