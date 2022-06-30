import {
    APIApplicationCommandInteraction,
    APIPingInteraction,
    InteractionResponseType,
    InteractionType,
} from 'discord-api-types/v10';
import { ENV } from './@types/ENV';
import { i18n } from './locales/i18n';
import { CommandHandler } from './structures/CommandHandler';
import { verifyKey } from './utility/verify';

export default {
    fetch: async (request: Request, env: ENV) => {
        if (request.method === 'POST') {
            const isValidRequest = await verifyKey(request, env);

            if (!isValidRequest) {
                return new Response('Bad request signature.', { status: 401 });
            }

            const interaction = await request.json() as
                | APIApplicationCommandInteraction
                | APIPingInteraction;

            if (interaction.type === InteractionType.Ping) {
                return new Response(
                    JSON.stringify({
                        type: InteractionResponseType.Pong,
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            }

            Object.defineProperty(
                interaction,
                'i18n',
                {
                    value: new i18n(interaction.locale),
                },
            );

            return new CommandHandler().handle(interaction, env);
        }

        return new Response('', { status: 400 });
    },
};

declare module 'discord-api-types/v10' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface APIBaseInteraction<Type extends InteractionType, Data> {
        i18n: i18n;
    }
}