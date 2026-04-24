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

// ======================
const embed = (t, d) =>
  new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`blur • ${t}`)
    .setDescription(d)
    .setFooter({ text: "blur 💜" });

client.once("ready", () => {
  console.log("blur online 💜");
});

// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);

  // ======================
  // 📈 XP SYSTEM
  // ======================
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
  const cmd = args.shift().toLowerCase();

  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

  // ======================
  // 💜 HELP
  // ======================
  if (cmd === "help") {
    return message.reply({
      embeds: [embed("help 📜", `
💰 balance • daily • work • pay  
🏦 bankbalance • deposit • withdraw  
🎰 spin • rob  
🎭 roleshop • buyrole  
📈 level • leaderboard  
🏆 prestige  
🎱 8ball  
👮 admhelp
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

client.login(process.env.TOKEN);