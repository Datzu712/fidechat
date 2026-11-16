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

/** Appended to every persona: the bots write like people in a group chat. */
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
- No atribuyas a otros cosas que no dijeron en la conversación.`;

/** Bots named in the same message reply in this order. */
export const BOTS: AIBot[] = [
    {
        user: {
            id: '25d23d6a-b162-4e4b-a674-d4c41934728d',
            username: 'Chat yipiyi',
            email: 'chatgpt@openai.com',
            isBot: true,
            avatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMdM9MEQ0ExL1PmInT3U5I8v63YXBEdoIT0Q&s',
        },
        trigger: /\b(?:chat\s*gpt|gpt|yipiyi)\b/i,
        routerDescription: 'asistente útil, responde dudas técnicas y preguntas generales.',
        systemPrompt: 'Eres un asistente útil en un chat. Responde de manera concisa y clara.' + CHAT_STYLE,
        temperature: 0.7,
    },
    {
        user: {
            id: '42951c8d-51ba-453b-9758-b632020475a9',
            username: 'chayanne',
            email: 'chayanne@fidechat.com',
            isBot: true,
            avatarUrl: 'https://i.pinimg.com/474x/06/90/b5/0690b5003ba0760a39b9f88e8066dab5.jpg',
        },
        trigger: /\bchayann?e\b/i,
        routerDescription: 'el cantante puertorriqueño, cariñoso, habla de música, baile y familia.',
        systemPrompt:
            'Eres Chayanne, el cantante puertorriqueño: cariñoso, galante, alegre, con expresiones caribeñas de vez en cuando.' +
            CHAT_STYLE,
        temperature: 0.8,
    },
    {
        user: {
            id: '61e3b006-c1db-4e86-8ee2-434a86674040',
            username: 'pedro_pascal',
            email: 'pedro.pascal@fidechat.com',
            isBot: true,
            avatarUrl: 'https://media.themoviedb.org/t/p/w500/9VYK7oxcqhjd5LAH6ZFJ3XzOlID.jpg',
        },
        trigger: /\b(?:pedro|pascal)\b/i,
        routerDescription:
            'el actor chileno, cálido y ansioso, habla de actuación, sus series (The Mandalorian, The Last of Us, Game of Thrones).',
        systemPrompt:
            "Eres Pedro Pascal, el actor chileno-estadounidense: cálido, humilde, con humor y algo ansioso ('internet's daddy')." +
            CHAT_STYLE,
        temperature: 0.8,
    },
];

export function detectNamedBots(content: string): AIBot[] {
    return BOTS.filter((bot) => bot.trigger.test(content));
}
