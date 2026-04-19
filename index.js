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
  return data[id];
}

// ======================
// 🎭 ROLE SHOP (EDIT IDS)
// ======================
const roleShop = {
  vip: { price: 5000, roleId: "PUT_ROLE_ID", desc: "VIP access" },
  elite: { price: 15000, roleId: "PUT_ROLE_ID", desc: "Elite status" }
};

// ======================
client.once("ready", () => {
  console.log("💜 Orbit CLEAN ONLINE");
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

  const e = (t, d, c="Purple") => new EmbedBuilder().setColor(c).setTitle(t).setDescription(d);

  // ======================
  // 💜 HELP
  // ======================
  if (cmd === "help") {
    return message.reply({
      embeds: [e("💜 Orbit Help", `
💰 balance, daily, work, pay  
🏦 bankbalance, paybank, withdraw  
🎰 spin  
💀 rob  
🛒 shop, inventory  
🎭 roleshop, buyrole  
🏆 prestige  
🏆 leaderboard  
🎱 8ball  
🧰 ping, avatar, userinfo, serverinfo, uptime  
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
    save();

    return message.reply({ embeds:[e("💜 Daily",`+${reward} Orbits`)] });
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply({ embeds:[e("⏳ Work","Wait 1 min","Red")] });

    const earn = Math.floor(Math.random()*150)+50;
    user.orbits += earn;
    user.lastWork = Date.now();
    save();

    return message.reply({ embeds:[e("💼 Work",`+${earn} Orbits`)] });
  }

  if (cmd === "spin") {
    if (Date.now() - user.lastSpin < 300000)
      return message.reply({ embeds:[e("⏳ Spin","5 min cooldown","Red")] });

    const reward = Math.floor(Math.random()*400);
    user.orbits += reward;
    user.lastSpin = Date.now();
    save();

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
    save();

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
    save();

    return message.reply({ embeds:[e("🏦 Deposit",`+${amt}`)] });
  }

  if (cmd === "withdraw") {
    const amt = parseInt(args[0]);
    if (!amt || user.bank < amt)
      return message.reply({ embeds:[e("❌ Withdraw","Invalid","Red")] });

    user.bank -= amt;
    user.orbits += amt;
    save();

    return message.reply({ embeds:[e("🏦 Withdraw",`${amt}`)] });
  }

  // ======================
  // 🏆 LEADERBOARD (ADDED)
  // ======================
  if (cmd === "leaderboard") {
    const sorted = Object.entries(data)
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
    save();

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
    save();

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
  // 🧰 UTILITY + MODERATION (UNCHANGED BELOW)
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

  if (cmd === "admhelp") {
    if (!isAdmin) return;
    return message.reply({ embeds:[e("👮 Admin",`
.addorbits
.resetorbits
.resetbank
.say
.slowmode
    `)] });
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