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

// ===== DATABASE =====
let data = {};
if (fs.existsSync("./data.json")) {
  data = JSON.parse(fs.readFileSync("./data.json"));
}

function save() {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

function getUser(id) {
  if (!data[id]) {
    data[id] = {
      orbits: 500,
      lastDaily: 0,
      lastWork: 0,
      inventory: [],
      warnings: 0
    };
  }
  return data[id];
}

// ===== SHOP =====
const shop = {
  "shield": { price: 500, desc: "Protects from rob" },
  "boost": { price: 300, desc: "Extra earnings soon" }
};

// ===== READY =====
client.once("ready", () => {
  console.log(`🚀 Orbit Utilities Online as ${client.user.tag}`);
});

// ===== COMMAND HANDLER =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const user = getUser(message.author.id);

  // =====================
  // 💜 ECONOMY
  // =====================

  if (cmd === "balance") {
    return message.reply(`💜 ${user.orbits} Orbits`);
  }

  if (cmd === "daily") {
    if (Date.now() - user.lastDaily < 86400000)
      return message.reply("⏳ Come back tomorrow.");

    const amount = Math.floor(Math.random() * 300) + 200;
    user.orbits += amount;
    user.lastDaily = Date.now();
    save();

    return message.reply(`💜 Daily: +${amount}`);
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply("⏳ Wait before working again.");

    const jobs = ["Developer", "Miner", "Trader", "Pilot"];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const amount = Math.floor(Math.random() * 150) + 50;

    user.orbits += amount;
    user.lastWork = Date.now();
    save();

    return message.reply(`💼 You worked as **${job}** and earned ${amount}`);
  }

  if (cmd === "crime") {
    if (Math.random() < 0.5) {
      const loss = Math.floor(Math.random() * 100);
      user.orbits -= loss;
      save();
      return message.reply(`🚔 Failed! Lost ${loss}`);
    } else {
      const gain = Math.floor(Math.random() * 300);
      user.orbits += gain;
      save();
      return message.reply(`💰 Success! Gained ${gain}`);
    }
  }

  if (cmd === "rob") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention someone.");

    const targetData = getUser(target.id);

    if (targetData.inventory.includes("shield"))
      return message.reply("🛡️ They are protected!");

    const amount = Math.floor(Math.random() * 200);

    user.orbits += amount;
    targetData.orbits -= amount;
    save();

    message.reply(`💀 Robbed ${target.tag} for ${amount}`);
  }

  // =====================
  // 🛒 SHOP / INVENTORY
  // =====================

  if (cmd === "shop") {
    let msg = "🛒 Shop:\n";
    for (let item in shop) {
      msg += `${item} - ${shop[item].price} 💜 (${shop[item].desc})\n`;
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

    return message.reply(`🛒 Bought ${item}`);
  }

  if (cmd === "inventory") {
    return message.reply(`🎒 ${user.inventory.join(", ") || "Empty"}`);
  }

  // =====================
  // 🏆 LEADERBOARD
  // =====================

  if (cmd === "leaderboard") {
    const sorted = Object.entries(data)
      .sort((a, b) => b[1].orbits - a[1].orbits)
      .slice(0, 5);

    let msg = "🏆 Top Orbits:\n";
    sorted.forEach((u, i) => {
      msg += `${i + 1}. <@${u[0]}> - ${u[1].orbits}\n`;
    });

    return message.reply(msg);
  }

  // =====================
  // ⚠️ WARN SYSTEM
  // =====================

  if (cmd === "warn") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return message.reply("No permission.");

    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention user.");

    const targetData = getUser(target.id);
    targetData.warnings += 1;
    save();

    message.reply(`⚠️ ${target.tag} now has ${targetData.warnings} warnings`);
  }

  if (cmd === "warnings") {
    const target = message.mentions.users.first() || message.author;
    const targetData = getUser(target.id);

    return message.reply(`⚠️ ${target.tag}: ${targetData.warnings}`);
  }

  // =====================
  // 🛠️ MODERATION
  // =====================

  if (cmd === "clear") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return;

    const amount = parseInt(args[0]);
    await message.channel.bulkDelete(amount, true);
  }

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return;

    const user = message.mentions.members.first();
    if (user) await user.kick();
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return;

    const user = message.mentions.members.first();
    if (user) await user.ban();
  }

});

client.login(process.env.TOKEN);