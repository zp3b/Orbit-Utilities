const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");

// 🔥 anti crash
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const prefix = ".";
const COLOR = "#2b2d31";

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
      xp: 0,
      level: 1,
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
// 🎭 ROLE SHOP
// ======================
const roleShop = {
  vip: { price: 5000, roleId: "PUT_ROLE_ID", desc: "✨ vip access" },
  elite: { price: 15000, roleId: "PUT_ROLE_ID", desc: "🔥 elite status" }
};

const embed = (t, d) =>
  new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(t)
    .setDescription(d);

// ======================
// 🔌 COMMAND FILES
// ======================
const mod = require("./commands/moderation/mod.js");
const configCmd = require("./commands/config/config.js");
const util = require("./commands/utility/util.js");
const economy = require("./commands/economy/economy.js");

// ======================
// ⚡ SLASH COMMANDS
// ======================
const slashCommands = [

  // 💰 ECONOMY
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("check your balance"),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("claim daily reward"),

  new SlashCommandBuilder()
    .setName("work")
    .setDescription("work for money"),

  new SlashCommandBuilder()
    .setName("spin")
    .setDescription("spin for rewards"),

  new SlashCommandBuilder()
    .setName("rob")
    .setDescription("rob another user")
    .addUserOption(o =>
      o.setName("target")
       .setDescription("user to rob")
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("deposit money")
    .addIntegerOption(o =>
      o.setName("amount")
       .setDescription("amount to deposit")
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("withdraw money")
    .addIntegerOption(o =>
      o.setName("amount")
       .setDescription("amount to withdraw")
       .setRequired(true)
    ),

  // 🧰 ITEMS
  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("view your inventory"),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("view shop"),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription("buy an item")
    .addStringOption(o =>
      o.setName("item")
       .setDescription("item name")
       .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount")
       .setDescription("amount to buy")
    ),

  new SlashCommandBuilder()
    .setName("use")
    .setDescription("use an item")
    .addStringOption(o =>
      o.setName("item")
       .setDescription("item name")
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("sell an item")
    .addStringOption(o =>
      o.setName("item")
       .setDescription("item name")
       .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount")
       .setDescription("amount to sell")
    ),

  // 📈 PROGRESS
  new SlashCommandBuilder()
    .setName("level")
    .setDescription("check your level"),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("view leaderboard"),

  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("view your profile"),

  new SlashCommandBuilder()
    .setName("streak")
    .setDescription("view your streak"),

  // 🎱 FUN
  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("ask the magic 8ball")
    .addStringOption(o =>
      o.setName("question")
       .setDescription("your question")
       .setRequired(true)
    ),

  // 🛠️ UTILITY
  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("get avatar")
    .addUserOption(o =>
      o.setName("user")
       .setDescription("user to check")
    ),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("get user info"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("get server info"),

  new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("bot info"),

  new SlashCommandBuilder()
    .setName("invite")
    .setDescription("get bot invite"),

  new SlashCommandBuilder()
    .setName("calc")
    .setDescription("calculate something")
    .addStringOption(o =>
      o.setName("expression")
       .setDescription("math expression")
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("poll")
    .setDescription("create a poll")
    .addStringOption(o =>
      o.setName("question")
       .setDescription("poll question")
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("set afk")
    .addStringOption(o =>
      o.setName("reason")
       .setDescription("afk reason")
    ),

  new SlashCommandBuilder()
    .setName("remind")
    .setDescription("set reminder")
    .addIntegerOption(o =>
      o.setName("time")
       .setDescription("time in seconds")
       .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("text")
       .setDescription("reminder text")
       .setRequired(true)
    )
];

client.once("clientReady", async () => {
  console.log("blur online 💜");

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands("1494829583084556288"),
      { body: slashCommands }
    );

    console.log("slash commands loaded 😈");
  } catch (err) {
    console.error(err);
  }
});

// ======================
// 💬 MESSAGE SYSTEM
// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);

  // XP SYSTEM
  const xpGain = Math.floor(Math.random()*15)+5;
  user.xp += xpGain;

  const needed = user.level * 100;

  if (user.xp >= needed) {
    user.xp -= needed;
    user.level++;
    user.orbits += 200;

    message.channel.send({
      embeds: [embed("level up 🎉",
        `${message.author} reached **level ${user.level}**\n+200 💜`
      )]
    });
  }

  save();

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  // 🔥 RUN MODULES (SAFE)
  try {
   mod.run(client, message, [cmd, ...args], embed, data, save);
configCmd.run(client, message, [cmd, ...args], embed, data, save);
util.run(client, message, [cmd, ...args], embed, data, save);
economy.run(client, message, [cmd, ...args], embed, data, save, getUser);
  } catch (e) {
    console.error(e);
  }

  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

  // ======================
  // 💜 HELP
  // ======================
  if (cmd === "help") {
  return message.reply({
    embeds: [embed("Orbit Help 💜", `
💰 **Economy**
balance • daily • work • spin • rob  
bankbalance • deposit • withdraw  

🧰 **Items**
inventory • shop • buy • use • sell  

📈 **Progress**
level • leaderboard • profile • streak  

🎭 **Roles**
roleshop • buyrole  

🛠️ **Utility**
userinfo • serverinfo • avatar • poll  
remind • afk • botinfo • invite • calc  
    `)]
  });
}

if (cmd === "admhelp") {
  return message.reply({
    embeds: [embed("Admin Commands 👮", `
ban • kick • mute • unmute  
warn • warnings • clearwarns  
purge • lock • unlock • slowmode  
role • removerole  

⚙️ config:
setprefix • setwelcomechannel  
setleavechannel • setmodrole  
config
    `)]
  });
}

  // ======================
  // 💰 ECONOMY
  // ======================
  if (cmd === "balance") {
    return message.reply({
      embeds: [embed("balance 💜", `
💰 wallet: **${user.orbits}**  
🏦 bank: **${user.bank}/${user.bankLimit}**  
🏆 prestige: **${user.prestige}**
      `)]
    });
  }

  if (cmd === "daily") {
    if (Date.now() - user.lastDaily < 86400000)
      return message.reply({ embeds:[embed("daily ⏳","already claimed")] });

    const reward = Math.floor(Math.random()*200)+150;
    user.orbits += reward;
    user.lastDaily = Date.now();
    save();

    return message.reply({ embeds:[embed("daily 💜",`+${reward}`)] });
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply({ embeds:[embed("work ⏳","wait 1 min")] });

    const earn = Math.floor(Math.random()*150)+50;
    user.orbits += earn;
    user.lastWork = Date.now();
    save();

    return message.reply({ embeds:[embed("work 💼",`+${earn}`)] });
  }

  if (cmd === "spin") {
    if (Date.now() - user.lastSpin < 300000)
      return message.reply({ embeds:[embed("spin ⏳","5 min cooldown")] });

    const reward = Math.floor(Math.random()*400);
    user.orbits += reward;
    user.lastSpin = Date.now();
    save();

    return message.reply({ embeds:[embed("spin 🎰",`+${reward}`)] });
  }

  if (cmd === "rob") {
    const t = message.mentions.users.first();
    if (!t || t.bot || t.id === message.author.id)
      return message.reply({ embeds:[embed("rob ❌","invalid target")] });

    const target = getUser(t.id);
    if (target.orbits <= 0)
      return message.reply({ embeds:[embed("rob 💀","target broke")] });

    if (Date.now() - user.lastRob < 1800000)
      return message.reply({ embeds:[embed("rob ⏳","30 min cooldown")] });

    const steal = Math.floor(Math.random()*Math.min(200,target.orbits));
    user.orbits += steal;
    target.orbits -= steal;
    user.lastRob = Date.now();
    save();

    return message.reply({ embeds:[embed("rob 💀",`stole ${steal}`)] });
  }

  // ======================
  // 🏦 BANK
  // ======================
  if (cmd === "bankbalance")
    return message.reply({ embeds:[embed("bank 🏦",`${user.bank}/${user.bankLimit}`)] });

  if (cmd === "deposit") {
    const amt = parseInt(args[0]);
    if (!amt || user.orbits < amt)
      return message.reply({ embeds:[embed("deposit ❌","invalid")] });

    if (user.bank + amt > user.bankLimit)
      return message.reply({ embeds:[embed("deposit 🏦","bank full")] });

    user.orbits -= amt;
    user.bank += amt;
    save();

    return message.reply({ embeds:[embed("deposit 🏦",`+${amt}`)] });
  }

  if (cmd === "withdraw") {
    const amt = parseInt(args[0]);
    if (!amt || user.bank < amt)
      return message.reply({ embeds:[embed("withdraw ❌","invalid")] });

    user.bank -= amt;
    user.orbits += amt;
    save();

    return message.reply({ embeds:[embed("withdraw 🏦",`${amt}`)] });
  }

  // ======================
  // 🎭 ROLE SHOP
  // ======================
  if (cmd === "roleshop") {
    let i = 1;
    const e = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("blur • roles 🎭");

    for (let r in roleShop) {
      e.addFields({
        name: `${i}. ${r}`,
        value: `💜 ${roleShop[r].price}\n${roleShop[r].desc}`
      });
      i++;
    }

    e.setFooter({ text: `balance: ${user.orbits}` });

    return message.reply({ embeds:[e] });
  }

  if (cmd === "buyrole") {
    const item = roleShop[args[0]];
    if (!item) return;

    if (user.orbits < item.price)
      return message.reply({ embeds:[embed("role ❌","not enough")] });

    const role = message.guild.roles.cache.get(item.roleId);
    if (!role) return;

    await message.member.roles.add(role);

    user.orbits -= item.price;
    save();

    return message.reply({ embeds:[embed("role 🎭", role.name)] });
  }

  // ======================
  // 📈 LEVEL
  // ======================
  if (cmd === "level") {
    return message.reply({
      embeds:[embed("level 📈", `
level: **${user.level}**  
xp: **${user.xp}/${user.level*100}**
      `)]
    });
  }

  if (cmd === "leaderboard") {
    const sorted = Object.entries(data)
      .sort((a,b)=> (b[1].level||0)-(a[1].level||0))
      .slice(0,10);

    let desc = "";
    let i = 1;

    for (let [id,u] of sorted) {
      desc += `${i}. <@${id}> — lvl ${u.level}\n`;
      i++;
    }

    return message.reply({
      embeds:[embed("leaderboard 🏆", desc || "empty")]
    });
  }

  // ======================
  // 🎱 8BALL
  // ======================
  if (cmd === "8ball") {
    const responses = ["yes","no","maybe","unlikely","definitely"];
    const res = responses[Math.floor(Math.random()*responses.length)];

    return message.reply({
      embeds:[embed("8ball 🎱", `
q: ${args.join(" ") || "none"}  
a: **${res}**
      `)]
    });
  }

});

// ======================
// ⚡ SLASH HANDLER
// ======================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const user = getUser(interaction.user.id);

  try {

    // ======================
    // 💰 ECONOMY
    // ======================
    if (interaction.commandName === "balance") {
      return interaction.reply({
        embeds: [embed("balance 💜", `
💰 wallet: **${user.orbits}**
🏦 bank: **${user.bank}/${user.bankLimit}**
🏆 prestige: **${user.prestige}**
        `)]
      });
    }

    if (interaction.commandName === "daily") {
      if (Date.now() - user.lastDaily < 86400000)
        return interaction.reply({ content: "already claimed", ephemeral: true });

      const reward = Math.floor(Math.random()*200)+150;
      user.orbits += reward;
      user.lastDaily = Date.now();
      save();

      return interaction.reply(`+${reward}`);
    }

    if (interaction.commandName === "work") {
      const earn = Math.floor(Math.random()*150)+50;
      user.orbits += earn;
      save();

      return interaction.reply(`+${earn}`);
    }

    if (interaction.commandName === "spin") {
      const reward = Math.floor(Math.random()*400);
      user.orbits += reward;
      save();

      return interaction.reply(`+${reward}`);
    }

    if (interaction.commandName === "rob") {
      const target = interaction.options.getUser("target");

      if (!target || target.id === interaction.user.id)
        return interaction.reply({ content: "invalid target", ephemeral: true });

      const t = getUser(target.id);

      if (t.orbits <= 0)
        return interaction.reply("target broke");

      const steal = Math.floor(Math.random()*Math.min(200, t.orbits));

      user.orbits += steal;
      t.orbits -= steal;
      save();

      return interaction.reply(`stole ${steal} 💀`);
    }

    // ======================
    // 🏦 BANK
    // ======================
    if (interaction.commandName === "deposit") {
      const amt = interaction.options.getInteger("amount");

      if (user.orbits < amt)
        return interaction.reply({ content: "not enough", ephemeral: true });

      if (user.bank + amt > user.bankLimit)
        return interaction.reply({ content: "bank full", ephemeral: true });

      user.orbits -= amt;
      user.bank += amt;
      save();

      return interaction.reply(`deposited ${amt} 💜`);
    }

    if (interaction.commandName === "withdraw") {
      const amt = interaction.options.getInteger("amount");

      if (user.bank < amt)
        return interaction.reply({ content: "not enough in bank", ephemeral: true });

      user.bank -= amt;
      user.orbits += amt;
      save();

      return interaction.reply(`withdrew ${amt} 💜`);
    }

    // ======================
    // 🧰 INVENTORY
    // ======================
    if (interaction.commandName === "inventory") {
      const inv = Object.entries(user.inventory || {})
        .map(([k,v]) => `${k} x${v}`).join("\n") || "empty";

      return interaction.reply({
        embeds: [embed("inventory 🧰", inv)]
      });
    }

    if (interaction.commandName === "shop") {
      return interaction.reply({
        embeds: [embed("shop 🛒", `
apple — 💜 100
laptop — 💜 2000
potion — 💜 500
        `)]
      });
    }

    if (interaction.commandName === "buy") {
      const item = interaction.options.getString("item");
      const amt = interaction.options.getInteger("amount") || 1;

      const prices = { apple:100, laptop:2000, potion:500 };

      if (!prices[item])
        return interaction.reply({ content: "invalid item", ephemeral: true });

      const cost = prices[item] * amt;

      if (user.orbits < cost)
        return interaction.reply({ content: "not enough", ephemeral: true });

      user.orbits -= cost;
      user.inventory[item] = (user.inventory[item]||0)+amt;
      save();

      return interaction.reply(`bought ${item} x${amt}`);
    }

    if (interaction.commandName === "use") {
      const item = interaction.options.getString("item");

      if (!user.inventory[item])
        return interaction.reply({ content: "you don’t have that", ephemeral: true });

      user.inventory[item]--;

      if (item === "apple") user.orbits += 50;
      if (item === "potion") user.xp += 50;

      save();

      return interaction.reply(`used ${item}`);
    }

    if (interaction.commandName === "sell") {
      const item = interaction.options.getString("item");
      const amt = interaction.options.getInteger("amount") || 1;

      const sell = { apple:50, laptop:1200, potion:250 };

      if (!user.inventory[item])
        return interaction.reply("you don’t have that");

      user.inventory[item] -= amt;
      user.orbits += sell[item] * amt;

      save();

      return interaction.reply(`sold ${item} x${amt}`);
    }

    // ======================
    // 📈 PROGRESS
    // ======================
    if (interaction.commandName === "level") {
      return interaction.reply(`level: ${user.level}`);
    }

    if (interaction.commandName === "leaderboard") {
      return interaction.reply("use .leaderboard for now");
    }

    if (interaction.commandName === "profile") {
      return interaction.reply({
        embeds: [embed("profile 📈", `
level: **${user.level}**
orbits: **${user.orbits}**
bank: **${user.bank}**
streak: **${user.streak}**
        `)]
      });
    }

    if (interaction.commandName === "streak") {
      return interaction.reply(`🔥 ${user.streak}`);
    }

    // ======================
    // 🎱 FUN
    // ======================
    if (interaction.commandName === "8ball") {
      const q = interaction.options.getString("question");
      const responses = ["yes","no","maybe","unlikely","definitely"];
      const res = responses[Math.floor(Math.random()*responses.length)];

      return interaction.reply({
        embeds: [embed("8ball 🎱", `q: ${q}\na: **${res}**`)]
      });
    }

    // ======================
    // 🛠️ UTILITY (BASIC)
    // ======================
    if (interaction.commandName === "avatar") {
      const target = interaction.options.getUser("user") || interaction.user;

      return interaction.reply(target.displayAvatarURL({ size: 1024 }));
    }

    if (interaction.commandName === "userinfo") {
      return interaction.reply(`${interaction.user.tag}`);
    }

    if (interaction.commandName === "serverinfo") {
      return interaction.reply(`${interaction.guild.name}`);
    }

    if (interaction.commandName === "botinfo") {
      return interaction.reply("blur bot 💜");
    }

    if (interaction.commandName === "invite") {
      return interaction.reply("invite link soon");
    }

    if (interaction.commandName === "calc") {
      const exp = interaction.options.getString("expression");

      try {
        const result = eval(exp);
        return interaction.reply(`= ${result}`);
      } catch {
        return interaction.reply("invalid");
      }
    }

    if (interaction.commandName === "afk") {
      return interaction.reply("afk set");
    }

    if (interaction.commandName === "poll") {
      const q = interaction.options.getString("question");

      const msg = await interaction.reply({ content: `📊 ${q}`, fetchReply: true });

      await msg.react("👍");
      await msg.react("👎");
    }

    if (interaction.commandName === "remind") {
      return interaction.reply("reminder set (basic)");
    }

  } catch (err) {
    console.error(err);
    return interaction.reply({ content: "error occurred", ephemeral: true });
  }
});

client.login(process.env.TOKEN);