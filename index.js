const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField,
  EmbedBuilder 
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const prefix = ".";

// ======================
// 💾 DATABASE
// ======================
let data = {};

if (fs.existsSync("./data.json")) {
  try { data = JSON.parse(fs.readFileSync("./data.json")); } catch {}
}

function save() {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

function getUser(id) {
  if (!data[id]) {
    data[id] = {
      orbits: 250,
      bank: 0,
      bankLimit: 5000,
      inventory: [],
      warnings: 0,
      prestige: 0,
      lastDaily: 0,
      lastWork: 0,
      lastSpin: 0,
      lastRob: 0
    };
  }

  data[id].lastWork ??= 0;
  data[id].lastSpin ??= 0;
  data[id].lastRob ??= 0;

  return data[id];
}

// ======================
// 🛒 SHOP
// ======================
const shop = {
  shield: { price: 500 },
  boost: { price: 300 },
  bankupgrade: { price: 15000 }
};

// ======================
// 🎭 ROLE SHOP (PUT IDS)
// ======================
const roleShop = {
  vip: { price: 5000, roleId: "ROLE_ID_HERE" },
  elite: { price: 15000, roleId: "ROLE_ID_HERE" }
};

// ======================
client.once("ready", () => {
  console.log("💜 Orbit V8 FULL ONLINE");
});

// ======================
// 👋 JOIN / LEAVE
// ======================
client.on("guildMemberAdd", member => {
  const ch = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setTitle("👋 Welcome")
    .setDescription(`${member} joined`);

  ch.send({ embeds: [embed] });
});

client.on("guildMemberRemove", member => {
  const ch = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("👋 Goodbye")
    .setDescription(`${member.user.tag} left`);

  ch.send({ embeds: [embed] });
});

// ======================
// 📦 COMMANDS
// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const user = getUser(message.author.id);
  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

  // ======================
  // 💜 HELP
  // ======================
  if (cmd === "help") {
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor("Purple")
        .setTitle("💜 Orbit Help")
        .setDescription(`
💰 Economy: balance, daily, work, pay  
🏦 Bank: paybank, withdraw, bankbalance  
🎰 Spin: spin  
🛒 Shop: shop, buy, inventory, roleshop  
💀 Crime: rob  
🏆 Prestige: prestige  
🧰 Utility: ping, avatar, userinfo, serverinfo, uptime, math  
🛠 Mod: kick, ban, timeout, clear, warn, warnings  
👮 Admin: admhelp
        `)]
    });
  }

  // ======================
  // 💰 ECONOMY
  // ======================
  if (cmd === "balance") {
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor("Purple")
        .setTitle(`${message.author.username}`)
        .addFields(
          { name: "💜 Wallet", value: `${user.orbits}`, inline: true },
          { name: "🏦 Bank", value: `${user.bank}/${user.bankLimit}`, inline: true },
          { name: "🏆 Prestige", value: `${user.prestige}`, inline: true }
        )]
    });
  }

  if (cmd === "daily") {
    if (Date.now() - user.lastDaily < 86400000)
      return message.reply("⏳ Already claimed.");

    const reward = Math.floor(Math.random() * 200) + 150;
    user.orbits += reward;
    user.lastDaily = Date.now();
    save();

    return message.reply(`💜 +${reward}`);
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply("⏳ Wait 1 min.");

    let earn = Math.floor(Math.random() * 150) + 50;
    if (user.inventory.includes("boost")) earn *= 1.5;

    user.orbits += Math.floor(earn);
    user.lastWork = Date.now();
    save();

    return message.reply(`💼 +${Math.floor(earn)}`);
  }

  if (cmd === "pay") {
    const t = message.mentions.users.first();
    const amt = parseInt(args[1]);
    if (!t || !amt || user.orbits < amt) return;

    getUser(t.id).orbits += amt;
    user.orbits -= amt;
    save();

    return message.reply(`💸 Sent ${amt}`);
  }

  // ======================
  // 🎰 SPIN
  // ======================
  if (cmd === "spin") {
    if (Date.now() - user.lastSpin < 300000)
      return message.reply("⏳ 5 min cooldown.");

    const reward = Math.floor(Math.random() * 400);
    user.orbits += reward;
    user.lastSpin = Date.now();
    save();

    return message.reply(`🎰 +${reward}`);
  }

  // ======================
  // 🏦 BANK
  // ======================
  if (cmd === "bankbalance")
    return message.reply(`🏦 ${user.bank}/${user.bankLimit}`);

  if (cmd === "paybank") {
    const amt = parseInt(args[0]);
    if (!amt || user.orbits < amt) return;

    if (user.bank + amt > user.bankLimit)
      return message.reply("Bank full.");

    user.orbits -= amt;
    user.bank += amt;
    save();

    return message.reply(`Deposited ${amt}`);
  }

  if (cmd === "withdraw") {
    const amt = parseInt(args[0]);
    if (!amt || user.bank < amt) return;

    user.bank -= amt;
    user.orbits += amt;
    save();

    return message.reply(`Withdrew ${amt}`);
  }

  // ======================
  // 💀 ROB
  // ======================
  if (cmd === "rob") {
    const t = message.mentions.users.first();
    if (!t || t.bot || t.id === message.author.id)
      return message.reply("Invalid.");

    const target = getUser(t.id);
    if (target.orbits <= 0) return message.reply("No money.");

    if (Date.now() - user.lastRob < 1800000)
      return message.reply("Cooldown.");

    const steal = Math.floor(Math.random() * Math.min(200, target.orbits));

    user.orbits += steal;
    target.orbits -= steal;
    user.lastRob = Date.now();

    save();
    return message.reply(`💀 ${steal}`);
  }

  // ======================
  // 🛒 SHOP
  // ======================
  if (cmd === "shop") {
    return message.reply("shield 500 | boost 300 | bankupgrade 15000");
  }

  if (cmd === "buy") {
    const item = args[0];
    if (!shop[item]) return;

    if (user.orbits < shop[item].price)
      return message.reply("Not enough.");

    user.orbits -= shop[item].price;

    if (item === "bankupgrade") {
      user.bankLimit = 100000;
    } else {
      user.inventory.push(item);
    }

    save();
    return message.reply(`Bought ${item}`);
  }

  if (cmd === "inventory")
    return message.reply(user.inventory.join(", ") || "Empty");

  // ======================
  // 🎭 ROLE SHOP
  // ======================
  if (cmd === "roleshop") {
    let msg = "";
    for (let r in roleShop) msg += `${r} - ${roleShop[r].price}\n`;
    return message.reply(msg);
  }

  if (cmd === "buyrole") {
    const item = roleShop[args[0]];
    if (!item) return;

    if (user.orbits < item.price)
      return message.reply("Not enough.");

    const role = message.guild.roles.cache.get(item.roleId);
    if (!role) return message.reply("Role missing.");

    await message.member.roles.add(role);

    user.orbits -= item.price;
    save();

    return message.reply(`Got role ${role.name}`);
  }

  // ======================
  // 🏆 PRESTIGE
  // ======================
  if (cmd === "prestige") {
    if (user.orbits < 50000)
      return message.reply("Need 50k.");

    user.orbits = 250;
    user.bank = 0;
    user.prestige++;

    save();
    return message.reply(`Prestige ${user.prestige}`);
  }

  // ======================
  // 🧰 UTILITY
  // ======================
  if (cmd === "ping") return message.reply("Pong");

  if (cmd === "avatar") {
    const t = message.mentions.users.first() || message.author;
    return message.reply(t.displayAvatarURL());
  }

  if (cmd === "userinfo") {
    const t = message.mentions.users.first() || message.author;
    return message.reply(`${t.username} | ${t.id}`);
  }

  if (cmd === "serverinfo") {
    return message.reply(`${message.guild.name} | ${message.guild.memberCount}`);
  }

  if (cmd === "uptime") {
    return message.reply(`${Math.floor(client.uptime/1000)}s`);
  }

  if (cmd === "math") {
    try {
      return message.reply(eval(args.join(" ")).toString());
    } catch {
      return message.reply("Error");
    }
  }

  // ======================
  // 🛠 MODERATION
  // ======================
  if (cmd === "clear") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const amt = parseInt(args[0]);
    if (amt) message.channel.bulkDelete(amt);
  }

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
    const t = message.mentions.members.first();
    if (t) t.kick();
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
    const t = message.mentions.members.first();
    if (t) t.ban();
  }

  if (cmd === "timeout") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    const t = message.mentions.members.first();
    if (t) t.timeout(60000);
  }

  if (cmd === "warn") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    if (!t) return;

    getUser(t.id).warnings++;
    save();

    return message.reply(`Warned ${t.username}`);
  }

  if (cmd === "warnings") {
    const t = message.mentions.users.first() || message.author;
    return message.reply(`Warnings: ${getUser(t.id).warnings}`);
  }

  // ======================
  // 👮 ADMIN
  // ======================
  if (cmd === "admhelp") {
    if (!isAdmin) return;
    return message.reply(`
.addorbits
.resetorbits
.resetbank
.say
.slowmode
    `);
  }

  if (cmd === "addorbits") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    const amt = parseInt(args[1]);
    if (t && amt) getUser(t.id).orbits += amt, save();
  }

  if (cmd === "resetorbits") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    if (t) getUser(t.id).orbits = 0, save();
  }

  if (cmd === "resetbank") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    if (t) {
      const u = getUser(t.id);
      u.bank = 0;
      u.bankLimit = 5000;
      save();
    }
  }

  if (cmd === "say") {
    if (!isAdmin) return;
    message.channel.send(args.join(" "));
  }

  if (cmd === "slowmode") {
    if (!isAdmin) return;
    const seconds = parseInt(args[0]);
    message.channel.setRateLimitPerUser(seconds);
  }

});

client.login(process.env.TOKEN);