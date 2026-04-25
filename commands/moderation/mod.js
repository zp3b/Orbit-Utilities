const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "moderation",
  run: async (client, message, args, embed, data, save) => {

    const cmd = args.shift()?.toLowerCase();
    if (!cmd) return;

    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    // ======================
    // 🔨 BAN
    // ======================
    if (cmd === "ban") {
      if (!isAdmin) return message.reply("no perms");

      const user = message.mentions.members.first();
      if (!user) return message.reply("mention user");

      await user.ban();
      message.reply(`banned ${user.user.tag}`);
    }

    // ======================
    // 👢 KICK
    // ======================
    if (cmd === "kick") {
      if (!isAdmin) return message.reply("no perms");

      const user = message.mentions.members.first();
      if (!user) return message.reply("mention user");

      await user.kick();
      message.reply(`kicked ${user.user.tag}`);
    }

    // ======================
    // 🔇 MUTE
    // ======================
    if (cmd === "mute") {
      if (!isAdmin) return message.reply("no perms");

      const user = message.mentions.members.first();
      if (!user) return message.reply("mention user");

      let role = message.guild.roles.cache.find(r => r.name === "Muted");
      if (!role) {
        role = await message.guild.roles.create({
          name: "Muted",
          permissions: []
        });

        message.guild.channels.cache.forEach(c => {
          c.permissionOverwrites.create(role, {
            SendMessages: false
          });
        });
      }

      await user.roles.add(role);
      message.reply(`muted ${user.user.tag}`);
    }

    // ======================
    // 🔊 UNMUTE
    // ======================
    if (cmd === "unmute") {
      if (!isAdmin) return message.reply("no perms");

      const user = message.mentions.members.first();
      const role = message.guild.roles.cache.find(r => r.name === "Muted");

      if (!user || !role) return;

      await user.roles.remove(role);
      message.reply(`unmuted ${user.user.tag}`);
    }

    // ======================
    // ⚠️ WARN SYSTEM
    // ======================
    if (cmd === "warn") {
      if (!isAdmin) return message.reply("no perms");

      const user = message.mentions.users.first();
      if (!user) return;

      if (!data.warnings) data.warnings = {};
      if (!data.warnings[user.id]) data.warnings[user.id] = [];

      const reason = args.join(" ") || "no reason";

      data.warnings[user.id].push(reason);
      save();

      message.reply(`warned ${user.tag} (${data.warnings[user.id].length})`);
    }

    if (cmd === "warnings") {
      const user = message.mentions.users.first() || message.author;

      if (!data.warnings || !data.warnings[user.id])
        return message.reply("no warnings");

      const list = data.warnings[user.id]
        .map((w, i) => `${i+1}. ${w}`)
        .join("\n");

      message.reply({ embeds: [embed("warnings", list)] });
    }

    if (cmd === "clearwarns") {
      if (!isAdmin) return;

      const user = message.mentions.users.first();
      if (!user) return;

      if (data.warnings) delete data.warnings[user.id];
      save();

      message.reply(`cleared warns for ${user.tag}`);
    }

    // ======================
    // 🧹 PURGE
    // ======================
    if (cmd === "purge") {
      if (!isAdmin) return;

      const amount = parseInt(args[0]);
      if (!amount) return;

      await message.channel.bulkDelete(amount);
      message.channel.send(`deleted ${amount}`);
    }

    // ======================
    // 🔒 LOCK / UNLOCK
    // ======================
    if (cmd === "lock") {
      if (!isAdmin) return;

      await message.channel.permissionOverwrites.edit(message.guild.id, {
        SendMessages: false
      });

      message.reply("channel locked");
    }

    if (cmd === "unlock") {
      if (!isAdmin) return;

      await message.channel.permissionOverwrites.edit(message.guild.id, {
        SendMessages: true
      });

      message.reply("channel unlocked");
    }

    // ======================
    // 🐢 SLOWMODE
    // ======================
    if (cmd === "slowmode") {
      if (!isAdmin) return;

      const sec = parseInt(args[0]);
      if (isNaN(sec)) return;

      await message.channel.setRateLimitPerUser(sec);
      message.reply(`slowmode ${sec}s`);
    }

    // ======================
    // 🎭 ROLE
    // ======================
    if (cmd === "role") {
      if (!isAdmin) return;

      const user = message.mentions.members.first();
      const role = message.mentions.roles.first();

      if (!user || !role) return;

      await user.roles.add(role);
      message.reply(`gave ${role.name}`);
    }

    if (cmd === "removerole") {
      if (!isAdmin) return;

      const user = message.mentions.members.first();
      const role = message.mentions.roles.first();

      if (!user || !role) return;

      await user.roles.remove(role);
      message.reply(`removed ${role.name}`);
    }

  }
};