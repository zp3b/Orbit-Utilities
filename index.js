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
  shield: { price: 500, desc: "Protects from rob 🛡️" },
  boost: { price: 300, desc: "Luck boost ⚡" },
  ticket: { price: 200, desc: "Cosmetic 🎟️" }
};

// ======================
// 🚀 READY
// ======================
client.once("ready", () => {
  console.log(`💜 Orbit Utilities ONLINE as ${client.user.tag}`);
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
  // 💜 HELP COMMAND
  // ======================
  if (cmd === "help") {
    return message.reply(`
💜 **ORBIT UTILITIES**

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

🏆 Ranking:
.top

🧰 Utility:
.ping
.avatar

👮 Admin:
.admhelp
    `);
  }

  // ======================
  // 💜 ECONOMY
  // ======================

  if (cmd === "balance") {
    return message.reply(`💜 Wallet: ${user.orbits} Orbits`);
  }

  if (cmd === "bankbalance") {
    return message.reply(`🏦 Bank: ${user.bank} Orbits`);
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

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply("⏳ Wait.");

    const jobs = ["Dev", "Miner", "Trader", "Builder"];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earn = Math.floor(Math.random() * 150) + 50;

    user.orbits += earn;
    user.lastWork = Date.now();
    save();

    return message.reply(`💼 ${job} +${earn}`);
  }

  if (cmd === "pay") {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || !amount || amount <= 0)
      return message.reply("Usage: .pay @user <amount>");

    const t = getUser(target.id);

    if (user.orbits < amount)
      return message.reply("Not enough Orbits.");

    user.orbits -= amount;
    t.orbits += amount;
    save();

    return message.reply(`💸 Sent ${amount} to ${target.username}`);
  }

  // ======================
  // 🏦 BANK SYSTEM
  // ======================

  if (cmd === "paybank") {
    const amount = parseInt(args[0]);

    if (!amount || amount <= 0)
      return message.reply("Usage: .paybank <amount>");

    if (user.orbits < amount)
      return message.reply("Not enough Orbits.");

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
  // 💀 ROB SYSTEM
  // ======================

  if (cmd === "rob") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention someone.");

    if (target.bot)
      return message.reply("🚫 Can't rob bots.");

    if (target.id === message.author.id)
      return message.reply("🚫 Can't rob yourself.");

    const t = getUser(target.id);

    if (t.orbits <= 0)
      return message.reply("🚫 They have no Orbits.");

    if (Date.now() - user.lastRob < 1800000)
      return message.reply("⏳ 30 min cooldown.");

    if (t.inventory.includes("shield"))
      return message.reply("🛡️ Protected!");

    const amount = Math.floor(Math.random() * Math.min(200, t.orbits));

    user.orbits += amount;
    t.orbits -= amount;
    user.lastRob = Date.now();

    save();

    return message.reply(`💀 Robbed ${amount}`);
  }

  // ======================
  // 🎰 SLOTS
  // ======================

  if (cmd === "slots") {
    const now = Date.now();

    if (now - user.lastSlots < 300000)
      return message.reply("⏳ Wait 5 min.");

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
    user.inventory.push(item);
    save();

    return message.reply(`🛒 Bought ${item}`);
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
      .sort((a, b) => b[1].orbits - a[1].orbits)
      .slice(0, 10);

    let msg = "🏆 ORBIT LEADERBOARD\n\n";

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

  if (cmd === "resetdata") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    if (t) delete data[t.id], save();
  }

  if (cmd === "admhelp") {
    if (!isAdmin) return;

    return message.reply(`
👮 ADMIN COMMANDS

.addorbits
.resetorbits
.resetdata
.kick
.ban
.clear
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
    const amt = parseInt(args[0]);
    if (amt) await message.channel.bulkDelete(amt);
  }

  // ======================
  // 🎉 FUN
  // ======================

  if (cmd === "coinflip")
    return message.reply(Math.random() < 0.5 ? "Heads" : "Tails");

  if (cmd === "roll")
    return message.reply(`${Math.floor(Math.random() * 100) + 1}`);

  if (cmd === "8ball") {
    const replies = ["Yes", "No", "Maybe", "Definitely", "Ask again"];
    return message.reply(replies[Math.floor(Math.random() * replies.length)]);
  }
});

client.login(process.env.TOKEN);