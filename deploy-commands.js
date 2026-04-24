const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

  // 💰 ECONOMY
  new SlashCommandBuilder().setName("balance").setDescription("check your balance"),
  new SlashCommandBuilder().setName("daily").setDescription("claim daily reward"),
  new SlashCommandBuilder().setName("work").setDescription("work for orbits"),
  new SlashCommandBuilder()
    .setName("pay")
    .setDescription("pay someone")
    .addUserOption(o => o.setName("user").setDescription("target").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("amount").setRequired(true)),

  // 🏦 BANK
  new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("deposit orbits")
    .addIntegerOption(o => o.setName("amount").setDescription("amount").setRequired(true)),

  new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("withdraw orbits")
    .addIntegerOption(o => o.setName("amount").setDescription("amount").setRequired(true)),

  new SlashCommandBuilder().setName("bankbalance").setDescription("check bank"),

  // 💀 ROB
  new SlashCommandBuilder()
    .setName("rob")
    .setDescription("rob someone")
    .addUserOption(o => o.setName("user").setDescription("target").setRequired(true)),

  // 🎰 FUN
  new SlashCommandBuilder().setName("spin").setDescription("spin for rewards"),

  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("ask something")
    .addStringOption(o =>
      o.setName("question").setDescription("your question").setRequired(true)
    ),

  // 📈 LEVEL
  new SlashCommandBuilder().setName("level").setDescription("check your level"),
  new SlashCommandBuilder().setName("leaderboard").setDescription("top users"),

  // 🎭 ROLE SHOP
  new SlashCommandBuilder().setName("roleshop").setDescription("view roles"),
  new SlashCommandBuilder()
    .setName("buyrole")
    .setDescription("buy a role")
    .addStringOption(o =>
      o.setName("role").setDescription("role name (vip, elite)").setRequired(true)
    ),

  // 🏆 PRESTIGE
  new SlashCommandBuilder().setName("prestige").setDescription("prestige"),

  // 🧰 UTILITY
  new SlashCommandBuilder().setName("ping").setDescription("check ping"),
  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("get avatar")
    .addUserOption(o => o.setName("user").setDescription("target")),

  new SlashCommandBuilder().setName("serverinfo").setDescription("server info"),
  new SlashCommandBuilder().setName("uptime").setDescription("bot uptime"),

  // 🛠 MODERATION
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("clear messages")
    .addIntegerOption(o => o.setName("amount").setDescription("amount").setRequired(true)),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("kick user")
    .addUserOption(o => o.setName("user").setDescription("target").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("ban user")
    .addUserOption(o => o.setName("user").setDescription("target").setRequired(true)),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("timeout user")
    .addUserOption(o => o.setName("user").setDescription("target").setRequired(true))

];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands("1494829583084556288"),
    { body: commands }
  );

  console.log("ALL SLASH COMMANDS LOADED 😈");
})();