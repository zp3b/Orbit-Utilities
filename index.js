const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = ".";

// ======================
// 💾 DATABASE
// ======================
let data = {};

if (fs.existsSync("./data.json")) {
  try {
    data = JSON.parse(fs.readFileSync("./data.json"));
  } catch {
    data = {};
  }
}

function save() {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

function getUser(id) {
  if (!data[id]) {
    data[id] = {
      orbits: 500,
      inventory: [],
      warnings: 0,
      lastDaily: 0,
      lastWork: 0
    };
  }
  return data[id];
}

// ======================
// 🛒 SHOP (NO GAMBLING)
// ======================
const shop = {
  shield: { price: 500, desc: "Protects from rob 🛡️" },
  boost: { price: 300, desc: "Future bonus item ⚡" },
  ticket: { price: 200, desc: "Cosmetic item 🎟️" }
};

// ======================
// 🚀 READY
// ======================
client.once("ready", () => {
  console.log(`💜 Orbit Utilities online as ${client.user.tag}`);
});

// ======================
// 📦 COMMAND HANDLER
// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const user = getUser(message.author.id);

  // ======================
  // 💜 ECONOMY
  // ======================

  if (cmd === "balance") {
    return message.reply(`💜 You have **${user.orbits} Orbits**`);
  }

  if (cmd === "daily") {
    const now = Date.now();
    if (now - user.lastDaily < 86400000)
      return message.reply("⏳ Already claimed daily.");

    const reward = Math.floor(Math.random() * 200) + 150;
    user.orbits += reward;
    user.lastDaily = now;
    save();

    return message.reply(`💜 Daily reward: +${reward} Orbits`);
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply("⏳ Wait before working again.");

    const jobs = ["Developer", "Builder", "Miner", "Trader"];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earn = Math.floor(Math.random() * 150) + 50;

    user.orbits += earn;
    user.lastWork = Date.now();
    save();

    return message.reply(`💼 You worked as **${job}** and earned ${earn} Orbits`);
  }

  if (cmd === "rob") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention someone.");

    const t = getUser(target.id);

    if (t.inventory.includes("shield"))
      return message.reply("🛡️ They are protected!");

    const amount = Math.floor(Math.random() * 200);

    user.orbits += amount;
    t.orbits -= amount;
    save();

    return message.reply(`💀 You robbed ${target.username} for ${amount} Orbits`);
  }

  // ======================
  // 🛒 SHOP SYSTEM
  // ======================

  if (cmd === "shop") {
    let msg = "🛒 ORBIT SHOP\n\n";
    for (let item in shop) {
      msg += `${item} - 💜 ${shop[item].price} | ${shop[item].desc}\n`;
    }
    return message.reply(msg);
  }

  if (cmd === "buy") {
    const item = args[0];
    if (!shop[item]) return message.reply("Invalid item.");

    if (user.orbits < shop[item].price)
      return message.reply("Not enough Orbits.");

    user.orbits -= shop[item].price;
    user.inventory.push(item);
    save();

    return message.reply(`🛒 Bought **${item}**`);
  }

  if (cmd === "inventory") {
    return message.reply(`🎒 Inventory: ${user.inventory.join(", ") || "Empty"}`);
  }

  // ======================
  // 🏆 LEADERBOARD
  // ======================

  if (cmd === "top") {
    const sorted = Object.entries(data)
      .sort((a, b) => b[1].orbits - a[1].orbits)
      .slice(0, 10);

    let msg = "🏆 ORBIT LEADERBOARD\n\n";

    sorted.forEach((u, i) => {
      msg += `${i + 1}. <@${u[0]}> — 💜 ${u[1].orbits}\n`;
    });

    return message.reply(msg);
  }

  // ======================
  // ⚠️ WARN SYSTEM
  // ======================

  if (cmd === "warn") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return message.reply("No permission.");

    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention user.");

    const t = getUser(target.id);
    t.warnings += 1;
    save();

    return message.reply(`⚠️ ${target.username} now has ${t.warnings} warnings`);
  }

  if (cmd === "warnings") {
    const target = message.mentions.users.first() || message.author;
    const t = getUser(target.id);

    return message.reply(`⚠️ ${target.username}: ${t.warnings} warnings`);
  }

  // ======================
  // 🧰 UTILITY
  // ======================

  if (cmd === "ping") {
    return message.reply("🏓 Pong!");
  }

  if (cmd === "avatar") {
    const target = message.mentions.users.first() || message.author;
    return message.reply(target.displayAvatarURL({ size: 1024 }));
  }

  if (cmd === "uptime") {
    return message.reply(`⏱ ${Math.floor(client.uptime / 1000)}s`);
  }

  // ======================
  // 🛒 HELP (SHOP ONLY)
  // ======================

  if (cmd === "help") {
    return message.reply(`
💜 **ORBIT SHOP**

🛒 Items:
• shield — 500 💜 (protects from rob)
• boost — 300 💜
• ticket — 200 💜

Commands:
.shop
.buy <item>
.inventory
    `);
  }

  // ======================
  // 🛠️ MODERATION
  // ======================

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return;

    const target = message.mentions.members.first();
    if (target) await target.kick();
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return;

    const target = message.mentions.members.first();
    if (target) await target.ban();
  }

  if (cmd === "clear") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return;

    const amount = parseInt(args[0]);
    if (!amount) return;

    await message.channel.bulkDelete(amount, true);
  }

});

client.login(process.env.TOKEN);