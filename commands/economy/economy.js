module.exports = {
  run: async (client, message, args, embed, data, save, getUser) => {

    if (!args || !Array.isArray(args)) return;

    const cmd = args.shift();
    if (!cmd) return;

    const command = cmd.toLowerCase();

    const user = getUser(message.author.id);

    // INIT EXTRA DATA
    if (!user.inventory) user.inventory = {};
    if (!user.streak) user.streak = 0;

    const items = {
      apple: { price: 100, sell: 50 },
      laptop: { price: 2000, sell: 1200 },
      potion: { price: 500, sell: 250 }
    };

    // ======================
    // 🧰 INVENTORY
    // ======================
    if (command === "inventory") {
      const inv = Object.entries(user.inventory)
        .map(([k,v]) => `${k} x${v}`)
        .join("\n") || "empty";

      return message.reply({
        embeds:[embed("inventory 🧰", inv)]
      });
    }

    // ======================
    // 🛒 SHOP
    // ======================
    if (command === "shop") {
      let txt = "";

      for (let i in items) {
        txt += `${i} — 💜 ${items[i].price}\n`;
      }

      return message.reply({
        embeds:[embed("shop 🛒", txt)]
      });
    }

    // ======================
    // 🛍️ BUY
    // ======================
    if (command === "buy") {
      const item = args[0];
      const amt = parseInt(args[1]) || 1;

      if (!items[item]) return;

      const cost = items[item].price * amt;
      if (user.orbits < cost)
        return message.reply("not enough");

      user.orbits -= cost;
      user.inventory[item] = (user.inventory[item]||0)+amt;

      save();

      return message.reply(`bought ${item} x${amt}`);
    }

    // ======================
    // 🧪 USE
    // ======================
    if (command === "use") {
      const item = args[0];
      if (!user.inventory[item]) return;

      user.inventory[item]--;

      if (item === "apple") user.orbits += 50;
      if (item === "potion") user.xp += 50;

      save();

      return message.reply(`used ${item}`);
    }

    // ======================
    // 💸 SELL
    // ======================
    if (command === "sell") {
      const item = args[0];
      const amt = parseInt(args[1]) || 1;

      if (!user.inventory[item]) return;

      const value = items[item].sell * amt;

      user.inventory[item] -= amt;
      user.orbits += value;

      save();

      return message.reply(`sold ${item} x${amt}`);
    }

    // ======================
    // 🔥 STREAK
    // ======================
    if (command === "streak") {
      return message.reply({
        embeds:[embed("streak 🔥", `current: ${user.streak}`)]
      });
    }

    // ======================
    // 📈 PROFILE
    // ======================
    if (command === "profile") {
      return message.reply({
        embeds:[embed("profile 📈", `
level: ${user.level}
orbits: ${user.orbits}
bank: ${user.bank}
streak: ${user.streak}
        `)]
      });
    }

    // ======================
    // 🏦 BANK UPGRADE
    // ======================
    if (command === "upgradebank") {
      if (user.orbits < 15000)
        return message.reply("need 15k");

      user.orbits -= 15000;
      user.bankLimit = 100000;

      save();

      return message.reply("bank upgraded 💜");
    }

  }
};