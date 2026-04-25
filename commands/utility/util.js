module.exports = {
  name: "utility",
  run: async (client, message, args, embed, data, save) => {

    const cmd = args.shift()?.toLowerCase();
    if (!cmd) return;

    // ======================
    // 👤 USER INFO
    // ======================
    if (cmd === "userinfo") {
      const user = message.mentions.members.first() || message.member;

      return message.reply({
        embeds: [embed("user info 👤", `
name: ${user.user.tag}
id: ${user.id}
joined: ${user.joinedAt.toDateString()}
        `)]
      });
    }

    // ======================
    // 🏠 SERVER INFO
    // ======================
    if (cmd === "serverinfo") {
      return message.reply({
        embeds: [embed("server info 🏠", `
name: ${message.guild.name}
members: ${message.guild.memberCount}
created: ${message.guild.createdAt.toDateString()}
        `)]
      });
    }

    // ======================
    // 🖼️ AVATAR
    // ======================
    if (cmd === "avatar") {
      const user = message.mentions.users.first() || message.author;

      return message.reply({
        embeds: [{
          title: `${user.username}'s avatar`,
          image: { url: user.displayAvatarURL({ size: 1024 }) }
        }]
      });
    }

    // ======================
    // 📊 POLL
    // ======================
    if (cmd === "poll") {
      const question = args.join(" ");
      if (!question) return;

      const msg = await message.channel.send({
        embeds: [embed("poll 📊", question)]
      });

      await msg.react("👍");
      await msg.react("👎");
    }

    // ======================
    // ⏰ REMINDER
    // ======================
    if (cmd === "remind") {
      const time = parseInt(args[0]);
      const text = args.slice(1).join(" ");

      if (!time || !text) return;

      message.reply(`I’ll remind you in ${time}s`);

      setTimeout(() => {
        message.author.send(`⏰ reminder: ${text}`);
      }, time * 1000);
    }

    // ======================
    // 💤 AFK
    // ======================
    if (cmd === "afk") {
      const reason = args.join(" ") || "AFK";

      if (!data.afk) data.afk = {};
      data.afk[message.author.id] = reason;
      save();

      return message.reply(`you are now AFK: ${reason}`);
    }

    // AUTO REMOVE AFK
    if (data.afk && data.afk[message.author.id]) {
      delete data.afk[message.author.id];
      save();
      message.reply("welcome back, AFK removed");
    }

    // MENTION AFK
    if (message.mentions.users.first()) {
      const u = message.mentions.users.first();

      if (data.afk && data.afk[u.id]) {
        message.reply(`${u.tag} is AFK: ${data.afk[u.id]}`);
      }
    }

    // ======================
    // 🤖 BOT INFO
    // ======================
    if (cmd === "botinfo") {
      return message.reply({
        embeds: [embed("bot info 🤖", `
name: Blur
servers: ${client.guilds.cache.size}
users: ${client.users.cache.size}
        `)]
      });
    }

    // ======================
    // 🔗 INVITE
    // ======================
    if (cmd === "invite") {
      return message.reply("add me: https://discord.com/oauth2/authorize?client_id=1494829583084556288&permissions=8&scope=bot");
    }

    // ======================
    // 🧮 CALC
    // ======================
    if (cmd === "calc") {
      try {
        const result = eval(args.join(" "));
        return message.reply(`result: ${result}`);
      } catch {
        return message.reply("invalid");
      }
    }

  }
};