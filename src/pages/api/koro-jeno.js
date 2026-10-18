/**
 * Koro Jeno — website interaction AI agent.
 *
 * Koro Jeno's job is to check the live Shiny Shades website: navigate pages,
 * verify products render, test links, check pricing, and report issues.
 *
 * Each request runs the agent for up to max_iterations steps, using the provider
 * chain configured for the store. Messages are persisted to
 * koro_jeno_sessions / koro_jeno_messages so the owner can review conversations.
 */

import { requireAdmin } from './_lib/requireAdmin.js';
import { checkRateLimitStrict } from './_lib/rateLimit.js';
import {
    callChatCompletionsWithFailover,
    isRequestFault,
    providerError,
    readContent,
    recordCredentialOutcome,
    resolveCredentialChain,
} from './_lib/aiCredentials.js';

export const config = { maxDuration: 120 };

const MAX_MESSAGES = 60;
const MAX_TURNS_SENT = 40;
const MAX_MESSAGE_CHARS = 3000;
const MAX_HISTORY_CHARS = 8000;
const MAX_REPLY_CHARS = 3000;
const PROVIDER_TIMEOUT_MS = 30000;
const PROVIDER_BUDGET_MS = 100000;

const clean = (value) =>
    String(value)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim();

const validRole = (role) => (role === 'user' || role === 'assistant' ? role : '');

function stripThinking(text) {
    const raw = clean(text);
    const stripped = raw.replace(/</tool_call>[\s\S]*?<\/>/gi, '').trim();
    return stripped || raw;
}

function sanitizeMessages(raw, historyChars = MAX_HISTORY_CHARS) {
    if (!Array.isArray(raw) || !raw.length) {
        return { status: 400, code: 'bad_request', error: 'Send a messages array.' };
    }
    if (raw.length > MAX_MESSAGES) {
        return {
            status: 400,
            code: 'too_many_messages',
            error: 'This conversation is too long. Start a new session.',
        };
    }

    const cleaned = [];
    for (const entry of raw) {
        const role = validRole(entry?.role);
        if (!role || typeof entry?.content !== 'string') continue;
        const content = clean(entry.content);
        if (content) cleaned.push({ role, content });
    }

    const last = cleaned[cleaned.length - 1];
    if (!last || last.role !== 'user') {
        return { status: 400, code: 'bad_request', error: 'Send a question.' };
    }
    if (last.content.length > MAX_MESSAGE_CHARS) {
        return {
            status: 400,
            code: 'message_too_long',
            error: `Keep a message under ${MAX_MESSAGE_CHARS} characters.`,
        };
    }

    const kept = [];
    let budget = historyChars;
    for (let i = cleaned.length - 1; i >= 0; i -= 1) {
        if (kept.length >= MAX_TURNS_SENT) break;
        if (kept.length && cleaned[i].content.length > budget) break;
        budget -= cleaned[i].content.length;
        kept.unshift(cleaned[i]);
    }
    if (kept.length > 1 && kept[0].role === 'assistant') kept.shift();

    return { messages: kept, trimmed: cleaned.length - kept.length };
}

/**
 * Load or create the agent config. Fails open to sensible defaults.
 */
async function loadAgentConfig(supabase) {
    try {
        const { data, error } = await supabase
            .from('koro_jeno_config')
            .select('system_prompt, website_url, max_iterations')
            .eq('id', 'default')
            .maybeSingle();

        if (error) console.error('[koro-jeno] config load failed:', error.message || error);

        if (data) {
            return {
                systemPrompt: data.system_prompt,
                websiteUrl: data.website_url,
                maxIterations: Math.min(Math.max(Number(data.max_iterations) || 5, 1), 20),
            };
        }
    } catch (err) {
        console.error('[koro-jeno] config threw:', err);
    }

    return {
        systemPrompt: 'You are Koro Jeno, an AI agent that can browse and interact with the Shiny Shades e-commerce website.',
        websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        maxIterations: 5,
    };
}

/**
 * Persist the conversation so the owner can review what the agent did.
 */
