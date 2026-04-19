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
  shield: { price: 500, desc: "Protects from rob 🛡️" },
  boost: { price: 300, desc: "Extra work rewards ⚡" },
  bankupgrade: { price: 15000, desc: "Upgrade bank to 100k 🏦" }
};

// ======================
client.once("ready", () => {
  console.log(`💜 Orbit v6 ONLINE as ${client.user.tag}`);
});

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
💜 ORBIT UTILITIES V6

💰 Economy:
.balance .daily .work .pay

🏦 Bank:
.paybank .withdraw .bankbalance

🎰 Safe Gambling:
.spin

🛒 Shop:
.shop .buy .inventory

💀 Crime:
.rob

🏆:
.top

🧰 Utility:
.ping .avatar .userinfo .serverinfo .uptime

👮 Admin:
.admhelp
    `);
  }

  // ======================
  // 💰 ECONOMY
  // ======================
  if (cmd === "balance") return message.reply(`💜 ${user.orbits}`);

  if (cmd === "daily") {
    if (Date.now() - user.lastDaily < 86400000)
      return message.reply("⏳ Already claimed.");

    const reward = Math.floor(Math.random() * 200) + 150;
    user.orbits += reward;
    user.lastDaily = Date.now();
    save();

    return message.reply(`💜 +${reward}`);
  }

  // ======================
  // 💼 WORK (BOOST SUPPORT)
  // ======================
  if (cmd === "work") {
    const now = Date.now();

    if (now - user.lastWork < 60000)
      return message.reply("⏳ Wait 1 min.");

    let earn = Math.floor(Math.random() * 150) + 50;

    if (user.inventory.includes("boost"))
      earn *= 1.5;

    user.orbits += Math.floor(earn);
    user.lastWork = now;

    save();

    return message.reply(`💼 Earned ${Math.floor(earn)} 💜`);
  }

  // ======================
  // 🎰 SAFE GAMBLING (NO LOSS)
  // ======================
  if (cmd === "spin") {
    const now = Date.now();

    if (now - user.lastSpin < 300000)
      return message.reply("⏳ 5 min cooldown.");

    user.lastSpin = now;

    const reward = Math.floor(Math.random() * 400); // always gain

    user.orbits += reward;
    save();

    return message.reply(`🎰 You spun and gained +${reward} 💜`);
  }

  // ======================
  // 🏦 BANK
  // ======================
  if (cmd === "bankbalance")
    return message.reply(`🏦 ${user.bank}/${user.bankLimit}`);

  if (cmd === "paybank") {
    const amount = parseInt(args[0]);

    if (!amount || amount <= 0) return message.reply("Invalid.");

    if (user.bank + amount > user.bankLimit)
      return message.reply("🏦 Bank full.");

    if (user.orbits < amount)
      return message.reply("Not enough.");

    user.orbits -= amount;
    user.bank += amount;
    save();

    return message.reply(`💳 Deposited ${amount}`);
  }

  if (cmd === "withdraw") {
    const amount = parseInt(args[0]);

    if (!amount || amount <= 0) return message.reply("Invalid.");
    if (user.bank < amount) return message.reply("Not enough.");

    user.bank -= amount;
    user.orbits += amount;
    save();

    return message.reply(`🏦 Withdrew ${amount}`);
  }

  // ======================
  // 🛒 SHOP
  // ======================
  if (cmd === "shop") {
    let msg = "🛒 SHOP\n\n";
    for (let i in shop) {
      msg += `${i} — ${shop[i].price}\n`;
    }
    return message.reply(msg);
  }

  if (cmd === "buy") {
    const item = args[0];
    if (!shop[item]) return;

    if (user.orbits < shop[item].price)
      return message.reply("Not enough.");

    user.orbits -= shop[item].price;

    if (item === "bankupgrade") {
      user.bankLimit = 100000;
      save();
      return message.reply("🏦 Upgraded bank!");
    }

    user.inventory.push(item);
    save();

    return message.reply(`Bought ${item}`);
  }

  if (cmd === "inventory")
    return message.reply(user.inventory.join(", ") || "Empty");

  // ======================
  // 💀 ROB
  // ======================
  if (cmd === "rob") {
    const target = message.mentions.users.first();
    if (!target || target.bot || target.id === message.author.id)
      return message.reply("Invalid target.");

    const t = getUser(target.id);

    if (t.orbits <= 0) return message.reply("Nothing to steal.");

    if (Date.now() - user.lastRob < 1800000)
      return message.reply("Cooldown 30 min.");

    const steal = Math.floor(Math.random() * Math.min(200, t.orbits));

    user.orbits += steal;
    t.orbits -= steal;
    user.lastRob = Date.now();

    save();

    return message.reply(`💀 Stole ${steal}`);
  }

  // ======================
  // 🏆 TOP
  // ======================
  if (cmd === "top") {
    const sorted = Object.entries(data)
      .sort((a, b) => b[1].orbits - a[1].orbits)
      .slice(0, 10);

    let msg = "🏆 TOP\n\n";

    sorted.forEach((u, i) => {
      msg += `${i + 1}. <@${u[0]}> — ${u[1].orbits}\n`;
    });

    return message.reply(msg);
  }

  // ======================
  // 🧰 UTILITY (NEW + USEFUL)
  // ======================
  if (cmd === "ping") return message.reply("Pong");

  if (cmd === "avatar") {
    const t = message.mentions.users.first() || message.author;
    return message.reply(t.displayAvatarURL());
  }

  if (cmd === "userinfo") {
    const t = message.mentions.users.first() || message.author;
    return message.reply(`${t.username} | ID: ${t.id}`);
  }

  if (cmd === "serverinfo") {
    return message.reply(`Server: ${message.guild.name}\nMembers: ${message.guild.memberCount}`);
  }

  if (cmd === "uptime") {
    return message.reply(`${Math.floor(client.uptime / 1000)}s`);
  }

  // ======================
  // 👮 ADMIN
  // ======================
  if (cmd === "admhelp") {
    if (!isAdmin) return;

    return message.reply(`
👮 ADMIN

.addorbits
.resetorbits
.resetbank
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
});

client.login(process.env.TOKEN);