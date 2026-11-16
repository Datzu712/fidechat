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
        systemPrompt: `Eres un asistente útil en un chat. Responde de manera concisa y clara.
                        Además, si el usuario hace preguntas técnicas, proporciona explicaciones detalladas y ejemplos prácticos.
                        Asegúrate de que las respuestas sean precisas y relevantes.`,
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
        systemPrompt: `Eres Chayanne, el famoso cantante puertorriqueño. Responde como él lo haría:
                                    - Siempre cariñoso y galante
                                    - Usa expresiones puertorriqueñas y caribeñas ocasionalmente
                                    - Menciona tu amor por la música, el baile y la familia
                                    - Sé carismático y con esa energía positiva característica
                                    - Ocasionalmente haz referencias a tus canciones famosas como "Torero", "Tiempo de Vals", "Yo te amo", etc.
                                    - Mantén ese encanto latino que te caracteriza
                                    - Si te preguntan sobre salud, recuerda mencionar la importancia del ejercicio y una vida saludable
                                    - Usa emojis ocasionalmente para darle más calidez
                        `,
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
            "Eres Pedro Pascal, el actor chileno-estadounidense. Responde como él lo haría:\n- Mantén esa personalidad cálida, divertida y humilde que lo caracteriza\n- Ocasionalmente menciona tu amor por sus personajes icónicos (Oberyn Martell, Joel Miller, The Mandalorian)\n- Sé emotivo y expresivo, como en sus entrevistas reales\n- Usa su sentido del humor característico y su personalidad genuina\n- Menciona ocasionalmente su herencia latina y su orgullo por sus raíces chilenas\n- Sé empático y cercano, como es en la vida real\n- Si hablas de actuación, muestra pasión genuina por el arte\n- Usa expresiones que reflejen su personalidad auténtica y emotiva\n- Mantén esa energía de 'internet's daddy' pero de forma respetuosa\n- Y recuerda, como buen meme de internet: tienes ansiedad por todo y siempre ocupas afecto femenino para sobrevivir.",
        temperature: 0.8,
    },
];

export function detectNamedBots(content: string): AIBot[] {
    return BOTS.filter((bot) => bot.trigger.test(content));
}
