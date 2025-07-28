import 'dotenv/config'
import { Client, GatewayIntentBits, TextChannel } from 'discord.js'
import fetch from 'node-fetch'

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN!
const CHANNEL_ID = process.env.CHANNEL_ID!
const ANILIST_API = 'https://graphql.anilist.co'

// Check for required env vars
if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables.')
  process.exit(1)
}
if (!CHANNEL_ID) {
  console.error('❌ CHANNEL_ID is not set in environment variables.')
  process.exit(1)
}

// Store the last episode notified, so we don't double-post
let lastEpisodeNotified = 0

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})

/**
 * Query AniList for the latest One Piece episode.
 */
async function fetchLatestOnePieceEpisode() {
  const query = `
    query {
      Media(id: 21, type: ANIME) {
        id
        title { romaji }
        nextAiringEpisode {
          episode
          airingAt
        }
        episodes
      }
    }
  `
  const res = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  const json = (await res.json()) as {
    data: {
      Media: {
        id: number
        title: { romaji: string }
        nextAiringEpisode: { episode: number; airingAt: number } | null
        episodes: number
      }
    }
  }
  return json.data.Media
}

async function checkOnePieceAiring() {
  try {
    const anime = await fetchLatestOnePieceEpisode()
    const nextEp = anime.nextAiringEpisode

    // Calculate current episode: next airing - 1
    const currentEpNum = nextEp ? nextEp.episode - 1 : anime.episodes

    // Only notify if we haven't already
    if (currentEpNum > lastEpisodeNotified && currentEpNum > 0) {
      lastEpisodeNotified = currentEpNum

      if (!CHANNEL_ID) {
        console.warn('CHANNEL_ID is not set. Skipping notification.')
        return
      }

      const channel = (await client.channels.fetch(CHANNEL_ID)) as TextChannel
      if (channel) {
        await channel.send(
          `🦜 **One Piece Episode ${currentEpNum} is now airing!**\nSet sail for adventure! <https://anilist.co/anime/21/One-Piece/>`
        )
      }
    }
  } catch (err) {
    console.error('Error checking airing:', err)
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return

  if (interaction.commandName === 'onepiece') {
    try {
      const anime = await fetchLatestOnePieceEpisode()
      const nextEp = anime.nextAiringEpisode

      if (nextEp) {
        const timeUntilNextEp = nextEp.airingAt * 1000 - Date.now()
        const days = Math.floor(timeUntilNextEp / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeUntilNextEp % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeUntilNextEp % (1000 * 60 * 60)) / (1000 * 60))

        await interaction.reply(`Ep ${nextEp.episode}: ${days}d ${hours}h ${minutes}m`)
      } else {
        await interaction.reply('🚨 No upcoming episodes found for One Piece.')
      }
    } catch (err) {
      console.error('Error fetching next episode:', err)
      await interaction.reply('❌ An error occurred while fetching the next episode.')
    }
  }
})

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`)

  // Register the /onepiece command
  const guild = client.guilds.cache.first()
  if (guild) {
    await guild.commands.create({
      name: 'onepiece',
      description: 'Get the time until the next One Piece episode airs'
    })
  }

  // Immediately check once, then repeat every 15 min
  checkOnePieceAiring()
  setInterval(checkOnePieceAiring, 1000 * 60 * 15)
})

client.login(DISCORD_TOKEN)
