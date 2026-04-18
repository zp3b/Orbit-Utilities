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
// 💾 DATABASE RESET SAFE
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
      orbits: 250,
      inventory: [],
      warnings: 0,
      lastDaily: 0,
      lastWork: 0,
      lastRob: 0,
      lastSlots: 0
    };
  }
  return data[id];
}

// ======================
// 🛒 SHOP
// ======================
const shop = {
  shield: { price: 500, desc: "Blocks rob 🛡️" },
  boost: { price: 300, desc: "Lucky boost ⚡" },
  ticket: { price: 200, desc: "Cosmetic 🎟️" }
};

// ======================
// 🚀 READY
// ======================
client.once("ready", () => {
  console.log(`💜 Orbit Utilities online as ${client.user.tag}`);
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
  // 💜 ECONOMY
  // ======================

  if (cmd === "balance") {
    return message.reply(`💜 ${user.orbits} Orbits`);
  }

  if (cmd === "daily") {
    const now = Date.now();
    if (now - user.lastDaily < 86400000)
      return message.reply("⏳ Already claimed daily.");

    const reward = Math.floor(Math.random() * 200) + 150;
    user.orbits += reward;
    user.lastDaily = now;
    save();

    return message.reply(`💜 +${reward} Orbits`);
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply("⏳ Wait.");

    const jobs = ["Dev", "Miner", "Trader", "Builder"];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earn = Math.floor(Math.random() * 150) + 50;

    user.orbits += earn;
    user.lastWork = Date.now();
    save();

    return message.reply(`💼 ${job} earned ${earn}`);
  }

  // ======================
  // 💀 ROB (FIXED RULES)
  // ======================

  if (cmd === "rob") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention someone.");

    // 🚫 no bots
    if (target.bot) return message.reply("🚫 You can't rob bots.");

    // 🚫 no self rob
    if (target.id === message.author.id)
      return message.reply("🚫 You can't rob yourself.");

    const t = getUser(target.id);

    if (t.orbits <= 0)
      return message.reply("🚫 They have 0 Orbits.");

    // ⏳ cooldown
    if (Date.now() - user.lastRob < 1800000)
      return message.reply("⏳ 30 min cooldown.");

    // 🛡️ shield
    if (t.inventory.includes("shield"))
      return message.reply("🛡️ They are protected.");

    const amount = Math.floor(Math.random() * Math.min(200, t.orbits));

    user.orbits += amount;
    t.orbits -= amount;
    user.lastRob = Date.now();

    save();

    return message.reply(`💀 Robbed ${amount} Orbits`);
  }

  // ======================
  // 🎰 SLOTS (5 MIN COOLDOWN)
  // ======================

  if (cmd === "slots") {
    const now = Date.now();

    if (now - user.lastSlots < 300000) {
      const left = Math.ceil((300000 - (now - user.lastSlots)) / 1000);
      return message.reply(`⏳ Wait ${left}s before slots again.`);
    }

    const cost = 100;
    if (user.orbits < cost)
      return message.reply("Not enough Orbits.");

    user.orbits -= cost;
    user.lastSlots = now;

    const icons = ["💜", "💰", "⭐", "💀"];

    const r1 = icons[Math.floor(Math.random() * icons.length)];
    const r2 = icons[Math.floor(Math.random() * icons.length)];
    const r3 = icons[Math.floor(Math.random() * icons.length)];

    let win = 0;

    if (r1 === r2 && r2 === r3) win = 800;
    else if (r1 === r2 || r2 === r3 || r1 === r3) win = 200;

    user.orbits += win;
    save();

    return message.reply(`🎰 ${r1} ${r2} ${r3} | ${win ? "+" + win : "No win"}`);
  }

  // ======================
  // 🛒 SHOP SYSTEM
  // ======================

  if (cmd === "shop") {
    let msg = "🛒 ORBIT SHOP\n\n";

    for (let i in shop) {
      msg += `• ${i} — 💜 ${shop[i].price}\n   ${shop[i].desc}\n\n`;
    }

    return message.reply(msg);
  }

  if (cmd === "buy") {
    const item = args[0];
    if (!item || !shop[item]) return message.reply("❌ Invalid item.");

    if (user.orbits < shop[item].price)
      return message.reply("❌ Not enough Orbits.");

    user.orbits -= shop[item].price;
    user.inventory.push(item);
    save();

    return message.reply(`🛒 Bought **${item}**`);
  }

  if (cmd === "inventory") {
    return message.reply(
      `🎒 Inventory:\n${user.inventory.length ? user.inventory.join(", ") : "Empty"}`
    );
  }

  // ======================
  // 🏆 LEADERBOARD
  // ======================

  if (cmd === "top") {
    const sorted = Object.entries(data)
      .filter(x => x[1] && typeof x[1].orbits === "number")
      .sort((a, b) => b[1].orbits - a[1].orbits)
      .slice(0, 10);

    if (!sorted.length) return message.reply("No data.");

    let msg = "🏆 ORBIT LEADERBOARD\n\n";

    sorted.forEach((u, i) => {
      msg += `${i + 1}. <@${u[0]}> — 💜 ${u[1].orbits}\n`;
    });

    return message.reply(msg);
  }

  // ======================
  // 👮 ADMIN
  // ======================

  if (cmd === "addorbits") {
    if (!isAdmin) return;

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || !amount) return;

    getUser(target.id).orbits += amount;
    save();

    return message.reply(`💜 Added ${amount}`);
  }

  if (cmd === "resetorbits") {
    if (!isAdmin) return;

    const target = message.mentions.users.first();
    if (!target) return;

    getUser(target.id).orbits = 0;
    save();

    return message.reply("🧨 Reset Orbits");
  }

  if (cmd === "resetdata") {
    if (!isAdmin) return;

    const target = message.mentions.users.first();
    if (!target) return;

    delete data[target.id];
    save();

    return message.reply("🧨 Data wiped");
  }

  if (cmd === "admhelp") {
    if (!isAdmin) return;

    return message.reply(`
👮 ADMIN COMMANDS

.kick @user
.ban @user
.clear <amount>
.warn @user

.addorbits @user amount
.resetorbits @user
.resetdata @user

⚠ Requires Manage Roles
    `);
  }

  // ======================
  // 🧰 UTILS
  // ======================

  if (cmd === "ping") return message.reply("🏓 Pong");

  if (cmd === "avatar") {
    const t = message.mentions.users.first() || message.author;
    return message.reply(t.displayAvatarURL({ size: 1024 }));
  }

  if (cmd === "help") {
    return message.reply(`
💜 ORBIT SHOP

.shop
.buy <item>
.inventory
.slots
.balance
.top
    `);
  }

  // ======================
  // 🛠 MODERATION
  // ======================

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
    const t = message.mentions.members.first();
    if (t) await t.kick();
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
    const t = message.mentions.members.first();
    if (t) await t.ban();
  }

  if (cmd === "clear") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const amount = parseInt(args[0]);
    if (!amount) return;
    await message.channel.bulkDelete(amount, true);
  }
});

client.login(process.env.TOKEN);