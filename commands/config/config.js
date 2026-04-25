module.exports = {
  name: "config",
  run: async (client, message, args, embed, data, save) => {

    const cmd = args.shift()?.toLowerCase();
    if (!cmd) return;

    if (!data.config) {
      data.config = {
        prefix: ".",
        welcomeChannel: null,
        leaveChannel: null,
        modRole: null
      };
    }

    const isAdmin = message.member.permissions.has("ManageGuild");

    // ======================
    // ⚙️ SET PREFIX
    // ======================
    if (cmd === "setprefix") {
      if (!isAdmin) return message.reply("no perms");

      const newPrefix = args[0];
      if (!newPrefix) return;

      data.config.prefix = newPrefix;
      save();

      return message.reply(`prefix set to ${newPrefix}`);
    }

    // ======================
    // 📢 SET WELCOME CHANNEL
    // ======================
    if (cmd === "setwelcomechannel") {
      if (!isAdmin) return message.reply("no perms");

      const channel = message.mentions.channels.first();
      if (!channel) return;

      data.config.welcomeChannel = channel.id;
      save();

      return message.reply(`welcome channel set`);
    }

    // ======================
    // 👋 SET LEAVE CHANNEL
    // ======================
    if (cmd === "setleavechannel") {
      if (!isAdmin) return message.reply("no perms");

      const channel = message.mentions.channels.first();
      if (!channel) return;

      data.config.leaveChannel = channel.id;
      save();

      return message.reply(`leave channel set`);
    }

    // ======================
    // 🛡️ SET MOD ROLE
    // ======================
    if (cmd === "setmodrole") {
      if (!isAdmin) return message.reply("no perms");

      const role = message.mentions.roles.first();
      if (!role) return;

      data.config.modRole = role.id;
      save();

      return message.reply(`mod role set`);
    }

    // ======================
    // 📋 VIEW CONFIG
    // ======================
    if (cmd === "config") {
      return message.reply({
        embeds: [embed("server config ⚙️", `
prefix: ${data.config.prefix}
welcome: ${data.config.welcomeChannel || "none"}
leave: ${data.config.leaveChannel || "none"}
mod role: ${data.config.modRole || "none"}
        `)]
      });
    }

  }
};