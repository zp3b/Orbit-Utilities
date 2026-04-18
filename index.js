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
      orbits: 250,
      bank: 0,
      bankLimit: 5000,
      inventory: [],
      warnings: 0,
      lastDaily: 0,
      lastWork: 0,
      lastRob: 0,
      lastSlots: 0
    };
  }

  // safety fixes so old users don’t crash bot
  data[id].lastWork ??= 0;
  data[id].lastSlots ??= 0;
  data[id].lastRob ??= 0;

  return data[id];
}

// ======================
// 🛒 SHOP
// ======================
const shop = {
  shield: { price: 500, desc: "Protects from rob 🛡️" },
  boost: { price: 300, desc: "Luck boost ⚡" },
  ticket: { price: 200, desc: "Cosmetic 🎟️" },
  bankupgrade: { price: 15000, desc: "Upgrade bank to 100k storage 🏦" }
};

// ======================
// 🚀 READY
// ======================
client.once("ready", () => {
  console.log(`💜 Orbit Utilities ONLINE as ${client.user.tag}`);
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
  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

  // ======================
  // 💜 HELP
  // ======================
  if (cmd === "help") {
    return message.reply(`
💜 ORBIT UTILITIES

💰 Economy:
.balance
.daily
.work
.pay @user <amount>

🏦 Bank:
.paybank <amount>
.withdraw <amount>
.bankbalance

🎰 Gambling:
.slots
.coinflip
.roll
.8ball

🛒 Shop:
.shop
.buy <item>
.inventory

💀 Crime:
.rob @user

🏆 Leaderboard:
.top

🧰 Utility:
.ping
.avatar

👮 Admin:
.admhelp
    `);
  }

  // ======================
  // 💰 ECONOMY
  // ======================

  if (cmd === "balance") {
    return message.reply(`💜 Wallet: ${user.orbits}`);
  }

  if (cmd === "daily") {
    if (Date.now() - user.lastDaily < 86400000)
      return message.reply("⏳ Already claimed daily.");

    const reward = Math.floor(Math.random() * 200) + 150;
    user.orbits += reward;
    user.lastDaily = Date.now();
    save();

    return message.reply(`💜 +${reward}`);
  }

  // ======================
  // 💼 WORK (FIXED)
  // ======================

  if (cmd === "work") {
    const now = Date.now();

    if (now - user.lastWork < 60000)
      return message.reply("⏳ Wait 1 minute before working again.");

    const jobs = ["Dev", "Miner", "Trader", "Builder", "Farmer"];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earn = Math.floor(Math.random() * 150) + 50;

    user.orbits += earn;
    user.lastWork = now;
    save();

    return message.reply(`💼 ${job} job complete +${earn} 💜`);
  }

  // ======================
  // 💳 BANK SYSTEM
  // ======================

  if (cmd === "bankbalance") {
    return message.reply(`🏦 Bank: ${user.bank} / ${user.bankLimit}`);
  }

  if (cmd === "paybank") {
    const amount = parseInt(args[0]);

    if (!amount || amount <= 0)
      return message.reply("Usage: .paybank <amount>");

    if (user.orbits < amount)
      return message.reply("Not enough Orbits.");

    if (user.bank + amount > user.bankLimit)
      return message.reply("🏦 Bank limit reached.");

    user.orbits -= amount;
    user.bank += amount;
    save();

    return message.reply(`💳 Deposited ${amount}`);
  }

  if (cmd === "withdraw") {
    const amount = parseInt(args[0]);

    if (!amount || amount <= 0)
      return message.reply("Usage: .withdraw <amount>");

    if (user.bank < amount)
      return message.reply("Not enough bank balance.");

    user.bank -= amount;
    user.orbits += amount;
    save();

    return message.reply(`🏦 Withdrew ${amount}`);
  }

  // ======================
  // 💀 ROB
  // ======================

  if (cmd === "rob") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention someone.");
    if (target.bot) return message.reply("No bots.");
    if (target.id === message.author.id) return message.reply("No self rob.");

    const t = getUser(target.id);

    if (t.orbits <= 0)
      return message.reply("They have nothing.");

    if (Date.now() - user.lastRob < 1800000)
      return message.reply("30 min cooldown.");

    const amount = Math.floor(Math.random() * Math.min(200, t.orbits));

    user.orbits += amount;
    t.orbits -= amount;
    user.lastRob = Date.now();

    save();

    return message.reply(`💀 Robbed ${amount}`);
  }

  // ======================
  // 🎰 SLOTS (FIXED)
  // ======================

  if (cmd === "slots") {
    const now = Date.now();

    if (now - user.lastSlots < 300000)
      return message.reply("⏳ 5 min cooldown.");

    const cost = 100;

    if (user.orbits < cost)
      return message.reply("Not enough Orbits.");

    user.orbits -= cost;
    user.lastSlots = now;

    const icons = ["💜", "💰", "⭐", "💀", "🍀"];

    const r1 = icons[Math.floor(Math.random() * icons.length)];
    const r2 = icons[Math.floor(Math.random() * icons.length)];
    const r3 = icons[Math.floor(Math.random() * icons.length)];

    let win = 0;

    if (r1 === r2 && r2 === r3) win = 1000;
    else if (r1 === r2 || r2 === r3 || r1 === r3) win = 250;

    user.orbits += win;
    save();

    return message.reply(`🎰 ${r1} | ${r2} | ${r3}\n${win ? "Won +" + win : "No win 😭"}`);
  }

  // ======================
  // 🛒 SHOP
  // ======================

  if (cmd === "shop") {
    let msg = "🛒 ORBIT SHOP\n\n";

    for (let i in shop) {
      msg += `${i} — 💜 ${shop[i].price}\n${shop[i].desc}\n\n`;
    }

    return message.reply(msg);
  }

  if (cmd === "buy") {
    const item = args[0];
    if (!shop[item]) return message.reply("Invalid item.");

    if (user.orbits < shop[item].price)
      return message.reply("Not enough Orbits.");

    user.orbits -= shop[item].price;

    if (item === "bankupgrade") {
      user.bankLimit = 100000;
      save();
      return message.reply("🏦 Bank upgraded to 100k!");
    }

    user.inventory.push(item);
    save();

    return message.reply(`🛒 Bought ${item}`);
  }

  if (cmd === "inventory") {
    return message.reply(user.inventory.length ? user.inventory.join(", ") : "Empty");
  }

  // ======================
  // 🏆 LEADERBOARD
  // ======================

  if (cmd === "top") {
    const sorted = Object.entries(data)
      .sort((a, b) => b[1].orbits - a[1].orbits)
      .slice(0, 10);

    let msg = "🏆 LEADERBOARD\n\n";

    sorted.forEach((u, i) => {
      msg += `${i + 1}. <@${u[0]}> — 💜 ${u[1].orbits}\n`;
    });

    return message.reply(msg);
  }

  // ======================
  // 🧰 UTILITY
  // ======================

  if (cmd === "ping") return message.reply("🏓 Pong");

  if (cmd === "avatar") {
    const t = message.mentions.users.first() || message.author;
    return message.reply(t.displayAvatarURL({ size: 1024 }));
  }

  // ======================
  // 👮 ADMIN
  // ======================

  if (cmd === "admhelp") {
    if (!isAdmin) return;

    return message.reply(`
👮 ADMIN

.resetbank @user
.addorbits
.resetorbits
    `);
  }

  if (cmd === "resetorbits") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    if (t) getUser(t.id).orbits = 0, save();
  }

  if (cmd === "addorbits") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    const amt = parseInt(args[1]);
    if (t && amt) getUser(t.id).orbits += amt, save();
  }

  if (cmd === "resetbank") {
    if (!isAdmin) return;
    const t = message.mentions.users.first() || message.author;
    const u = getUser(t.id);

    u.bank = 0;
    u.bankLimit = 5000;

    save();

    return message.reply("🏦 Bank reset");
  }
});

client.login(process.env.TOKEN);