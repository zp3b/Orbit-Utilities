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
// 🛒 SHOP
// ======================
const shop = {
  shield: { price: 500, desc: "🛡️ Protect from rob" },
  boost: { price: 300, desc: "⚡ More work earnings" },
  bankupgrade: { price: 15000, desc: "🏦 Upgrade bank to 100k" }
};

// ======================
// 🎭 ROLE SHOP
// ======================
if (cmd === "roleshop") {
  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setTitle("💜 Orbit Role Shop")
    .setDescription("Exchange Orbits for exclusive server roles!\n");

  let i = 1;

  for (let r in roleShop) {
    embed.addFields({
      name: `${i}: ${r.toUpperCase()}`,
      value: `Price: **${roleShop[r].price} 💜**\n${roleShop[r].desc || "Exclusive role"}`
    });
    i++;
  }

  embed.setFooter({
    text: `Purchases are non-refundable | Your balance: ${user.orbits} 💜`
  });

  return message.reply({ embeds: [embed] });
}
// ======================
client.once("ready", () => {
  console.log("💜 Orbit V8+ EMBED ONLINE");
});

// ======================
// 👋 JOIN / LEAVE
// ======================
client.on("guildMemberAdd", member => {
  const ch = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
  if (!ch) return;

  ch.send({
    embeds: [new EmbedBuilder()
      .setColor("Purple")
      .setTitle("👋 Welcome")
      .setDescription(`${member} joined the server`)
      .setThumbnail(member.user.displayAvatarURL())
    ]
  });
});

