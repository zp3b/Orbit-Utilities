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
// 💾 DATABASE SYSTEM
// ======================
let economy = {};
let adminData = { admins: [] };
let automod = { badWords: [], allowLinksForAdminsOnly: true };

if (fs.existsSync("./economy.json")) {
  try { economy = JSON.parse(fs.readFileSync("./economy.json")); } catch {}
}

if (fs.existsSync("./admin.json")) {
  try { adminData = JSON.parse(fs.readFileSync("./admin.json")); } catch {}
}

if (fs.existsSync("./automod.json")) {
  try { automod = JSON.parse(fs.readFileSync("./automod.json")); } catch {}
}

function saveEconomy() {
  fs.writeFileSync("./economy.json", JSON.stringify(economy, null, 2));
}

function saveAdmins() {
  fs.writeFileSync("./admin.json", JSON.stringify(adminData, null, 2));
}

function saveAutomod() {
  fs.writeFileSync("./automod.json", JSON.stringify(automod, null, 2));
}

function getUser(id) {
  if (!economy[id]) {
    economy[id] = {
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
  return economy[id];
}

function isAdminUser(id) {
  return adminData.admins.includes(id);
}

function containsBadWord(msg) {
  const lower = msg.toLowerCase();
  return automod.badWords.some(w => lower.includes(w));
}

function containsLink(msg) {
  return /(https?:\/\/|www\.|discord\.gg)/i.test(msg);
}

// ======================
// 🎭 ROLE SHOP
// ======================
const roleShop = {
  vip: { price: 5000, roleId: "1495360156941422753", desc: "VIP access" },
  elite: { price: 15000, roleId: "1495360406921805976", desc: "Elite status" }
};

client.once("ready", () => {
  console.log("💜 Orbit FULL ONLINE");
});

// ======================
// 📦 COMMANDS + AUTOMOD
// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);

  const isAdmin = isAdminUser(message.author.id) || 
    message.member.permissions.has(PermissionsBitField.Flags.Administrator);

  const e = (t, d, c="Purple") => new EmbedBuilder().setColor(c).setTitle(t).setDescription(d);

  // ======================
  // 🚫 AUTOMOD
  // ======================
  if (!isAdmin) {
    if (containsBadWord(message.content)) {
      message.delete().catch(() => {});
      user.warnings++;
      saveEconomy();

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("🚫 Message Removed")
            .setDescription(`${message.author}, watch your language.\nWarnings: ${user.warnings}`)
        ]
      });
    }

    if (automod.allowLinksForAdminsOnly && containsLink(message.content)) {
      message.delete().catch(() => {});
      user.warnings++;
      saveEconomy();

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("🔗 Links Not Allowed")
            .setDescription(`${message.author}, you cannot send links.\nWarnings: ${user.warnings}`)
        ]
      });
    }
  }

  // ======================
  // PREFIX CHECK (AFTER AUTOMOD)
  // ======================
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // ======================
  // 💜 HELP
  // ======================
  if (cmd === "help") {
    return message.reply({
      embeds: [e("💜 Orbit Help", `
💰 balance, daily, work  
🏦 bankbalance, paybank, withdraw  
🎰 spin  
💀 rob  
🎭 roleshop, buyrole  
🏆 prestige, leaderboard  
🎱 8ball  
🧰 ping, avatar, serverinfo, uptime  
🛠 kick, ban, clear, timeout  
👮 admhelp
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
        .setTitle(message.author.username)
        .addFields(
          { name: "💜 Wallet", value: `${user.orbits}`, inline: true },
          { name: "🏦 Bank", value: `${user.bank}/${user.bankLimit}`, inline: true },
          { name: "🏆 Prestige", value: `${user.prestige}`, inline: true }
        )]
    });
  }

  if (cmd === "daily") {
    if (Date.now() - user.lastDaily < 86400000)
      return message.reply({ embeds:[e("⏳ Daily","Already claimed","Red")] });

    const reward = Math.floor(Math.random()*200)+150;
    user.orbits += reward;
    user.lastDaily = Date.now();
    saveEconomy();

    return message.reply({ embeds:[e("💜 Daily",`+${reward} Orbits`)] });
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply({ embeds:[e("⏳ Work","Wait 1 min","Red")] });

    const earn = Math.floor(Math.random()*150)+50;
    user.orbits += earn;
    user.lastWork = Date.now();
    saveEconomy();

    return message.reply({ embeds:[e("💼 Work",`+${earn} Orbits`)] });
  }

  if (cmd === "spin") {
    if (Date.now() - user.lastSpin < 300000)
      return message.reply({ embeds:[e("⏳ Spin","5 min cooldown","Red")] });

    const reward = Math.floor(Math.random()*400);
    user.orbits += reward;
    user.lastSpin = Date.now();
    saveEconomy();

    return message.reply({ embeds:[e("🎰 Spin",`+${reward} Orbits`)] });
  }

  // ======================
  // 💀 ROB
  // ======================
  if (cmd === "rob") {
    const t = message.mentions.users.first();
    if (!t || t.bot || t.id === message.author.id)
      return message.reply({ embeds:[e("❌ Rob","Invalid target","Red")] });

    const target = getUser(t.id);
    if (target.orbits <= 0)
      return message.reply({ embeds:[e("💀 Rob","Target broke","Red")] });

    if (Date.now() - user.lastRob < 1800000)
      return message.reply({ embeds:[e("⏳ Rob","30 min cooldown","Red")] });

    const steal = Math.floor(Math.random()*Math.min(200,target.orbits));
    user.orbits += steal;
    target.orbits -= steal;
    user.lastRob = Date.now();
    saveEconomy();

    return message.reply({ embeds:[e("💀 Rob",`Stole ${steal}`)] });
  }

  // ======================
  // 🏦 BANK
  // ======================
  if (cmd === "bankbalance")
    return message.reply({ embeds:[e("🏦 Bank",`${user.bank}/${user.bankLimit}`)] });

  if (cmd === "paybank") {
    const amt = parseInt(args[0]);
    if (!amt || user.orbits < amt)
      return message.reply({ embeds:[e("❌ Bank","Invalid","Red")] });

    if (user.bank + amt > user.bankLimit)
      return message.reply({ embeds:[e("🏦 Bank","Full","Red")] });

    user.orbits -= amt;
    user.bank += amt;
    saveEconomy();

    return message.reply({ embeds:[e("🏦 Deposit",`+${amt}`)] });
  }

  if (cmd === "withdraw") {
    const amt = parseInt(args[0]);
    if (!amt || user.bank < amt)
      return message.reply({ embeds:[e("❌ Withdraw","Invalid","Red")] });

    user.bank -= amt;
    user.orbits += amt;
    saveEconomy();

    return message.reply({ embeds:[e("🏦 Withdraw",`${amt}`)] });
  }

  // ======================
  // 🏆 LEADERBOARD
  // ======================
  if (cmd === "leaderboard") {
    const sorted = Object.entries(economy)
      .sort((a, b) => (b[1].orbits + b[1].bank) - (a[1].orbits + a[1].bank))
      .slice(0, 10);

    let desc = "";

    for (let i = 0; i < sorted.length; i++) {
      const [id, u] = sorted[i];
      const member = await message.guild.members.fetch(id).catch(() => null);

      const name = member ? member.user.username : "Unknown";
      const total = (u.orbits || 0) + (u.bank || 0);

      desc += `**${i + 1}. ${name}** — ${total} 💜\n`;
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Purple")
          .setTitle("🏆 Orbit Leaderboard")
          .setDescription(desc || "No data yet.")
      ]
    });
  }

  // ======================
  // 🎭 ROLE SHOP
  // ======================
  if (cmd === "roleshop") {
    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle("💜 Orbit Role Shop")
      .setDescription("Exchange Orbits for exclusive roles!\n");

    let i = 1;
    for (let r in roleShop) {
      const item = roleShop[r];
      embed.addFields({
        name: `${i}: ${r.toUpperCase()}`,
        value: `Price: **${item.price} 💜**\n${item.desc}`
      });
      i++;
    }

    embed.setFooter({
      text: `Balance: ${user.orbits} 💜`
    });

    return message.reply({ embeds:[embed] });
  }

  if (cmd === "buyrole") {
    const item = roleShop[args[0]];
    if (!item) return;

    if (user.orbits < item.price)
      return message.reply({ embeds:[e("❌ Role","Not enough","Red")] });

    const role = message.guild.roles.cache.get(item.roleId);
    if (!role)
      return message.reply({ embeds:[e("❌ Role","Missing role","Red")] });

    await message.member.roles.add(role);

    user.orbits -= item.price;
    saveEconomy();

    return message.reply({ embeds:[e("🎭 Role Purchased", role.name)] });
  }

  // ======================
  // 🏆 PRESTIGE
  // ======================
  if (cmd === "prestige") {
    if (user.orbits < 50000)
      return message.reply({ embeds:[e("🏆 Prestige","Need 50k","Red")] });

    user.orbits = 250;
    user.bank = 0;
    user.prestige++;
    saveEconomy();

    return message.reply({ embeds:[e("🏆 Prestige",`Level ${user.prestige}`)] });
  }

  // ======================
  // 🎱 8BALL
  // ======================
  if (cmd === "8ball") {
    const responses = ["Yes","No","Maybe","Definitely","Ask later","Probably"];
    const res = responses[Math.floor(Math.random()*responses.length)];

    return message.reply({
      embeds:[new EmbedBuilder()
        .setColor("Purple")
        .setTitle("🎱 8Ball")
        .addFields(
          { name:"Question", value: args.join(" ") || "None" },
          { name:"Answer", value: res }
        )]
    });
  }

  // ======================
  // 🧰 UTILITY
  // ======================
  if (cmd === "ping") return message.reply({ embeds:[e("🏓 Ping","Pong")] });

  if (cmd === "avatar") {
    const t = message.mentions.users.first() || message.author;
    return message.reply({
      embeds:[new EmbedBuilder().setColor("Purple").setImage(t.displayAvatarURL({size:1024}))]
    });
  }

  if (cmd === "serverinfo")
    return message.reply({ embeds:[e("🌐 Server", message.guild.name)] });

  if (cmd === "uptime")
    return message.reply({ embeds:[e("⏱ Uptime",`${Math.floor(client.uptime/1000)}s`)] });

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

  // ======================
  // 👮 ADMIN
  // ======================
  if (cmd === "admhelp") {
    if (!isAdmin) return;
    return message.reply({ embeds:[e("👮 Admin",`
.addorbits
.resetorbits
.resetbank
.addadmin
.removeadmin
.addbadword
.removebadword
    `)] });
  }

  if (cmd === "addorbits") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    const amt = parseInt(args[1]);
    if (t && amt) {
      getUser(t.id).orbits += amt;
      saveEconomy();
    }
  }

  if (cmd === "resetorbits") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    if (t) {
      getUser(t.id).orbits = 0;
      saveEconomy();
    }
  }

  if (cmd === "resetbank") {
    if (!isAdmin) return;
    const t = message.mentions.users.first();
    if (t) {
      const u = getUser(t.id);
      u.bank = 0;
      u.bankLimit = 5000;
      saveEconomy();
    }
  }

  if (cmd === "addadmin") {
    if (!isAdmin) return;
    const id = args[0];
    if (!id) return;

    if (!adminData.admins.includes(id)) {
      adminData.admins.push(id);
      saveAdmins();
    }

    message.reply("✅ Admin added");
  }

  if (cmd === "removeadmin") {
    if (!isAdmin) return;
    const id = args[0];
    adminData.admins = adminData.admins.filter(a => a !== id);
    saveAdmins();

    message.reply("❌ Admin removed");
  }

  if (cmd === "addbadword") {
    if (!isAdmin) return;
    const word = args[0];
    if (!word) return;

    automod.badWords.push(word.toLowerCase());
    saveAutomod();

    message.reply("✅ Word added");
  }

  if (cmd === "removebadword") {
    if (!isAdmin) return;
    const word = args[0];
    automod.badWords = automod.badWords.filter(w => w !== word);
    saveAutomod();

    message.reply("❌ Word removed");
  }

});

client.login(process.env.TOKEN);