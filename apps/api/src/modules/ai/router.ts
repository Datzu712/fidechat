import { jsonSchema } from 'ai';

import { type AIBot, BOTS } from './bots.js';
import type { ChannelHistoryEntry } from './prompt.js';

export type SpeakerKind = 'addressed' | 'spontaneous';

export interface PlannedSpeaker {
    bot: AIBot;
    kind: SpeakerKind;
}

/** How many channel messages the router reads. */
export const ROUTER_HISTORY_LIMIT = 20;
const MAX_UNNAMED_SPEAKERS = 2;

export const ROUTER_INSTRUCTIONS = `Eres el moderador invisible de un chat de grupo donde conviven personas y estos bots:
${BOTS.map((bot) => `- ${bot.user.username}: ${bot.routerDescription}`).join('\n')}

Te paso la conversación reciente. Los mensajes marcados con [NUEVO] acaban de llegar. Decide qué bots deberían responder AHORA, como lo haría una persona real en un chat de grupo.

Reglas:
- "addressed": el mensaje nuevo va dirigido a ese bot, aunque no lo nombre (le siguen el hilo, le responden, "¿y tú qué opinas?" justo después de que habló).
- Si la pregunta habla SOBRE otros bots (p. ej. "¿quién baila mejor entre ellos dos?"), va dirigida a quien venía conversando con la persona o a quien no se menciona, no a los mencionados.
- "spontaneous": nadie le habla, pero el tema encaja claramente con su personalidad y aportaría algo. Úsalo con moderación: en un chat real la gente no opina de todo.
- Si alguien invita al grupo a opinar, elige **un** bot como "addressed" según el historial.
- Si las personas están hablando entre ellas de algo que no es para un bot, no responde nadie.
- Si alguien aclara que un mensaje era para un bot ("era para X", "iba para X"), ese bot responde ("addressed") a lo que se le había preguntado.
- Saludos al grupo ("hola?", "hay alguien?"): responde UN bot, el más natural.
- Risas, "gracias", despedidas: normalmente nadie.
- Lo normal es que no responda ningún bot. Máximo 2 bots.`;

export const ROUTER_SCHEMA = jsonSchema<{ speakers: Array<{ bot: string; kind: SpeakerKind; reason: string }> }>({
    type: 'object',
    additionalProperties: false,
    required: ['speakers'],
    properties: {
        speakers: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['bot', 'kind', 'reason'],
                properties: {
                    bot: { type: 'string', enum: BOTS.map((bot) => bot.user.username) },
                    kind: { type: 'string', enum: ['addressed', 'spontaneous'] },
                    reason: { type: 'string' },
                },
            },
        },
    },
});

/** The last messages as `"<author>: <content>"` lines, new ones prefixed with `[NUEVO] `. */
export function buildRouterPrompt(
    history: ChannelHistoryEntry[],
    newIds: ReadonlySet<string>,
    exclude: readonly AIBot[] = [],
): string {
    const lines = history
        .slice(-ROUTER_HISTORY_LIMIT)
        .map((entry) => `${newIds.has(entry.id) ? '[NUEVO] ' : ''}${entry.authorName}: ${entry.content}`);
    if (exclude.length === 0) return lines.join('\n');

    const names = exclude.map((bot) => bot.user.username).join(', ');
    return `${lines.join('\n')}\n\nAcaban de responder: ${names}. ¿Algún otro bot tiene algo con gracia que decir sobre esas respuestas (discrepar, picarlo con cariño, rematar el chiste)? Si nada lo pide, ninguno. Solo bots distintos de ${names}.`;
}

/**
 * Router `addressed` first, then named bots the router missed, then `spontaneous` ones under their cap. A named bot
 * is always addressed and never trimmed: bots nobody named are dropped from the tail down to `max(2, named.length)`.
 */
export function planSpeakers(
    decision: PlannedSpeaker[] | null,
    named: readonly AIBot[],
    canSpeakSpontaneously: (bot: AIBot) => boolean,
): PlannedSpeaker[] {
    const picks = decision ?? [];
    const speakers: PlannedSpeaker[] = [];
    const add = (bot: AIBot, kind: SpeakerKind) => {
        if (!speakers.some((speaker) => speaker.bot === bot)) speakers.push({ bot, kind });
    };

    for (const pick of picks) {
        if (pick.kind === 'addressed') add(pick.bot, 'addressed');
    }
    for (const bot of BOTS) {
        if (named.includes(bot)) add(bot, 'addressed');
    }
    for (const pick of picks) {
        if (pick.kind === 'spontaneous' && canSpeakSpontaneously(pick.bot)) add(pick.bot, 'spontaneous');
    }

    let unnamedSlots = Math.max(MAX_UNNAMED_SPEAKERS, named.length) - named.length;
    return speakers.filter(({ bot }) => named.includes(bot) || unnamedSlots-- > 0);
}
