const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message]
});

// Liste des mots interdits
const motsInterdits = ["noelshack.com","imgur.com","postimg.cc","prnt.sc","gyazo.com"];

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  // Vérifie si le message contient un mot interdit
  const contientMotInterdit = motsInterdits.some(m =>
    message.content.toLowerCase().includes(m)
  );

  if (!contientMotInterdit) return; // Si aucun mot interdit → stop

  try {
    // Ban immédiat
    if (message.member && message.member.bannable) {
      await message.member.ban({ reason: 'Mot interdit détecté' });
      console.log(`🚫 ${message.author.tag} banni pour mot interdit`);
    } else {
      return console.warn(`Impossible de bannir ${message.author.tag}`);
    }

    // Nettoyage messages récents (<=100 par salon)
    const userId = message.author.id;
    const textChannels = message.guild.channels.cache.filter(ch => ch.isTextBased());
    let totalDeleted = 0;

    for (const channel of textChannels.values()) {
      try {
        const recent = await channel.messages.fetch({ limit: 100 });
        const toDelete = recent.filter(msg => msg.author?.id === userId);

        for (const msg of toDelete.values()) {
          await msg.delete().catch(() => {});
          totalDeleted++;
          await sleep(80); // pause pour éviter rate limit
        }
      } catch {
        // ignore les salons où le bot n'a pas accès
      }
    }

    console.log(`🧹 ${totalDeleted} messages supprimés pour ${message.author.tag}`);
  } catch (err) {
    console.error('Erreur ban/clean:', err);
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(process.env.TOKEN);
