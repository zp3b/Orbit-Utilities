const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionsBitField
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
// 💾 DATA
// ======================
let data = {};
if (fs.existsSync("./data.json")) {
  data = JSON.parse(fs.readFileSync("./data.json"));
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
      level: 1
    };
  }
  return data[id];
}

// ======================
// 🎭 ROLE SHOP CONFIG
// ======================
const roleShop = [
  { name: "VIP", price: 5000, roleId: "PUT_ROLE_ID" },
  { name: "ELITE", price: 15000, roleId: "PUT_ROLE_ID" }
];

// ======================
const embed = (t, d) =>
  new EmbedBuilder().setColor(COLOR).setTitle(t).setDescription(d);

client.once("ready", () => {
  console.log("online");
});

// ======================
// 💬 MESSAGE COMMANDS
// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);

  // XP SYSTEM
  const xp = Math.floor(Math.random() * 10) + 5;
  user.xp += xp;

  if (user.xp >= user.level * 100) {
    user.xp = 0;
    user.level++;
    user.orbits += 200;

    message.channel.send({
      embeds: [embed("level up", `level ${user.level}\n+200`)]
    });
  }

  save();

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const cmd = args.shift().toLowerCase();

  // ======================
  // 💜 HELP (BUTTON UI)
  // ======================
  if (cmd === "help") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("eco")
        .setLabel("economy")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("fun")
        .setLabel("fun")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("admin")
        .setLabel("admin")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.reply({
      embeds: [embed("help", "choose a category")],
      components: [row]
    });
  }

  // ======================
  // 💰 BALANCE (BUTTON REFRESH)
  // ======================
  if (cmd === "balance") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("refresh_bal")
        .setLabel("refresh")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.reply({
      embeds: [
        embed(
          "balance",
          `wallet: ${user.orbits}\nbank: ${user.bank}`
        )
      ],
      components: [row]
    });
  }

  // ======================
  // 🎭 ROLE SHOP (DROPDOWN)
  // ======================
  if (cmd === "roleshop") {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("buy_role")
      .setPlaceholder("select a role");

    roleShop.forEach((r, i) => {
      menu.addOptions({
        label: r.name,
        value: i.toString(),
        description: `${r.price} orbits`
      });
    });

    const row = new ActionRowBuilder().addComponents(menu);

    return message.reply({
      embeds: [embed("roles", "choose a role to buy")],
      components: [row]
    });
  }
});

// ======================
// ⚡ BUTTON / MENU HANDLER
// ======================
client.on("interactionCreate", async (i) => {
  if (!i.isButton() && !i.isStringSelectMenu()) return;

  const user = getUser(i.user.id);

  // HELP BUTTONS
  if (i.customId === "eco") {
    return i.reply({
      embeds: [embed("economy", "balance, daily, work, deposit")]
    });
  }

  if (i.customId === "fun") {
    return i.reply({
      embeds: [embed("fun", "8ball, spin")]
    });
  }

  if (i.customId === "admin") {
    return i.reply({
      embeds: [embed("admin", "mute, kick, etc")]
    });
  }

  // REFRESH BALANCE
  if (i.customId === "refresh_bal") {
    return i.update({
      embeds: [
        embed(
          "balance",
          `wallet: ${user.orbits}\nbank: ${user.bank}`
        )
      ]
    });
  }

  // ROLE BUY
  if (i.customId === "buy_role") {
    const item = roleShop[parseInt(i.values[0])];

    if (user.orbits < item.price)
      return i.reply({ content: "not enough", ephemeral: true });

    const role = i.guild.roles.cache.get(item.roleId);
    if (!role) return;

    await i.member.roles.add(role);

    user.orbits -= item.price;
    save();

    return i.reply({
      content: `bought ${item.name}`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);