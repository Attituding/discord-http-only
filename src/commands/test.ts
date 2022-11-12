import {
    type APIApplicationCommandAutocompleteInteraction,
    type APIChatInputApplicationCommandInteraction,
    APIContextMenuInteraction,
    type APIDMChannel,
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ButtonStyle,
    ComponentType,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10';
import type { CustomId } from '../@types/CustomId';
import type { Env } from '../@types/Env';
import { APIResponse } from '../structures/APIResponse';
import { Command } from '../structures/Command';
import { root } from '../utility/Constants';

export class TestCommand extends Command {
    public constructor(env: Env) {
        super({
            name: 'test',
            description: 'TESTING',
            env: env,
            preconditions: ['cooldown', 'ownerOnly'],
            cooldown: 10000,
        });

        this.structure = {
            chatInput: {
                name: this.name,
                description: this.description,
                options: [
                    {
                        type: ApplicationCommandOptionType.SubcommandGroup,
                        name: 'subcommandgroup',
                        description: 'description1',
                        options: [
                            {
                                type: ApplicationCommandOptionType.Subcommand,
                                name: 'subcommand',
                                description: 'description2',
                                options: [
                                    {
                                        type: ApplicationCommandOptionType.String,
                                        name: 'string',
                                        description: 'description3',
                                        required: false,
                                        autocomplete: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
                type: ApplicationCommandType.ChatInput,
            },
            user: {
                name: this.name,
                type: ApplicationCommandType.User,
            },
            message: {
                name: this.name,
                type: ApplicationCommandType.Message,
            },
        };
    }

    public override async chatInput(interaction: APIChatInputApplicationCommandInteraction) {
        const { i18n } = interaction;

        const response = await fetch(`${root}/users/@me/channels`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${this.env.DISCORD_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient_id: (interaction.member?.user ?? interaction.user)!.id,
            }),
        });

        const channel = await response.json() as APIDMChannel;

        await fetch(`${root}/channels/${channel.id}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${this.env.DISCORD_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: i18n.getMessage(
                    'commandsTestChatInputSend',
                ),
            }),
        });

        return new APIResponse({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: i18n.getMessage(
                    'commandsTestChatInputResponse',
                ),
                flags: MessageFlags.Ephemeral,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                label: 'Test',
                                style: ButtonStyle.Primary,
                                custom_id: JSON.stringify({
                                    customID: 'test',
                                } as CustomId),
                            },
                        ],
                    },
                ],
            },
        });
    }

    public override async contextMenu(interaction: APIContextMenuInteraction) {
        const { i18n } = interaction;

        const userId = 'users' in interaction.data.resolved
            ? Object.values(interaction.data.resolved.users)[0]!.id
            : null;

        const messageId = 'messages' in interaction.data.resolved
            ? Object.values(interaction.data.resolved.messages)[0]!.id
            : null;

        return new APIResponse({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: i18n.getMessage(
                    'commandsTestContextResponse', [
                        String(messageId),
                        String(userId),
                    ],
                ),
                flags: MessageFlags.Ephemeral,
            },
        });
    }

    public override async autocomplete(interaction: APIApplicationCommandAutocompleteInteraction) {
        const { i18n } = interaction;

        return new APIResponse({
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: {
                choices: [
                    {
                        name: i18n.getMessage(
                            'commandsTestAutocompleteResponse', [
                                Date.now(),
                            ],
                        ),
                        value: Date.now().toString(),
                    },
                ],
            },
        });
    }
}
