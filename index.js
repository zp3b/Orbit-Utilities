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
const THEME_COLOR = "#2b2d31";

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
      orbits: 0,
      bank: 0,
      bankLimit: 7500,
      inventory: [],
      warnings: 0,
      prestige: 0,
      xp: 0,
      level: 1,
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
  vip: { price: 5000, roleId: "PUT_ROLE_ID", desc: "vip access" },
  elite: { price: 15000, roleId: "PUT_ROLE_ID", desc: "elite status" }
};

// ======================
function blurEmbed(title, desc) {
  return new EmbedBuilder()
    .setColor(THEME_COLOR)
    .setTitle(`blur • ${title}`)
    .setDescription(desc)
    .setFooter({ text: "blur" });
}

client.once("ready", () => {
  console.log("blur online");
});

// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);

  // ======================
  // 💜 XP SYSTEM
  // ======================
  const xpGain = Math.floor(Math.random()*15)+5;
  user.xp += xpGain;

  const needed = user.level * 100;

  if (user.xp >= needed) {
    user.xp -= needed;
    user.level++;
    user.orbits += 200;

    message.channel.send({
      embeds: [blurEmbed("level up",
        `${message.author} reached level **${user.level}**\n+200 orbits`
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
      embeds: [blurEmbed("help", `
balance • daily • work • pay  
bankbalance • deposit • withdraw  
spin • rob  
roleshop • buyrole  
level • leaderboard  
prestige  
8ball  
      `)]
    });
  }

  // ======================
  // 💰 ECONOMY
  // ======================
  if (cmd === "balance") {
    return message.reply({
      embeds: [blurEmbed("balance", `
wallet: **${user.orbits}**  
bank: **${user.bank}/${user.bankLimit}**  
prestige: **${user.prestige}**
      `)]
    });
  }

  if (cmd === "daily") {
    if (Date.now() - user.lastDaily < 86400000)
      return message.reply({ embeds:[blurEmbed("daily","already claimed")] });

    const reward = Math.floor(Math.random()*200)+150;
    user.orbits += reward;
    user.lastDaily = Date.now();
    save();

    return message.reply({ embeds:[blurEmbed("daily",`+${reward}`)] });
  }

  if (cmd === "work") {
    if (Date.now() - user.lastWork < 60000)
      return message.reply({ embeds:[blurEmbed("work","wait 1 min")] });

    const earn = Math.floor(Math.random()*150)+50;
    user.orbits += earn;
    user.lastWork = Date.now();
    save();

    return message.reply({ embeds:[blurEmbed("work",`+${earn}`)] });
  }

  if (cmd === "spin") {
    if (Date.now() - user.lastSpin < 300000)
      return message.reply({ embeds:[blurEmbed("spin","cooldown")] });

    const reward = Math.floor(Math.random()*400);
    user.orbits += reward;
    user.lastSpin = Date.now();
    save();

    return message.reply({ embeds:[blurEmbed("spin",`+${reward}`)] });
  }

  if (cmd === "rob") {
    const t = message.mentions.users.first();
    if (!t || t.bot || t.id === message.author.id)
      return message.reply({ embeds:[blurEmbed("rob","invalid")] });

    const target = getUser(t.id);
    if (target.orbits <= 0)
      return message.reply({ embeds:[blurEmbed("rob","no money")] });

    if (Date.now() - user.lastRob < 1800000)
      return message.reply({ embeds:[blurEmbed("rob","cooldown")] });

    const steal = Math.floor(Math.random()*Math.min(200,target.orbits));
    user.orbits += steal;
    target.orbits -= steal;
    user.lastRob = Date.now();
    save();

    return message.reply({ embeds:[blurEmbed("rob",`stole ${steal}`)] });
  }

  // ======================
  // 🏦 BANK
  // ======================
  if (cmd === "bankbalance")
    return message.reply({ embeds:[blurEmbed("bank",`${user.bank}/${user.bankLimit}`)] });

  if (cmd === "deposit") {
    const amt = parseInt(args[0]);
    if (!amt || user.orbits < amt) return;

    if (user.bank + amt > user.bankLimit) return;

    user.orbits -= amt;
    user.bank += amt;
    save();

    return message.reply({ embeds:[blurEmbed("deposit",`+${amt}`)] });
  }

  if (cmd === "withdraw") {
    const amt = parseInt(args[0]);
    if (!amt || user.bank < amt) return;

    user.bank -= amt;
    user.orbits += amt;
    save();

    return message.reply({ embeds:[blurEmbed("withdraw",`${amt}`)] });
  }

  // ======================
  // 🎭 ROLE SHOP
  // ======================
  if (cmd === "roleshop") {
    let i = 1;
    const embed = new EmbedBuilder()
      .setColor(THEME_COLOR)
      .setTitle("blur • roles");

    for (let r in roleShop) {
      embed.addFields({
        name: `${i}. ${r}`,
        value: `price: ${roleShop[r].price}\n${roleShop[r].desc}`
      });
      i++;
    }

    embed.setFooter({ text: `balance: ${user.orbits}` });

    return message.reply({ embeds:[embed] });
  }

  if (cmd === "buyrole") {
    const item = roleShop[args[0]];
    if (!item) return;

    if (user.orbits < item.price) return;

    const role = message.guild.roles.cache.get(item.roleId);
    if (!role) return;

    await message.member.roles.add(role);

    user.orbits -= item.price;
    save();

    return message.reply({ embeds:[blurEmbed("role", role.name)] });
  }

  // ======================
  // 📈 LEVEL
  // ======================
  if (cmd === "level") {
    return message.reply({
      embeds:[blurEmbed("level", `
level: ${user.level}  
xp: ${user.xp}/${user.level*100}
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
      embeds:[blurEmbed("leaderboard", desc || "empty")]
    });
  }

  // ======================
  // 🎱 8BALL
  // ======================
  if (cmd === "8ball") {
    const responses = ["yes","no","maybe","unlikely","definitely"];
    const res = responses[Math.floor(Math.random()*responses.length)];

    return message.reply({
      embeds:[blurEmbed("8ball", `
q: ${args.join(" ") || "none"}  
a: **${res}**
      `)]
    });
  }

});

client.login(process.env.TOKEN);