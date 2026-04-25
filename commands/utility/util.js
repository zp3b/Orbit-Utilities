module.exports = {
  name: "utility",
  run: async (client, message, args, embed, data, save) => {

    if (!args || !Array.isArray(args)) return;

    const cmd = args.shift();
    if (!cmd) return;

    const command = cmd.toLowerCase();

    // ======================
    // 👤 USER INFO
    // ======================
    if (command === "userinfo") {
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
    if (command === "serverinfo") {
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
    if (command === "avatar") {
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
    if (command === "poll") {
      const question = args.join(" ");
      if (!question) return message.reply("give a question");

      const msg = await message.channel.send({
        embeds: [embed("poll 📊", question)]
      });

      await msg.react("👍");
      await msg.react("👎");
    }

    // ======================
    // ⏰ REMINDER
    // ======================
    if (command === "remind") {
      const time = parseInt(args[0]);
      const text = args.slice(1).join(" ");

      if (!time || !text) return message.reply("usage: .remind 10 hello");

      message.reply(`I’ll remind you in ${time}s`);

      setTimeout(() => {
        message.author.send(`⏰ reminder: ${text}`).catch(() => {});
      }, time * 1000);
    }

    // ======================
    // 💤 AFK
    // ======================
    if (!data.afk) data.afk = {};

    if (command === "afk") {
      const reason = args.join(" ") || "AFK";
      data.afk[message.author.id] = reason;
      save();
      return message.reply(`you are now AFK: ${reason}`);
    }

    // REMOVE AFK
    if (data.afk[message.author.id]) {
      delete data.afk[message.author.id];
      save();
      message.reply("welcome back, AFK removed");
    }

    // CHECK MENTION AFK
    const mentioned = message.mentions?.users?.first();
    if (mentioned && data.afk[mentioned.id]) {
      message.reply(`${mentioned.tag} is AFK: ${data.afk[mentioned.id]}`);
    }

    // ======================
    // 🤖 BOT INFO
    // ======================
    if (command === "botinfo") {
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
    if (command === "invite") {
      return message.reply("https://discord.com/oauth2/authorize?client_id=1494829583084556288&permissions=8&scope=bot");
    }

    // ======================
    // 🧮 CALC
    // ======================
    if (command === "calc") {
      try {
        if (!args.length) return message.reply("give something");

        const result = eval(args.join(" "));
        return message.reply(`result: ${result}`);
      } catch {
        return message.reply("invalid");
      }
    }

  }
};