import { BOT_DEFINITIONS } from '@fidechat/shared';

import type { AppUser } from '@/infrastructure/database/schema/index.js';

export interface AIBot {
    user: AppUser;
    /** Case-insensitive and without the `g` flag, so `test` stays stateless. */
    trigger: RegExp;
    /** One-line persona the router LLM uses to decide which bots should reply. */
    routerDescription: string;
    systemPrompt: string;
    temperature: number;
}

export const CHAT_STYLE = `
Estás en un chat de grupo con amigos. Escribe como una persona real en un chat:
- Normalmente 1 o 2 frases cortas. Solo te extiendes si te piden explicar algo.
- Tono casual y natural; algún emoji si sale solo, sin abusar.
- Nada de acciones entre asteriscos ni narrar lo que haces.
- No comentes ni resumas la conversación; responde directo a lo último que te toca.
- Tu personalidad se nota en el tono, no en mencionar tu vida o tus éxitos en cada mensaje.
- Si te equivocaste o algo no era para ti, no te disculpes con un discurso: una frase basta.
- Los mensajes de otros llegan como "nombre: texto"; tú respondes solo con tu texto, sin tu nombre.
- Varía cómo empiezas: no abras cada mensaje con risas ("jaja") ni con el nombre de la persona.
- Si hubo un malentendido que ya se aclaró, no vuelvas a mencionarlo.
- No termines cada mensaje con una pregunta; pregunta solo cuando de verdad quieras saber algo.
- No atribuyas a otros cosas que no dijeron en la conversación.
- Con los otros bots hay confianza: puedes bromear, picarlos o llevarles la contraria con buena onda.`;

/** What only the api adds to each shared bot definition, by user id. */
const BOT_SETTINGS: Record<string, Pick<AIBot, 'routerDescription' | 'temperature'>> = {
    '25d23d6a-b162-4e4b-a674-d4c41934728d': {
        routerDescription: 'asistente útil, responde dudas técnicas y preguntas generales.',
        temperature: 0.7,
    },
    '42951c8d-51ba-453b-9758-b632020475a9': {
        routerDescription: 'el cantante puertorriqueño, cariñoso, habla de música, baile y familia.',
        temperature: 0.8,
    },
    '61e3b006-c1db-4e86-8ee2-434a86674040': {
        routerDescription:
            'el actor chileno, cálido y ansioso, habla de actuación, sus series (The Mandalorian, The Last of Us, Game of Thrones).',
        temperature: 0.8,
    },
};

/** Bots named in the same message reply in this order (the order of `BOT_DEFINITIONS`). */
export const BOTS: AIBot[] = BOT_DEFINITIONS.map(({ user, trigger, persona }) => ({
    user,
    trigger,
    ...BOT_SETTINGS[user.id],
    systemPrompt: persona + CHAT_STYLE,
}));

export function detectNamedBots(content: string): AIBot[] {
    return BOTS.filter((bot) => bot.trigger.test(content));
}
