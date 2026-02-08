export interface DiscordConfig {
  token: string;
  clientId: string;
  guildId?: string;
  welcomeChannelName: string;
  logsChannelName: string;
  moderationChannelName: string;
  defaultRoles: string[];
  channels: ChannelConfig[];
  roles: RoleConfig[];
  moderation: ModerationConfig;
}

export interface ChannelConfig {
  name: string;
  type: 'text' | 'voice' | 'category' | 'announcement';
  category?: string;
  description?: string;
  permissions?: ChannelPermission[];
}

export interface ChannelPermission {
  role: string;
  allow: string[];
  deny: string[];
}

export interface RoleConfig {
  name: string;
  color: string;
  permissions: string[];
  hoist: boolean;
  mentionable: boolean;
}

export interface ModerationConfig {
  enabled: boolean;
  spamThreshold: number;
  spamTimeWindow: number;
  bannedWords: string[];
  maxMentions: number;
  maxLinks: number;
  autoModRoles: string[];
}

export const defaultConfig: DiscordConfig = {
  token: process.env.DISCORD_BOT_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  guildId: process.env.DISCORD_GUILD_ID,
  welcomeChannelName: 'welcome',
  logsChannelName: 'mod-logs',
  moderationChannelName: 'moderation',
  defaultRoles: ['Community Member'],
  channels: [
    {
      name: 'General',
      type: 'category',
      description: 'General discussion channels',
    },
    {
      name: 'welcome',
      type: 'announcement',
      category: 'General',
      description: 'Welcome new members',
    },
    {
      name: 'general',
      type: 'text',
      category: 'General',
      description: 'General discussion',
    },
    {
      name: 'introductions',
      type: 'text',
      category: 'General',
      description: 'Introduce yourself',
    },
    {
      name: 'Development',
      type: 'category',
      description: 'Development and technical discussions',
    },
    {
      name: 'dev-chat',
      type: 'text',
      category: 'Development',
      description: 'Developer discussions',
    },
    {
      name: 'code-review',
      type: 'text',
      category: 'Development',
      description: 'Code review requests',
    },
    {
      name: 'bug-reports',
      type: 'text',
      category: 'Development',
      description: 'Report bugs and issues',
    },
    {
      name: 'Beta Testing',
      type: 'category',
      description: 'Beta testing channels',
    },
    {
      name: 'beta-announcements',
      type: 'announcement',
      category: 'Beta Testing',
      description: 'Beta feature announcements',
      permissions: [
        {
          role: 'Beta Tester',
          allow: ['ViewChannel', 'ReadMessageHistory'],
          deny: ['SendMessages'],
        },
      ],
    },
    {
      name: 'beta-feedback',
      type: 'text',
      category: 'Beta Testing',
      description: 'Beta testing feedback',
      permissions: [
        {
          role: 'Beta Tester',
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
          deny: [],
        },
      ],
    },
    {
      name: 'Moderation',
      type: 'category',
      description: 'Moderation channels',
    },
    {
      name: 'mod-logs',
      type: 'text',
      category: 'Moderation',
      description: 'Moderation logs',
      permissions: [
        {
          role: 'Moderator',
          allow: ['ViewChannel', 'SendMessages'],
          deny: [],
        },
      ],
    },
    {
      name: 'Voice Channels',
      type: 'category',
      description: 'Voice channels',
    },
    {
      name: 'General Voice',
      type: 'voice',
      category: 'Voice Channels',
      description: 'General voice chat',
    },
    {
      name: 'Dev Voice',
      type: 'voice',
      category: 'Voice Channels',
      description: 'Developer voice chat',
    },
  ],
  roles: [
    {
      name: 'Admin',
      color: '#FF0000',
      permissions: ['Administrator'],
      hoist: true,
      mentionable: true,
    },
    {
      name: 'Moderator',
      color: '#FFA500',
      permissions: [
        'ManageMessages',
        'KickMembers',
        'BanMembers',
        'ManageChannels',
        'ViewAuditLog',
      ],
      hoist: true,
      mentionable: true,
    },
    {
      name: 'Developer',
      color: '#00FF00',
      permissions: ['SendMessages', 'AttachFiles', 'EmbedLinks'],
      hoist: true,
      mentionable: true,
    },
    {
      name: 'Beta Tester',
      color: '#0099FF',
      permissions: ['SendMessages', 'AttachFiles', 'EmbedLinks'],
      hoist: true,
      mentionable: true,
    },
    {
      name: 'Community Member',
      color: '#CCCCCC',
      permissions: ['SendMessages', 'AttachFiles', 'EmbedLinks'],
      hoist: false,
      mentionable: false,
    },
  ],
  moderation: {
    enabled: true,
    spamThreshold: 5,
    spamTimeWindow: 5000,
    bannedWords: [],
    maxMentions: 5,
    maxLinks: 3,
    autoModRoles: ['Moderator', 'Admin'],
  },
};

export function getConfig(): DiscordConfig {
  return defaultConfig;
}

export function validateConfig(config: DiscordConfig): boolean {
  if (!config.token || config.token === '') {
    console.error('Discord bot token is required');
    return false;
  }

  if (!config.clientId || config.clientId === '') {
    console.error('Discord client ID is required');
    return false;
  }

  return true;
}