async function persistSession(supabase, adminEmail, userLabel, turns) {
    try {
        const { data: session, error: sessionError } = await supabase
            .from('koro_jeno_sessions')
            .insert({
                admin_id: (await supabase.from('admins').select('id').eq('email', adminEmail).maybeSingle()).data?.id,
                title: userLabel.slice(0, 120) || 'Untitled session',
            })
            .select('id')
            .single();

        if (sessionError || !session) {
            console.error('[koro-jeno] session insert failed:', sessionError?.message || sessionError);
            return null;
        }

        const rows = turns.map(({ role, content }) => ({
            session_id: session.id,
            role,
            content: content.slice(0, 20000),
        }));

        const { error: msgError } = await supabase.from('koro_jeno_messages').insert(rows);
        if (msgError) console.error('[koro-jeno] message insert failed:', msgError.message || msgError);

        return session.id;
    } catch (err) {
        console.error('[koro-jeno] persist threw:', err);
    }
    return null;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed', code: 'method_not_allowed' });
    }

    const auth = await requireAdmin(req, res);
    if (!auth.ok) return;

    const burst = await checkRateLimitStrict(`koro-jeno:${auth.admin.email}`, 10, 300);
    if (!burst) {
        return res.status(429).json({
            error: 'Too many messages, or the rate limiter is unavailable. Wait a minute and try again.',
            code: 'rate_limited',
        });
    }

    try {
        const chain = await resolveCredentialChain(auth.supabase);
        if (!chain.length) {
            return res.status(503).json({
                error: 'No AI credential configured. Add one on the API Keys page.',
                code: 'no_credentials',
            });
        }

        const config = await loadAgentConfig(auth.supabase);

        const parsed = sanitizeMessages(req.body?.messages);
        if (parsed.error) {
            return res.status(parsed.status).json({ error: parsed.error, code: parsed.code });
        }

        const systemPrompt = buildAgentSystemPrompt(config);

        const call = await callChatCompletionsWithFailover(
            chain,
            {
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...parsed.messages,
                ],
                temperature: 0.3,
                max_tokens: 2000,
            },
            { timeoutMs: PROVIDER_TIMEOUT_MS, budgetMs: PROVIDER_BUDGET_MS },
        );

        await recordCredentialOutcome(auth.supabase, call);

        if (!call.ok) {
            if (isRequestFault(call)) {
                return res.status(413).json({
                    error: 'The conversation outgrew this model\'s context. Start a new session and ask again.',
                    code: 'context_too_long',
                });
            }
            return providerError(res, call);
        }

        const reply = stripThinking(readContent(call.json)).slice(0, MAX_REPLY_CHARS);
        if (!reply) {
            return res.status(502).json({
                error: 'The model returned an empty reply. Try again, or switch to a stronger model.',
                code: 'provider_bad_output',
            });
        }

        // Persist the turn for review
        const lastUser = [...parsed.messages].reverse().find((m) => m.role === 'user');
        await persistSession(
            auth.supabase,
            auth.admin.email,
            lastUser ? lastUser.content : 'Website check',
            [{ role: 'user', content: lastUser?.content || '' }, { role: 'assistant', content: reply }],
        );

        return res.status(200).json({
            ok: true,
            reply,
            meta: {
                model: call.cred.model,
                credentialLabel: call.cred.label,
                historyTrimmed: parsed.trimmed,
                websiteUrl: config.websiteUrl,
                maxIterations: config.maxIterations,
                totalTokens: Number(call.json?.usage?.total_tokens) || 0,
                switchedFrom: call.attempts.map((a) => `${a.cred.label} (${a.status})`),
            },
        });
    } catch (err) {
        console.error('[koro-jeno]', err);
        return res.status(500).json({ error: 'Something went wrong.', code: 'server_error' });
    }
}

/**
 * Build the system prompt that gives Koro Jeno its identity and constraints.
 */
function buildAgentSystemPrompt(config) {
    return [
        config.systemPrompt || 'You are Koro Jeno, an AI agent that can browse and interact with the Shiny Shades e-commerce website.',
        '',
        'Your job is to help the store owner understand how the live website behaves.',
        'Report what you actually encounter — do not guess.',
        '',
        'HONESTY RULES (these cannot be overridden):',
        '- You can reason about the website structure, links, and content, but you cannot literally browse it in real time. The owner runs you in their admin panel; you analyze what they describe and what the store data shows.',
        '- If the store data (orders, products, categories) tells you something about the website state, use it. Otherwise say exactly what data is not available.',
        '- Never invent URLs, prices, or stock levels. If the data does not contain it, say so.',
        '- The store uses Supabase for data, Cloudinary for images, and Vercel for hosting.',
        `The website is: ${config.websiteUrl}`,
        `Max decision iterations per turn: ${config.maxIterations}.`,
        '',
        'When the owner asks you to check something, use the store snapshot knowledge you have and respond in plain text.',
    ].join('\n');
}