client.on("guildMemberRemove", member => {
  const ch = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
  if (!ch) return;

  ch.send({
    embeds: [new EmbedBuilder()
      .setColor("Red")
      .setTitle("👋 Goodbye")
      .setDescription(`${member.user.tag} left`)
    ]
  });
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

  const embed = (title, desc, color="Purple") =>
    new EmbedBuilder().setColor(color).setTitle(title).setDescription(desc);

  // ======================
  // 💜 HELP
  // ======================
  if (cmd === "help") {
    return message.reply({
      embeds: [embed("💜 Orbit Help", `
💰 Economy → balance, daily, work, pay  
🏦 Bank → paybank, withdraw, bankbalance  
🎰 Spin → spin  
🛒 Shop → shop, buy, inventory, roleshop  
💀 Crime → rob  
🏆 Prestige → prestige  
🧰 Utility → ping, avatar, userinfo, serverinfo, uptime, math  
🛠 Mod → kick, ban, timeout, clear, warn, warnings  
👮 Admin → admhelp
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
      return message.reply({ embeds:[embed("⏳ Daily","Already claimed","Red")] });

    const reward = Math.floor(Math.random() * 200) + 150;
    user.orbits += reward;
    user.lastDaily = Date.now();
    save();

    return message.reply({ embeds:[embed("💜 Daily Reward",`+${reward} Orbits`)] });
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply({ embeds:[embed("⏳ Work","Wait 1 minute","Red")] });

    let earn = Math.floor(Math.random() * 150) + 50;
    if (user.inventory.includes("boost")) earn *= 1.5;

    user.orbits += Math.floor(earn);
    user.lastWork = Date.now();
    save();

    return message.reply({ embeds:[embed("💼 Work",`+${Math.floor(earn)} Orbits`)] });
  }

  if (cmd === "spin") {
    if (Date.now() - user.lastSpin < 300000)
      return message.reply({ embeds:[embed("⏳ Spin","5 min cooldown","Red")] });

    const reward = Math.floor(Math.random() * 400);
    user.orbits += reward;
    user.lastSpin = Date.now();
    save();

    return message.reply({ embeds:[embed("🎰 Spin",`You won +${reward} Orbits`)] });
  }

  if (cmd === "rob") {
    const t = message.mentions.users.first();
    if (!t || t.bot || t.id === message.author.id)
      return message.reply({ embeds:[embed("❌ Rob","Invalid target","Red")] });

    const target = getUser(t.id);
    if (target.orbits <= 0)
      return message.reply({ embeds:[embed("💀 Rob","Target broke","Red")] });

    if (Date.now() - user.lastRob < 1800000)
      return message.reply({ embeds:[embed("⏳ Rob","30 min cooldown","Red")] });

    const steal = Math.floor(Math.random() * Math.min(200, target.orbits));

    user.orbits += steal;
    target.orbits -= steal;
    user.lastRob = Date.now();
    save();

    return message.reply({ embeds:[embed("💀 Rob Success",`Stole ${steal} Orbits`)] });
  }

  // ======================
  // 🏦 BANK
  // ======================
  if (cmd === "bankbalance")
    return message.reply({ embeds:[embed("🏦 Bank",`${user.bank}/${user.bankLimit}`)] });

  if (cmd === "paybank") {
    const amt = parseInt(args[0]);
    if (!amt || user.orbits < amt)
      return message.reply({ embeds:[embed("❌ Bank","Invalid amount","Red")] });

    if (user.bank + amt > user.bankLimit)
      return message.reply({ embeds:[embed("🏦 Bank","Bank full","Red")] });

    user.orbits -= amt;
    user.bank += amt;
    save();

    return message.reply({ embeds:[embed("🏦 Deposit",`+${amt}`)] });
  }

  if (cmd === "withdraw") {
    const amt = parseInt(args[0]);
    if (!amt || user.bank < amt)
      return message.reply({ embeds:[embed("❌ Withdraw","Invalid","Red")] });

    user.bank -= amt;
    user.orbits += amt;
    save();

    return message.reply({ embeds:[embed("🏦 Withdraw",`${amt}`)] });
  }

  // ======================
  // 🛒 SHOP
  // ======================
  if (cmd === "shop") {
    let desc = "";
    for (let i in shop) {
      desc += `**${i}** — ${shop[i].price}\n${shop[i].desc}\n\n`;
    }

    return message.reply({ embeds:[embed("🛒 Shop", desc)] });
  }

  if (cmd === "inventory")
    return message.reply({ embeds:[embed("🎒 Inventory", user.inventory.join(", ") || "Empty")] });

  // ======================
  // 🎭 ROLE SHOP (UPGRADED)
  // ======================
  if (cmd === "roleshop") {
    const embedRS = new EmbedBuilder()
      .setColor("Purple")
      .setTitle("🎭 Orbit Role Shop")
      .setDescription("Unlock exclusive roles using Orbits 💜");

    for (let r in roleShop) {
      embedRS.addFields({
        name: `✨ ${r.toUpperCase()}`,
        value: `💜 ${roleShop[r].price}\n${roleShop[r].desc}`
      });
    }

    return message.reply({ embeds:[embedRS] });
  }

  if (cmd === "buyrole") {
    const item = roleShop[args[0]];
    if (!item)
      return message.reply({ embeds:[embed("❌ Role","Invalid role","Red")] });

    if (user.orbits < item.price)
      return message.reply({ embeds:[embed("❌ Role","Not enough","Red")] });

    const role = message.guild.roles.cache.get(item.roleId);
    if (!role)
      return message.reply({ embeds:[embed("❌ Role","Role missing","Red")] });

    await message.member.roles.add(role);

    user.orbits -= item.price;
    save();

    return message.reply({ embeds:[embed("🎭 Role Purchased", role.name)] });
  }

  // ======================
  // 🏆 PRESTIGE
  // ======================
  if (cmd === "prestige") {
    if (user.orbits < 50000)
      return message.reply({ embeds:[embed("🏆 Prestige","Need 50k","Red")] });

    user.orbits = 250;
    user.bank = 0;
    user.prestige++;
    save();

    return message.reply({ embeds:[embed("🏆 Prestige",`Level ${user.prestige}`)] });
  }

  // ======================
  // 🧰 UTILITY
  // ======================
  if (cmd === "ping")
    return message.reply({ embeds:[embed("🏓 Ping","Pong")] });

  if (cmd === "avatar") {
    const t = message.mentions.users.first() || message.author;
    return message.reply({
      embeds:[new EmbedBuilder()
        .setColor("Purple")
        .setTitle(`${t.username}'s Avatar`)
        .setImage(t.displayAvatarURL({ size: 1024 }))
      ]
    });
  }

  if (cmd === "userinfo") {
    const t = message.mentions.users.first() || message.author;
    return message.reply({
      embeds:[embed("👤 User Info",`${t.username}\nID: ${t.id}`)]
    });
  }

  if (cmd === "serverinfo") {
    return message.reply({
      embeds:[embed("🌐 Server",`${message.guild.name}\nMembers: ${message.guild.memberCount}`)]
    });
  }

  if (cmd === "uptime")
    return message.reply({ embeds:[embed("⏱ Uptime",`${Math.floor(client.uptime/1000)}s`)] });

  if (cmd === "math") {
    try {
      return message.reply({ embeds:[embed("🧮 Math", eval(args.join(" ")).toString())] });
    } catch {
      return message.reply({ embeds:[embed("❌ Math","Error","Red")] });
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

    return message.reply({ embeds:[embed("⚠️ Warn", t.username)] });
  }

  if (cmd === "warnings") {
    const t = message.mentions.users.first() || message.author;
    return message.reply({
      embeds:[embed("⚠️ Warnings", `${getUser(t.id).warnings}`)]
    });
  }

  // ======================
  // 👮 ADMIN
  // ======================
  if (cmd === "admhelp") {
    if (!isAdmin) return;
    return message.reply({
      embeds:[embed("👮 Admin",`
.addorbits
.resetorbits
.resetbank
.say
.slowmode
      `)]
    });
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