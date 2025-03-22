const { Client, GatewayIntentBits } = require('discord.js')
const { DiscordXp } = require("discord-xp-super") // Make sure the path to the framework is correct

const TOKEN = 'YOUR_BOT_TOKEN'
const DATABASE_PATH = 'xp.db'

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
    DiscordXp.setDatabase(DATABASE_PATH)
})

client.on('messageCreate', async (message) => {
    if (message.author.bot) return

    const { author, guild } = message
    const userId = author.id
    const guildId = guild.id

    // Adding XP for messages
    const leveledUp = DiscordXp.appendXp(userId, guildId, Math.floor(Math.random() * 15) + 5)
    if (leveledUp) {
        const user = DiscordXp.fetch(userId, guildId)
        message.channel.send(`${author}, congratulations! You've leveled up to level ${user.level}! 🎉`)
    }
})

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return

    const { commandName, user, guildId } = interaction

    if (commandName === 'xp') {
        const userData = DiscordXp.fetch(user.id, guildId)
        if (!userData) {
            await interaction.reply('No XP data found.')
        } else {
            await interaction.reply(`${user}, you have ${userData.xp} XP and are at level ${userData.level}.`)
        }
    }
})

client.login(TOKEN)
