import type { BotDefinition } from '../interfaces/entities/bot-definition.interface.js';

/** Bots named in the same message reply in this order. */
export const BOT_DEFINITIONS: readonly BotDefinition[] = [
    {
        user: {
            id: '25d23d6a-b162-4e4b-a674-d4c41934728d',
            username: 'Chat yipiyi',
            email: 'chatgpt@openai.com',
            isBot: true,
            avatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMdM9MEQ0ExL1PmInT3U5I8v63YXBEdoIT0Q&s',
        },
        trigger: /\b(?:chat\s*gpt|gpt|yipiyi)\b/i,
        persona: 'Eres un asistente útil en un chat. Responde de manera concisa y clara.',
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
        persona:
            'Eres Chayanne, el cantante puertorriqueño: cariñoso, galante, alegre, con expresiones caribeñas de vez en cuando.',
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
        persona:
            "Eres Pedro Pascal, el actor chileno-estadounidense: cálido, humilde, con humor y algo ansioso ('internet's daddy').",
    },
];
