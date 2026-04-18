const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = ".";

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // =====================
  // ⚡ UTILITY COMMANDS
  // =====================

  if (cmd === "ping") {
    return message.reply("Pong 🏓");
  }

  if (cmd === "help") {
    return message.reply(`
**Orbit Utilities Commands**
.prefix = .

⚡ Utility:
.ping, .help, .uptime, .avatar, .say

🛠️ Moderation:
.ban, .kick, .timeout, .clear
    `);
  }

  if (cmd === "uptime") {
    const seconds = Math.floor(client.uptime / 1000);
    return message.reply(`Uptime: ${seconds}s`);
  }

  if (cmd === "avatar") {
    const user = message.mentions.users.first() || message.author;
    return message.reply(user.displayAvatarURL({ size: 1024 }));
  }

  if (cmd === "say") {
    const text = args.join(" ");
    if (!text) return message.reply("Say what?");
    message.channel.send(text);
  }

  // =====================
  // 🛠️ MODERATION COMMANDS
  // =====================

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return message.reply("No permission.");

    const user = message.mentions.members.first();
    if (!user) return message.reply("Mention a user.");

    await user.ban();
    message.reply(`${user.user.tag} has been banned.`);
  }

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return message.reply("No permission.");

    const user = message.mentions.members.first();
    if (!user) return message.reply("Mention a user.");

    await user.kick();
    message.reply(`${user.user.tag} has been kicked.`);
  }

  if (cmd === "timeout") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return message.reply("No permission.");

    const user = message.mentions.members.first();
    const time = args[1];

    if (!user) return message.reply("Mention a user.");
    if (!time) return message.reply("Provide time in ms.");

    await user.timeout(parseInt(time));
    message.reply(`${user.user.tag} timed out.`);
  }

  if (cmd === "clear") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply("No permission.");

    const amount = parseInt(args[0]);
    if (!amount) return message.reply("Enter number.");

    await message.channel.bulkDelete(amount, true);
    message.channel.send(`Deleted ${amount} messages.`).then(msg => {
      setTimeout(() => msg.delete(), 3000);
    });
  }

});

client.login(process.env.TOKEN);