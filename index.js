// require("http").createServer((_, res) => res.end("Alive!")).listen(8080)
const huntNammersCooldown = new Set()
const talkedRecently = new Set()
const commandcooldown = new Set()
const cdrcooldown = new Set()
const fs = require('fs-extra')
const si = require('systeminformation')
const { performance } = require('perf_hooks')
const Database = require("@replit/database")
const db = new Database()
const humanizeDuration = require("humanize-duration")
const dateFormat = require('dateformat')
const isoConv = require('iso-language-converter')
const axios = require('axios').default
const { ChatClient, AlternateMessageModifier, SlowModeRateLimiter } = require("dank-twitch-irc")
let client = new ChatClient({

  username: process.env['TWITCH_USERNAME'],
  password: process.env['TWITCH_PASSWORD'],

  rateLimits: "verifiedBot",
  maxChannelCountPerConnection: 100,

  connectionRateLimits: {
    parallelConnections: 20,
    releaseTime: 300,
  },

  connection: {
    type: "websocket",
    secure: true,
  },
});

client.use(new SlowModeRateLimiter(client))
client.use(new AlternateMessageModifier(client))

client.on("ready", () => console.log("Successfully connected to chat"))
client.on("close", (error) => {
  if (error != null) {
    console.error("Client closed due to error", error)
  }
});
const channelOptions = fs.readFileSync('channels.txt').toString().split(' ')

client.connect();
client.joinAll(channelOptions)

setInterval(function() {
  axios.put(`https://supinic.com/api/bot-program/bot/active?auth_user=${process.env['SUPI_USER_AUTH']}&auth_key=${process.env['SUPI_USERKEY_AUTH']}`)
    .catch(err => { client.whisper('darkvypr', `There was an error pinging Supi's API!`) })
    .then((response) => {
      let supiresults = response.data
      if (supiresults.statusCode === 200) {
        console.log('✅ SUCCESS Supinic API Ping ✅')
      }
      else {
        console.log('⛔ UNSUCCESSFUL Supinic API Ping ⛔')
        client.whisper('darkvypr', `There was an error pinging Supi's API!`)
      }
    });
}, 10 * 60000);
client.on("PRIVMSG", async (msg) => {
  let [user, userlow, channel, message] = [msg.displayName, msg.senderUsername, msg.channelName, msg.messageText.replace(' 󠀀', '')]

  console.log(`[#${channel}] ${user} (${userlow}): ${message}`)

  let globalPing = /\b(v|b)ypa(')?(s)?\b/i.test(message) || /(bright|dark)?(v|b)(y)p(e|u|o)?r/i.test(message) || /\b(dv(')?(s)?)\b/i.test(message) || /vpyr/i.test(message) || /\b(b|v)o?ip(o*|u)r\b/i.test(message) || /\b(bright|dark)vip(e|u|o)r\b/i.test(message) || /\b(b|v)ip(o|u)r\b/i.test(message) || /\b(b|v)pe?r\b/i.test(message) || /darkv/i.test(message) || /\b(dark|bright)?\s?dype?(r|a)\b/i.test(message) || /\b(b|v)ooper\b/i.test(message) || /(dark|bright)\s?diaper/i.test(message) || /(dark|bright)\s?viper|vypr/i.test(message)
  const blacklistedChannels = new RegExp(/visioisiv|darkvypr|vyprbottesting|vyprbot/)
  const blacklistedUsers = new RegExp(/darkvypr|vyprbot|vyprbottesting|hhharrisonnnbot|apulxd|daumenbot|kuharabot|snappingbot|oura_bot/)

  if (globalPing && !blacklistedChannels.test(channel) && !blacklistedUsers.test(userlow)) {
    client.whisper('darkvypr', `Channel: #${channel} | User: ${userlow} | Message: ${message}`)
  }

  if (/\bn(a|4)m(mer|ming)?\b/gi.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `NammersOut elisDance NammersOut`);
  }

  let prefix = await db.get(`${channel}Prefix`)
  if (!prefix) {
    prefix = 'vb '
  }

  if (userlow === 'xenoplopqb' && message.includes('modCheck') && channel === 'darkvypr') {
    client.privmsg(channel, `modCheck`)
  }

  if (/(vyprbot)(\s)?(v(2|two)|version(\s)?(2|two))/i.test(message) && userlow !== 'vyprbot') {
    client.me(channel, `VyprBot V2 Soon ™ Copium`)
  }

  if (/\bn(a|4)m(mer|ming)?\b/gi.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `NammersOut elisDance NammersOut`)
  }

  if (/NaN/.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `NaN`)
  }

  if (/\bunhandled\s?promise\s?rejection\b/i.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `js`)
  }

  if (/@?vyprbot\sprefix/i.test(message)) {
    client.me(channel, `${user} --> The prefix for this channel is: "${prefix.trim()}"`)
  }

  let didAliCallMe12YearsOld = /(you(')?(r)?(e)?)\s(all)?\s(12)/i.test(message) || /(dark)?(v|b)yp(r|a)\s(is|=)\s12((year(s)?|yr(s)))?(old)?/i.test(message) || /(ur)(\sall)?\s12/i.test(message) || /(you|u)\sguys\s(are|are\sall|=)\s12/i.test(message)

  if (didAliCallMe12YearsOld && userlow === 'ali2465') {
    db.get('vypais12').then(vypais12 => {
      db.set('vypais12', +vypais12 + 1)
      client.me(channel, `Vypr has been called a 12 year old ${+vypais12 + 1} times. PANIC`)
    })
  }

  if (!message.startsWith(prefix) || userlow === 'vyprbot') {
    return
  }

  if (userlow !== 'vyprbot' && userlow !== 'darkvypr') {
    if (commandcooldown.has(userlow)) {
      return
    }
    else {
      commandcooldown.add(userlow);
      setTimeout(() => {
        commandcooldown.delete(userlow);
      }, 2000);

      db.get("commandusage").then(function(value) {
        let usage = +value + 1
        db.set("commandusage", usage);
      })
    }
  }

  let [command, ...args] = message.slice(prefix.length).split(/ +/g)
  command = command.toLowerCase()
  // Variables

  var defaultname = args[0]
  if (!defaultname)
    var defaultname = `${userlow}`

  var defaultname2 = args[1]
  if (!defaultname2)
    var defaultname2 = `${channel}`

  var gnkissmsg = args[1]
  if (!gnkissmsg)
    var gnkissmsg = 'catKISS 💖'

  var kissmsg = args[1]
  if (!kissmsg)
    var kissmsg = 'peepoShy'

  var logschannel = args[1]
  if (!logschannel)
    var logschannel = 'xqcow'

  var hugmsg = args[1]
  if (!hugmsg)
    var hugmsg = 'HUGGIES'

  // Number Validity Checker

  let isNumber = (number) => {
    return /^\d+$/.test(number)
  }

  // Random Number

  function getRandomInt(max) {
    return Math.floor(Math.random() * max + 1);
  }

  // Owner Only Commands

  async function checkAdmin(user) {
    let admins = await db.get('admins')
    let adminsArray = admins.split(' ')
    if (adminsArray.indexOf(user) > -1) {
      return true
    }
    else {
      return false
    }
  }

  async function addAdmin(user) {
    let admins = await db.get('admins')
    let adminsArray = admins.split(' ')
    if (adminsArray.indexOf(user) > -1) {
      return 'User is already an admin!'
    }
    else {
      adminsArray.push(user)
      db.set('admins', `${adminsArray.join(' ').trim()}`)
    }
  }

  async function deleteAdmin(user) {
    let admins = await db.get('admins')
    let adminsArray = admins.split(' ')
    let indexOfUser = adminsArray.indexOf(user)
    if (indexOfUser > -1) {
      adminsArray.splice(indexOfUser, 1)
      db.set('admins', `${adminsArray.join(' ').trim()}`)
    }
    else {
      return 'User is not an admin!'
    }
  }

  if (command === 'admin') {
    if (!args[0] || !args[1] || !/add|remove|delete|check/i.test(args[0]) && userlow === 'darkvypr') {
      client.me(channel, `DarkVypr --> Invalid Syntax! Example: "${prefix}admin {add|delete|remove|check} {user}".`)
    }
    else if (args[0] === 'add' && userlow === 'darkvypr') {
      addAdmin(args[1].toLowerCase()).then(function(value) {
        if (value) {
          client.me(channel, `DarkVypr --> There was an error with that command. Reason: ${value}`)
        }
        else {
          client.me(channel, `DarkVypr --> Successfully added user ${args[1].toLowerCase()} as an admin!`)
        }
      })
    }
    else if (`${args[0]}` === 'delete' || `${args[0]}` === 'remove' && userlow === 'darkvypr') {
      deleteAdmin(`${args[1].toLowerCase()}`).then(function(value) {
        if (value) {
          client.me(channel, `DarkVypr --> There was an error with that command. Reason: ${value}`)
        }
        else {
          client.me(channel, `DarkVypr --> Successfully removed ${args[1].toLowerCase()}'s admin privileges!`)
        }
      })
    }
    else if (`${args[0]}` === 'check' && userlow === 'darkvypr') {
      checkAdmin(`${args[1].toLowerCase()}`).then(function(value) {
        if (value) {
          client.me(channel, `DarkVypr --> User ${args[1].toLowerCase()} is an admin! ✅`)
        }
        else {
          client.me(channel, `DarkVypr --> User ${args[1].toLowerCase()} is not an admin! ❌`)
        }
      })
    }
    else {
      client.me(channel, `${user} --> You dont have permission to use that command! Required: Bot Developer`)
    }
  }

  if (command === 'rename') {
    checkAdmin(userlow).then(function(isAdmin) {
      if (isAdmin) {
        async function renameUser(oldName, newName) {
          let bday = await db.get(`${oldName}bday`)
          let location = await db.get(`${oldName}time`)
          let twitter = await db.get(`${oldName}twitter`)
          let nammers = await db.get(`${oldName}nammers`)
          if (bday !== null) {
            db.set(`${newName}bday`, bday)
          }
          if (location !== null) {
            db.set(`${newName}time`, location)
          }
          if (twitter !== null) {
            db.set(`${newName}twitter`, twitter)
          }
          if (nammers !== null) {
            db.set(`${newName}nammers`, nammers)
          }
          if (nammers === null && twitter === null && location === null && bday === null) {
            client.me(channel, `${user} --> That user dosen't have any data associated with their account!`)
          }
          else {
            db.list(oldName).then(function(value) {
              for (let i = 0; i < value.length; i++) {
                db.delete(value[i])
              }
            })
            client.me(channel, `${user} --> Succesfully transferred all of the data from "${oldName}" to "${newName}" EZ`)
          }
        }
        if (!args[0] || !args[1]) {
          client.me(channel, `${user} --> Provide an old and new account.`)
        }
        else {
          renameUser(`${args[0].toLowerCase()}`, `${args[1].toLowerCase()}`)
        }
      }
      else {
        client.me(channel, `${user} --> You don't have the required permission to use that command! If you would like to have all of your data moved over to a new name, use "${prefix}suggest" and I will get to it. Required: Bot Developer`)
      }
    })
  }

  async function joinChannel(args) {
    if (args.length == 0) {
      return { success: false, case: 'no_channel_given', channelJoined: null, reply: "Please provide a channel to join." }
    }
    else if (channelOptions.indexOf(args[0].toLowerCase()) > -1) {
      return { success: false, case: 'channel_already_joined', channelJoined: null, reply: "I'm already in that channel!" }
    }
    else {
      channelOptions.push(args[0].toLowerCase())
      fs.writeFile('channels.txt', channelOptions.join(' '))
      client.join(args[0].toLowerCase())
      client.me(args[0].toLowerCase(), `Successfully joined! KonCha`)
      return { success: true, case: null, channelJoined: args[0], reply: `Successfully joined #${args[0].toLowerCase()} TehePelo` }
    }
  }

  if (command === 'join') {
    checkAdmin(userlow).then(isAdmin => {
      if (isAdmin) {
        joinChannel(args).then(joinData => {
          client.me(channel, `${user} --> ${joinData.reply}`)
        })
      }
      else {
        client.me(channel, `${user} --> You don't have the required permission to use that command! If you'd like the bot in your channel, use "${prefix}suggest". Required: Admin`)
      }
    })
  }

  async function partChannel(channel, admin) {
    if (!channel && admin) {
      return { success: false, case: 'no_channel_given', channelLeft: null, reply: "Please provide a channel to leave." }
    }
    else if (channelOptions.indexOf(channel.toLowerCase()) == -1 && admin) {
      return { success: false, case: 'channel_not_joined', channelLeft: null, reply: "I'm not in that channel!" }
    }
    else {
      channelOptions.splice(channelOptions.indexOf(channel.toLowerCase()), 1)
      fs.writeFile('channels.txt', channelOptions.join(' '))
      client.me(channel.toLowerCase(), `Successfully left this channel! SadCat`)
      client.part(channel.toLowerCase())
      return { success: true, case: null, channelLeft: channel, reply: `Successfully left #${channel} SadCat` }
    }
  }

  if (command === 'part') {
    checkAdmin(userlow).then(isAdmin => {
      if (isAdmin) {
        partChannel(args[0], isAdmin).then(partData => {
          client.me(channel, `${user} --> ${partData.reply}`)
        })
      }
      else if (userlow == channel) {
        partChannel(channel, isAdmin).then(partData => {
          client.me(channel, `${user} --> ${partData.reply}`)
        })
      }
      else {
        client.me(channel, `${user} --> You don't have the required permission to use that command! Required: Admin or Channel Broadcaster`)
      }
    })
  }

  if (command === 'datadelete') {
    if (await checkAdmin(userlow)) {
      db.get(`${args[0].toLowerCase()}`).then(function(value) {
        let valueofkey = `${value}`
        client.me(channel, (`${user} --> Succesfully deleted key: "${args[0]}" value: "${valueofkey}" MODS`))
        db.delete(`${args[0]}`)
      })
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  if (command === 'datacreate') {
    if (await checkAdmin(userlow)) {
      db.set(`${args[0].toLowerCase()}`, `${args[1]}`);
      client.me(channel, `${user} --> Succesfully added key: "${args[0]}"  value: "${args[1]}" NOTED`)
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  if (command === 'datainspect') {
    if (await checkAdmin(userlow)) {
      db.get(`${args[0].toLowerCase()}`).then(function(value) {
        client.me(channel, (`${user} --> Key: "${args[0]}" Value: "${value}". NOTED`))
      })
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  if (command === 'datalist') {
    if (await checkAdmin(userlow)) {
      if (!args[0]) {
        db.list().then(keys => console.log(keys))
      }
      else if (`${args[1]}` === 'chat:true' || `${args[1]}` === 'public:true') {
        db.list(`${args[0].toLowerCase()}`).then(function(keys) {
          let keysClean = keys.join(', ').trim()
          client.me(channel, `DarkVypr --> ${keysClean}`)
        })
      }
      else {
        db.list(`${args[0].toLowerCase()}`).then(keys => console.log(keys))
      }
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  if (command === 'setnammers') {
    if (`${userlow}` === 'darkvypr') {
      db.set(`${args[0].toLowerCase()}nammers`, `${args[1]}`)
      client.me(channel, (`${user} --> Set ${args[0]}'s nammers to ${args[1]}!`))
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  if (command === 'addnammers') {
    if (`${userlow}` === 'darkvypr') {
      db.get(`${args[0].toLowerCase()}nammers`).then(function(value) {
        let addednammers = +value + +args[1]
        db.set(`${args[0].toLowerCase()}nammers`, addednammers)
        client.me(channel, (`${user} --> Gave ${args[1]} nammers to ${args[0]}!`))
      })
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  // Capitalize Each Word In A String

  let capitalizeEachWord = (str) => {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
      // You do not need to check if i is larger than splitStr length, as your for does that for you
      // Assign it back to the array
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
  }

  // Truncate

  function truncate(string, limit) {
    if (string.length <= limit) {
      return string
    }
    return string.slice(0, limit) + '...'
  }

  // Capitalize Each Word In A String

  let timeDelta = (date) => {
    return new Date(date) - new Date().addHours(-5)
  }

  // Add Hours

  Date.prototype.addHours = function(h) {
    this.setHours(this.getHours() + h);
    return this;
  }

  // Leppu Query

  async function getUserData(user, args) {
    const idCheck = args.join(' ').match(/uid(:|=)(true|false)/i)
    var idBoolean = 'false'
    if (idCheck) { idBoolean = idCheck[2]; args.splice(args.indexOf(idCheck[0]), 1) }
    if (args[0]) { user = args[0].replace('@', '') }
    try {
      let userData = await axios.get(`https://api.ivr.fi/v2/twitch/user/${user}?id=${idBoolean}`)
      userData = userData.data
      let creationDate = dateFormat(userData.createdAt, "fullDate")
      let timeSinceCreation = humanizeDuration(timeDelta(creationDate), { units: ["y", "mo", "d", "m"], round: true, largest: 3 })
      var roles = []
      var uid = userData.id
      if (userData.roles.isAffiliate) { roles.push('Affiliate') }
      if (userData.roles.isPartner) { roles.push('Partner') }
      if (userData.roles.isStaff) { roles.push('Staff') }
      if (userData.verifiedBot) { roles.push('Verified Bot') }
      if (!userData.roles.isAffiliate && !userData.roles.isPartner && !userData.roles.isStaff && !userData.verifiedBot) { roles.push('No Roles Associated') }
      if (userData.banned) { uid = userData.id + " ( ⛔ Banned User ⛔ )" }
      let obj = {
        banned: userData.banned,
        followers: userData.followers,
        following: userData.follows,
        name: userData.displayName,
        uid: uid,
        bio: userData.bio,
        colour: userData.chatColor,
        pfp: userData.logo,
        rolesArray: roles,
        roles: roles.join(', '),
        creationDate: creationDate,
        timeSinceCreation: timeSinceCreation,
      }
      return { success: true, obj, reply: `Display Name: ${obj.name} | Banned: ${obj.banned} | UID: ${obj.uid} | Created: ${obj.creationDate} (${obj.timeSinceCreation} ago) | Followers: ${obj.followers} | Colour: ${obj.colour} | Bio: ${obj.bio} | Profile Picture: ${obj.pfp} | Roles/Ranks: ${obj.roles}` }
    } catch (err) {
      return { success: false, reply: `Error: ${err.response.data.message}` }
    }
  }

  // Check for no-no words

  function checkPhrase(phrase) {
    return /(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|η|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/i.test(phrase.toLowerCase())
  }

  // Bot Info

  async function pingServer() {
    let [ramusage, commands] = [Math.round(process.memoryUsage().rss / 1024 / 1024), await db.get('commandusage')]
    let t0 = performance.now()
    await client.ping()
    let t1 = performance.now()
    let pingObj = {
      uptime: process.uptime(),
      ram: ramusage,
      commands: +commands + 1,
      latency: Math.round((t1 - t0)),
    }
    db.set('commandusage', pingObj.commands)
    return `PunOko 🏓 | Latency: ${pingObj.latency} ms | Bot Uptime: ${humanizeDuration(Math.round(pingObj.uptime) * 1000, { round: true, largest: 2 })} | Commands Used: ${pingObj.commands + 1} | RAM Usage: ${pingObj.ram} MB | Prefix: "${prefix.trim()}" | Commands: https://darkvypr.com/commands | Use "${prefix}request" for info on requesting the bot.`
  }

  if (command === 'ping' || command === 'help') {
    pingServer().then(pingData => {
      client.me(channel, `${user} --> ${pingData}`)
    })
  }

  if (command === 'commands') {
    client.me(channel, `${user} --> A list of commands can be found here NekoProud 👉 https://darkvypr.com/commands`);
  }

  // Set Commands

  async function setData(user, args) {
    if (!args[0] || !args[1]) { return { success: false, reply: `Invalid command syntax!. Examples: "${prefix}set twitter darkvyprr", "${prefix}set birthday 8/14/2005 (mm/dd/yyyy)" or "${prefix}set location lasalle ontario"` } }
    const [setting, value, bdayRegExp] = [args[0], args[1], new RegExp('^(?!0?2/3)(?!0?2/29/.{3}[13579])(?!0?2/29/.{2}[02468][26])(?!0?2/29/.{2}[13579][048])(?!(0?[469]|11)/31)(?!0?2/29/[13579][01345789]0{2})(?!0?2/29/[02468][1235679]0{2})(0?[1-9]|1[012])/(0?[1-9]|[12][0-9]|3[01])/([0-9]{4})$')]
    args.shift()
    if (setting == 'twitter') {
      let account = value.replace('@', '').toLowerCase()
      db.set(`${user}twitter`, account)
      return { success: true, reply: `Successfully set your Twitter account to: @${account}!` }
    }
    if (setting == 'location') {
      let location = await axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(args.join(' ')).toLowerCase()}&apiKey=${process.env['GEOCODING_KEY']}`)
      if (location.data.items.length == 0) { return { success: false, reply: `That location is invalid!` } }
      db.set(`${user}time`, encodeURIComponent(location.data.items[0].title))
      return { success: true, reply: `Successfully set your location to: ${location.data.items[0].title}` }
    }
    if (setting == 'bday' || setting == 'birthday') {
      if (!bdayRegExp.test(value)) { return { success: false, reply: `Invalid Syntax. Example: "${prefix}set birthday 8/14/2005 (mm/dd/yyyy)".` } }
      db.set(`${user}bday`, value)
      return { success: false, reply: `Successfully set your birthday to: ${dateFormat(value, "fullDate")}!` }
    }
    if (setting == 'prefix') {
      if (msg.isMod || await checkAdmin(user) || channel == userlow) {
        if (/^[a-zA-Z]+$/.test(value)) { db.set(`${channel}Prefix`, `${value} `); return { success: true, reply: `Successfully set the prefix for this channel to: ${value}` } }
        db.set(`${channel}Prefix`, value)
        return { success: true, reply: `Successfully set the prefix for this channel to: ${value}` }
      }
      return { success: false, reply: `You don't have the required permission to use that command! Required: Moderator or above.` }
    }
    return { success: false, reply: `Invalid command syntax!. Examples: "${prefix}set twitter darkvyprr", "${prefix}set birthday 8/14/2005 (mm/dd/yyyy)" or "${prefix}set location lasalle ontario"` }
  }

  if (command == 'set') {
    setData(userlow, args).then(response => {
      client.me(channel, `${user} --> ${response.reply}`)
    })
  }

  // Social Commands - Self Promo

  if (command === 'disc' || command === 'discord') {
    if (channel === 'darkvypr' || channel === 'visioisiv' || channel === 'gotiand' || userlow === 'darkvypr') {
      client.me(channel, `Join the homie server ${user} TriHard 👉 http://idiotas.darkvypr.com`);
    }
    else {
      client.me(channel, `${user} --> GearScare This command is only available in darkvypr, #VisioisiV and #Gotiand.`);
    }
  }

  if (command === 'youtube' || command === 'yt') {
    if (channel === 'darkvypr' || `${userlow}` === 'darkvypr') {
      client.me(channel, `${user} --> Sub pls AYAYAsmile http://yt.darkvypr.com`);
    }
    else {
      client.me(channel, `${user} --> GearScare This command is only available in DarkVypr's chat`);
    }
  }

  if (command === 'github' || command === 'git') {
    if (channel === 'darkvypr' || `${userlow}` === 'darkvypr') {
      client.me(channel, `${user} --> peepoChat http://git.darkvypr.com`);
    }
    else {
      client.me(channel, `GearScare This command is only available in DarkVypr's chat ${user}`);
    }
  }

  if (command === 'site' || command === 'website' || command === 'links') {
    if (channel === 'darkvypr' || `${userlow}` === 'darkvypr') {
      client.me(channel, `${user} --> https://darkvypr.com NekoProud`);
    }
    else {
      client.me(channel, `GearScare This command is only available in DarkVypr's chat ${user}`);
    }
  }

  // Suggestions

  async function newSuggestion(args) {
    if (args.length == 0) {
      return { success: false, reply: `Please provide a suggestion. Make the suggestion as descriptive as possible.` }
    }
    let [id, content, today] = [+(await db.get('suggestion')) + 1, args.join(' '), new Date().addHours(-5).toISOString()]
    db.set('suggestion', id)
    await fs.writeJson(`suggestions/active/${id}.json`, { user: userlow, id: id, date: today, state: 'Active/Being Worked On', suggestion: content })
    client.whisper('darkvypr', `[New Suggestion] User: ${userlow} | Channel: ${channel} | ID: ${id} | Body: ${content}`)
    let checkIfAFK = await axios.get(`https://supinic.com/api/bot/afk/check?auth_user=${process.env['SUPI_USER_AUTH']}&auth_key=${process.env['SUPI_USERKEY_AUTH']}&userID=1093802`)
    if (checkIfAFK.data.data.status !== null) {
      await axios.post(`https://supinic.com/api/bot/reminder?auth_user=${process.env['SUPI_USER_AUTH']}&auth_key=${process.env['SUPI_USERKEY_AUTH']}&userID=1093802&private=true&text=[New Suggestion] A new suggestion has been made while you were AFK: User: ${userlow} | ID: ${id} | Body: ${content}`)
    }
    client.whisper(userlow, `You created a suggestion with the ID: ${id}`)
    return { success: true, reply: `Your suggestion has been saved. ID: ${id}` }
  }

  async function unsetSuggestion(args) {
    if (args.length == 0 || !isNumber(args[0])) {
      return { success: false, reply: `Please provide a valid suggestion ID to unset.` }
    }
    let id = +args[0]
    if (!(await fs.exists(`suggestions/active/${id}.json`))) {
      return { success: false, reply: `There is no suggestion with that id!` }
    }
    let suggestionDetails = await fs.readJson(`suggestions/active/${id}.json`)
    if (suggestionDetails.user !== userlow && !await checkAdmin(userlow)) {
      return { success: false, reply: `You don't own that suggestion!` }
    }
    await fs.writeJson(`suggestions/active/${id}.json`, { user: userlow, id: id, date: suggestionDetails.date, dateDismissed: new Date().addHours(-5).toISOString(), state: 'Dismissed By Author (Unset)', suggestion: suggestionDetails.suggestion })
    await fs.rename(`suggestions/active/${id}.json`, `suggestions/author-dismissed/${id}.json`)
    return { success: true, reply: `Your suggestion with the ID ${id} was successfully unset.` }
  }

  async function checkSuggestion(args) {
    if (args[0] == 'all' && await checkAdmin(userlow)) {
      let suggestions = fs.readdirSync('suggestions/active').join(', ')
      return { success: true, reply: `Active Suggestions: ${suggestions.replace(/.json/g, '')}` }
    }
    if (args.length == 0 || !isNumber(args[0])) {
      return { success: false, reply: `Please provide a valid suggestion ID to check.` }
    }
    let id = +args[0]
    let location = () => {
      if (fs.existsSync(`suggestions/active/${id}.json`)) {
        return { success: true, location: 'active' }
      }
      else if (fs.existsSync(`suggestions/approved/${id}.json`)) {
        return { success: true, location: 'approved' }
      }
      else if (fs.existsSync(`suggestions/author-dismissed/${id}.json`)) {
        return { success: true, location: 'author-dismissed' }
      }
      else if (fs.existsSync(`suggestions/denied/${id}.json`)) {
        return { success: true, location: 'denied' }
      }
      else {
        return { success: false, location: null }
      }
    }
    let locationOfSuggestion = location()
    if (!locationOfSuggestion.success) {
      return { success: false, reply: `There is no suggestion with that id!` }
    }
    let suggestionDetails = await fs.readJson(`suggestions/${locationOfSuggestion.location}/${id}.json`)
    if (suggestionDetails.user !== userlow && !await checkAdmin(userlow)) {
      return { success: false, reply: `You don't own that suggestion!` }
    }
    let suggestionObj = {
      user: suggestionDetails.user,
      id: suggestionDetails.id,
      date: suggestionDetails.date,
      state: suggestionDetails.state,
      body: suggestionDetails.suggestion
    }
    let reasonsAndMoreInfo = () => {
      if (locationOfSuggestion.location == 'denied' || locationOfSuggestion.location == 'approved') {
        if (suggestionDetails.reason == '') {
          return `| No reason provided | Action By: ${suggestionDetails.actionBy} |`
        }
        return `| Reason: ${suggestionDetails.reason} | Action By: ${suggestionDetails.actionBy} |`
      }
      else {
        return `|`
      }
    }
    return { success: true, suggestionObj, reply: `ID: ${id} | State: ${suggestionObj.state} | Date Created: ${dateFormat(suggestionObj.date, "mmmm dS, yyyy ' at ' h:MM TT")} (${humanizeDuration(timeDelta(suggestionObj.date), { largest: 2, round: true, delimiter: " and " })} ago) ${reasonsAndMoreInfo()} Suggestion: ${suggestionObj.body}` }
  }

  async function completeSuggestion(args) {
    if (args.length < 2 || !isNumber(args[0]) || !/^approved|denied|completed|declined$/.test(args[1])) {
      return { success: false, reply: `Invalid Syntax! Example: "${prefix}complete {id} {action} {reason}"` }
    }
    let [id, action] = [+args[0], args[1].toLowerCase()]
    let reason = () => {
      switch (args.slice(2).join(' ')) {
        case '':
          return '(No Message Provided)'
        default:
          return args.slice(2).join(' ')
      }
    }
    if (!(await fs.exists(`suggestions/active/${id}.json`))) {
      return { success: false, reply: `There is no suggestion with that id!` }
    }
    let suggestionDetails = await fs.readJson(`suggestions/active/${id}.json`)
    let suggestionObj = {
      user: suggestionDetails.user,
      id: suggestionDetails.id,
      date: suggestionDetails.date,
      state: suggestionDetails.state,
      body: suggestionDetails.suggestion
    }
    if (action == 'approved' || action == 'completed') {
      await fs.writeJson(`suggestions/active/${id}.json`, { user: suggestionDetails.user, actionBy: userlow, id: id, date: suggestionDetails.date, dateApproved: new Date().addHours(-5).toISOString(), state: 'Approved/Finished', suggestion: suggestionDetails.suggestion, reason: reason() })
      await fs.rename(`suggestions/active/${id}.json`, `suggestions/approved/${id}.json`)
      client.whisper(suggestionObj.user, `[Suggestion Update] Your suggestion with the ID ${suggestionDetails.id} was ${action}! Notes: ${reason()}`)
      await axios.post(`https://supinic.com/api/bot/reminder?auth_user=${process.env['SUPI_USER_AUTH']}&auth_key=${process.env['SUPI_USERKEY_AUTH']}&username=${suggestionDetails.user}&private=true&text=[VyprBot Update] Your suggestion on VyprBot with the ID ${suggestionDetails.id} was ${action}! Notes: ${reason()}`)
      return { success: true, reply: `Successfully notified @${suggestionDetails.user} and ${action} suggestion ${suggestionDetails.id}.` }
    }
    else if (action == 'denied' || action == 'declined') {
      await fs.writeJson(`suggestions/active/${id}.json`, { user: suggestionDetails.user, actionBy: userlow, id: id, date: suggestionDetails.date, dateApproved: new Date().addHours(-5).toISOString(), state: 'Denied', suggestion: suggestionDetails.suggestion, reason: reason() })
      await fs.rename(`suggestions/active/${id}.json`, `suggestions/denied/${id}.json`)
      client.whisper(suggestionObj.user, `[Suggestion Update] Your suggestion with the ID ${suggestionDetails.id} was ${action}! Notes: ${reason()}`)
      await axios.post(`https://supinic.com/api/bot/reminder?auth_user=${process.env['SUPI_USER_AUTH']}&auth_key=${process.env['SUPI_USERKEY_AUTH']}&username=${suggestionDetails.user}&private=true&text=[VyprBot Update] Your suggestion on VyprBot with the ID ${suggestionDetails.id} was ${action}! Notes: ${reason()}`)
      return { success: true, reply: `Successfully notified @${suggestionDetails.user} and ${action} suggestion ${suggestionDetails.id}.` }
    }
    else {
      return { success: false, reply: `There was an error somewhere in that command!` }
    }
  }

  if (command === 'suggest') {
    newSuggestion(args).then(suggestionData => {
      client.me(channel, `${user} --> ${suggestionData.reply}`)
    })
  }

  if (command === 'unset') {
    unsetSuggestion(args).then(suggestionData => {
      client.me(channel, `${user} --> ${suggestionData.reply}`)
    })
  }

  if (command === 'complete') {
    checkAdmin(userlow).then(isAdmin => {
      if (isAdmin) {
        completeSuggestion(args).then(suggestionData => {
          client.me(channel, `${user} --> ${suggestionData.reply}`)
        })
      }
      else {
        client.me(channel, `${user} --> You don't have the required permission to use that command! Required: Admin.`)
      }
    })
  }

  if (command === 'check') {
    checkSuggestion(args).then(suggestionData => {
      client.me(channel, `${user} --> ${suggestionData.reply}`)
    })
  }

  // Permission System

  async function permitSystem(args) {
    if (!await checkAdmin(userlow) && userlow !== channel) {
      return { success: false, reply: `You don't have the required permission to perform that command! Required: Channel Broadcaster or Above.` }
    }
    if (args.length == 0 || !/^add$|^remove$|^delete$|^check$/i.test(args[0]) || !args[1]) {
      return { success: false, reply: `Invalid Syntax! Example: "${prefix}permit {add|delete|remove|check} {user}"` }
    }
    var existingPerms = await db.get(`${channel}permits`)
    if (!existingPerms || existingPerms == '') {
      await db.set(`${channel}permits`, channel)
      existingPerms = await db.get(`${channel}permits`)
    }
    let [permitsArray, action, userPermit] = [existingPerms.split(' '), args[0].toLowerCase(), args[1].replace('@', '').toLowerCase()]
    if (action == 'add') {
      if (permitsArray.indexOf(userPermit) > -1) { return { success: false, reply: 'That user is alredy permitted in this channel!' } }
      permitsArray.push(userPermit)
      db.set(`${channel}permits`, permitsArray.join(' '))
      return { success: true, reply: `Successfully permitted @${userPermit} in #${channel}` }
    }
    else if (action == 'delete' || action == 'remove') {
      if (permitsArray.indexOf(userPermit) < 0) { return { success: false, reply: 'That user is not permitted in this channel!' } }
      permitsArray.splice(permitsArray.indexOf(userPermit), 1)
      db.set(`${channel}permits`, permitsArray.join(' '))
      return { success: true, reply: `Successfully removed @${userPermit}'s permissions in #${channel}` }
    }
    else if (action == 'check') {
      if (permitsArray.indexOf(userPermit) < 0) { return { success: true, reply: `@${userPermit} is not permitted in #${channel}!❌` } }
      else { return { success: true, reply: `@${userPermit} is permitted in #${channel}!✅` } }
    }
    else {
      return { success: true, reply: `An unknown error has occured. Please report this by suggesting this so I can fix it.` }
    }
  }

  async function checkPermitted(user) {
    if (await checkAdmin(user)) { return 'true' }
    if (user == channel) { return 'true' }
    var existingPerms = await db.get(`${channel}permits`)
    if (!existingPerms) { return 'false' }
    let permitsArray = existingPerms.split(' ')
    return permitsArray.indexOf(user) > -1 ? true : false
  }

  if (command === 'permit') {
    permitSystem(args).then(permitDetails => {
      client.me(channel, `${user} --> ${permitDetails.reply}`)
    })
  }

  // Countdowns

  if (command === 'christmas') {
    today = new Date().addHours(-5)
    xmas = new Date("December 25, 2022");

    let timeUntilChristmas = humanizeDuration(xmas - today, { units: ["d", "h", "m", "s"], round: true, largest: 2, delimiter: " and " })

    if (today.toDateString() === 'Sat Dec 25 2022') {
      client.me(channel, `YAAAY peepoSnow It's finally that time of year! Merry Christmas! peepoSnow YAAAY`);
    }
    else {
      client.me(channel, `${user} --> There is ${timeUntilChristmas} (EST +5) left until christmas! peepoSnow 🎄`);
    }
  }

  if (command === '2022' || command === 'newyears') {
    today = new Date().addHours(-5)
    newYears = new Date("January 01, 2023");

    let timeUntilNewYears = humanizeDuration(newYears - today, { units: ["d", "h", "m", "s"], round: true, largest: 2, delimiter: " and " })

    if (today.toDateString() === 'Sat Jan 01 2023') {
      client.me(channel, `YAAAY 🎉🎈🎊 HAPPY NEW YEARS! 🎊🎈🎉YAAAY`);
    }
    else {
      client.me(channel, `${user} --> There is ${timeUntilNewYears} (EST +5) left until new years! PauseChamp 🎊🎈🎉`);
    }
  }

  // General Commands - Not Self Promo or attached to me

  if (command === '7tvemote') {
    client.me(channel, `${user} --> https://7tv.app/emotes?sortBy=popularity&page=0&query=${args[0]}`);
  }

  if (command === '7tvuser') {
    client.me(channel, `${user} --> https://7tv.app/users/${defaultname}`);
  }

  if (command === '8ball') {
    axios.get(`https://8ball.delegator.com/magic/JSON/${args.join(' ')}`)
      .then((response) => {
        let ballresults = response.data
        client.me(channel, `${user} --> The 8-Ball says: ${ballresults.magic.answer}`);
      });
  }

  if (command === 'acctage' || command === 'accountage') {
    getUserData(args).then(userData => {
      client.me(channel, `${user} --> Date: ${userData.creationDate} | Time since then: ${userData.timeSinceCreation}.`)
    })
  }

  if (command === 'adblock') {
    client.me(channel, `${user} --> TriHard UBLOCK FILTERS: https://bit.ly/3j36lKB CHROME STORE: https://bit.ly/30hvkTF`);
  }

  if (command === 'alogs') {
    console.log({ command, args });
    client.me(channel, `${user} --> https://logs.apulxd.ga/?channel=${defaultname2}&username=${defaultname}`)
  }

  async function getBirthdayDetails(name) {
    let bday = await db.get(`${name}bday`)
    if (bday === null) {
      return null
    }
    else {
      let d = new Date()
      let day = d.getDate()
      let month = d.getMonth() + 1
      let year = d.getFullYear()
      let today = `${month}` + '/' + `${day}` + '/' + `${year}`
      let userBirthdayYear = bday.replace(/(160[0-9]|16[1-9][0-9]|1[7-9][0-9]{2}|[2-9][0-9]{3})/, year)

      let currentage = Math.floor((new Date(today).getTime() - new Date(`${bday}`).getTime()) / 31556952000)
      let turningage = Math.floor(((new Date(today).getTime() - new Date(`${bday}`).getTime()) / 31556952000)) + 1

      let differencebetweendays = new Date(userBirthdayYear) - new Date(today)
      if (differencebetweendays < 0) {
        let timeuntilbday = 31536000000 + differencebetweendays
        let humanizedtime = humanizeDuration(timeuntilbday, { units: ["mo", "d", "h", "m", "s"], round: true, largest: 2 })
        let userBirthdayYear = bday.replace(/(160[0-9]|16[1-9][0-9]|1[7-9][0-9]{2}|[2-9][0-9]{3})/g, year + 1)
        return {
          bday,
          differencebetweendays,
          currentage,
          turningage,
          userBirthdayYear,
          humanizedtime
        }
      }
      else {
        let humanizedtime = humanizeDuration(differencebetweendays, { units: ["mo", "d", "h", "m", "s"], round: true, largest: 2 })
        return {
          bday,
          differencebetweendays,
          currentage,
          turningage,
          userBirthdayYear,
          humanizedtime
        }
      }
    }

  }

  if (command === 'birthday' || command === 'bday') {
    if (!args[0]) {
      getBirthdayDetails(userlow).then(function(birthday) {
        if (birthday === null) {
          client.me(channel, `${user} --> Before using this command, you must set your birthday with the "${prefix}set birthday" command. It must be in M/D/YYYY or MM/DD/YYYY format. Examples: "${prefix}set birthday 8/14/2005", "${prefix}set birthday 10/16/2004" or "${prefix}set birthday 9/11/1973".`)
        }
        else {
          client.me(channel, `${user} --> You were born on ${birthday.bday} and are ${birthday.currentage} years old. You will be turning ${birthday.turningage} on ${birthday.userBirthdayYear} which is in ${birthday.humanizedtime}. PauseChamp ⌚`)
        }
      })
    }
    else {
      let userLookup = `${args[0].toLowerCase().replace('@', '').replace(' ', '')}`
      getBirthdayDetails(userLookup).then(function(value) {
        let birthday = value
        if (userLookup == 'vyprbot') {
          client.me(channel, `${user} --> I was made on November 12, 2021 which was ${humanizeDuration(timeDelta('November 12 2021'), { delimiter: ' and ', round: true, largest: 2 })} ago.`)
        }
        else if (!birthday) {
          client.me(channel, `${user} --> User ${args[0]} hasn't set their birthday! Get them to set it and retry this command! Hint: "${prefix}set birthday".`)
        }
        else {
          client.me(channel, `${user} --> ${args[0]} was born on ${birthday.bday}, they're ${birthday.currentage} years old, and will be turning ${birthday.turningage} on ${birthday.userBirthdayYear} which is in ${birthday.humanizedtime}. PauseChamp ⌚`)
        }
      })
    }
  }

  if (command === 'bm') {
    db.get("bisiomoments").then(function(value) {
      let origbm = `${value}`
      let plusonebm = +origbm + +1
      db.set("bisiomoments", `${plusonebm}`);
      client.me(channel, (`${user} --> There has been ${plusonebm} bisio moments donkJAM`)
      )
    })
  }

  if (command === 'bot') {
    axios.get(`https://api.ivr.fi/twitch/resolve/${args[0]}`)
      .catch(err => { client.me(channel, `${user}, That user doesn't exist!`) })
      .then((response) => {
        let userdata = response.data
        if (`${userdata.bot}` === 'true') {
          client.me(channel, `${user} --> User "${userdata.displayName}" is a verified bot! ✅`)
        }
        else {
          client.me(channel, `${user} --> User "${userdata.displayName}" is NOT a verified bot! ❌`)
        }
      });
  }

  if (command === 'botlist') {
    client.me(channel, `${user} --> MrDestructoid BOP https://files.darkvypr.com/DarkVyprBotList.txt`);
  }

  if (command === 'bttvemote') {
    client.me(channel, `${user} --> https://betterttv.com/emotes/shared/search?query=${args[0]}`);
  }

  if (command === 'cat') {
    axios.get('https://api.thecatapi.com/v1/images/search')
      .then((response) => {
        let catimage = response.data[0]
        client.me(channel, `${user} --> Random cat: ${catimage.url}`);
      });
  }

  if (command === 'catfact') {
    axios.get('https://catfact.ninja/fact?max_length=300')
      .then((response) => {
        let catfact = response.data
        client.me(channel, `${user} --> ${catfact.fact}`);
      });
  }

  if (command === 'channels') {
    client.me(channel, `${user} --> A list of the channels I am in are available here: http://channels.darkvypr.com/ | Use "${prefix}request" for help on getting the bot in your chat!`);
  }

  if (command === 'chatterino') {
    client.me(channel, `${user} --> Homies: http://chatterinohomies.darkvypr.com Dankerino: http://dankerino.darkvypr.com`);
  }

  if (command === 'clear') {
    checkPermitted(userlow).then(isPermitted => {
      if (isPermitted) {
        if (!isNumber(args[0]) || args[0] > 100 || args[0] < 1) {
          client.me(channel, `${user} --> Invalid Syntax! The max clear is 100, and the format should be: "${prefix}clear {amount}"!`);
        }
        else {
          for (let i = args[0]; i--;)
            client.privmsg(channel, `/clear`);
        }
      }
      else {
        client.me(channel, `${user} --> You aren't permitted to use that command. Get the broadcaster to permit you and try again!`)
      }
    })
  }

  if (command === 'coin') {
    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }
    let flipresult = getRandomInt(2)
    if (flipresult === 2) {
      client.me(channel, `${user} --> Result of your coin flip: "Heads!" (Yes)`);
    }
    else {
      client.me(channel, `${user} --> Result of your coin flip: "Tails!" (No)`);
    }
  }

  if (command === 'coomer') {
    client.me(channel, `${user} --> https://i.imgur.com/PqQCXC3.png`);
  }

  async function covid(user, args) {
    var isUser
    var isSender
    var location
    if (!args[0]) {
      let userLocation = await db.get(`${user}time`)
      isUser = true
      isSender = true
      location = userLocation
    }
    else if (args[0].startsWith('@')) {
      let userLocation = await db.get(`${args[0].toLowerCase().replace('@', '')}time`)
      isUser = true
      isSender = false
      location = userLocation
    }
    else {
      isUser = false
      location = encodeURIComponent(args.join(' '))
    }
    if (!location && isSender) { return { success: false, reply: `Before using this command, you must set your location with the ${prefix}set location command. Example: "${prefix}set location lasalle ontario", "${prefix}set location springfield virginia" or "${prefix}set location stockholm sweden". More info: https://darkvypr.com/commands` } }
    if (!location && !isSender) { return { success: false, reply: `That user hasn't set their location! Get them to set it and retry! Hint: "${prefix}set location"` } }
    let locationData = await axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${location}&apiKey=${process.env['GEOCODING_KEY']}`)
    if (!locationData.data.items[0]) { return { success: false, reply: `The location provided to the geocoding API was invalid.` } }
    let country = locationData.data.items[0].address.countryCode
    try {
      let covidStats = await axios.get(`https://coronavirus-monitor-v2.p.rapidapi.com/coronavirus/latest_stat_by_country.php?country=${country}`, { "headers": { "x-rapidapi-host": "coronavirus-monitor-v2.p.rapidapi.com", "x-rapidapi-key": process.env['COVID_KEY'] } })
      if (isSender) { return { success: true, reply: `COVID-19 stats for ${covidStats.data.country} (Updated: ${humanizeDuration(timeDelta(covidStats.data.latest_stat_by_country[0].record_date), { round: true, largest: 2 })} ago) | Total Cases: ${covidStats.data.latest_stat_by_country[0].total_cases} | Total Deaths: ${covidStats.data.latest_stat_by_country[0].total_deaths} | Total Recoveries: ${covidStats.data.latest_stat_by_country[0].total_recovered} | New Cases: ${covidStats.data.latest_stat_by_country[0].new_cases} | New Deaths: ${covidStats.data.latest_stat_by_country[0].new_deaths} | Critical Condition: ${covidStats.data.latest_stat_by_country[0].serious_critical} | Total Tested: ${covidStats.data.latest_stat_by_country[0].total_tests}` } }
      if (!isSender && isUser) { return { success: true, reply: `@${args[0].replace('@', '')}'s COVID-19 stats (${locationData.data.items[0].address.countryName}) (Updated: ${humanizeDuration(timeDelta(covidStats.data.latest_stat_by_country[0].record_date), { round: true, largest: 2 })} ago) | Total Cases: ${covidStats.data.latest_stat_by_country[0].total_cases} | Total Deaths: ${covidStats.data.latest_stat_by_country[0].total_deaths} | Total Recoveries: ${covidStats.data.latest_stat_by_country[0].total_recovered} | New Cases: ${covidStats.data.latest_stat_by_country[0].new_cases} | New Deaths: ${covidStats.data.latest_stat_by_country[0].new_deaths} | Critical Condition: ${covidStats.data.latest_stat_by_country[0].serious_critical} | Total Tested: ${covidStats.data.latest_stat_by_country[0].total_tests}` } }
      return { success: true, reply: `COVID-19 stats for ${covidStats.data.country} (Updated: ${humanizeDuration(timeDelta(covidStats.data.latest_stat_by_country[0].record_date), { round: true, largest: 2 })} ago) | Total Cases: ${covidStats.data.latest_stat_by_country[0].total_cases} | Total Deaths: ${covidStats.data.latest_stat_by_country[0].total_deaths} | Total Recoveries: ${covidStats.data.latest_stat_by_country[0].total_recovered} | New Cases: ${covidStats.data.latest_stat_by_country[0].new_cases} | New Deaths: ${covidStats.data.latest_stat_by_country[0].new_deaths} | Critical Condition: ${covidStats.data.latest_stat_by_country[0].serious_critical} | Total Tested: ${covidStats.data.latest_stat_by_country[0].total_tests}` }
    } catch (e) {
      return { success: false, reply: `There was an error getting the COVID-19 data! The country is most likely invalid/not tracked.` }
    }
  }

  if (command === 'covid') {
    covid(userlow, args).then(covidStats => {
      client.me(channel, `${user} --> ${covidStats.reply}`)
    })
  }

  if (command === 'dance') {
    client.me(channel, `${user} elisDance https://i.darkvypr.com/dance.mp4`);
    client.me(channel, `elisDance`);
  }

  async function define(user, args) {
    if (!args[0]) { return { success: false, reply: "Please provide a phrase or word to define!" } }
    const phraseCheck = args.join(' ').match(/index(:|=)(\d+)/i)
    var index = 0
    if (phraseCheck) { index = +phraseCheck[2]; args.splice(args.indexOf(phraseCheck[0]), 1) }
    let definition = await axios.get(`https://dictionaryapi.com/api/v3/references/collegiate/json/${args.join(' ')}?key=${process.env['DICTIONARY_KEY']}`)
    if (definition.data.length == 0) { return { success: false, reply: "dictionaryapi.com does not have a definition for that word!" } }
    if (!definition.data[0].meta) { return { success: false, reply: "dictionaryapi.com does not have a definition for that word!" } }
    if (index > definition.data.length - 1) { return { success: false, reply: `The index you specified is larger than the amount of results. Please use an index less than or equal to ${definition.data.length - 1}.` } }
    definition = definition.data[index]
    let meaning = definition.shortdef[0] ? definition.shortdef[0] : "No definition available."
    let [word, offensive, literaryDevice] = [definition.meta.id.replace(/:\d+/g, ''), definition.meta.offensive, definition.fl]
    return { success: true, reply: `Word: ${word} | Literary Device: ${literaryDevice} | Offensive: ${offensive} | Meaning: ${truncate(meaning, 450)}` }
  }

  if (command === 'define') {
    define(user, args).then(definition => {
      client.me(channel, `${user} --> ${definition.reply}`)
    })
  }

  if (command === 'derick') {
    client.me(channel, `${user} --> https://i.imgur.com/Uo9K0xk.png`);
  }

  if (command === 'dogjam') {
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
    client.me(channel, `dogJAM`);
  }

  async function echo(user, args) {
    if (!args[0]) { return { success: false, reply: `Please provide a message to say.` } }
    if (!await checkAdmin(user)) { return { success: false, reply: `You must be a VyprBot admin to use that command!` } }
    const channelCheck = args.join(' ').match(/in(:|=)\w+/i)
    var targetChannel = channel
    if (channelCheck) { targetChannel = channelCheck[0].replace(/in(:|=)/i, ''); args.splice(args.indexOf(channelCheck[0]), 1) }
    if (targetChannel == 'all') {
      for (let i = 0; i < channelOptions.length; i++) {
        channelsay = channelOptions[i]
        client.privmsg(channelsay, args.join(' '))
      }
      return
    }
    client.privmsg(targetChannel, args.join(' '))
  }

  if (command === 'echo') {
    echo(userlow, args).then(echoReply => {
      echoReply ? client.me(channel, echoReply.reply) : client.privmsg(channel, '/me ')
    })
  }

  if (command === 'elischat') {
    if (channel === 'darkvypr' || `${userlow}` === 'darkvypr') {
      client.me(channel, `${user} --> https://i.imgur.com/J3qKoiZ.png`);
    }
    else {
      client.me(channel, `GearScare This command is only available in DarkVypr's chat ${user}`);
    }
  }

  if (command === 'emotes') {
    getUserData(userlow, args).then(userData => {
      if (!userData.obj) { client.me(channel, `${user} --> ${userData.reply}`); return }
      client.me(channel, `${user} --> https://emotes.raccatta.cc/twitch/${userData.obj.name}`)
    })
  }

  if (command === 'eval') {
    checkAdmin(userlow).then(isAdmin => {
      if (isAdmin) {
        let result = (code) => {
          try {
            return eval(code)
          }
          catch (err) {
            return err
          }
        }
        client.privmsg(channel, `${user} --> ${result(args.join(' '))}`)
      }
      else {
        client.me(channel, `${user} --> You dont have permission to use that command! Required: Admin`);
      }
    })
  }

  if (command === 'farmer') {
    client.me(channel, `${user} --> MrDestructoid Farmer: http://miner.darkvypr.com`);
    client.me(channel, `${user} --> Setup: https://youtu.be/0VkM7NOZkuA`);
  }

  if (command === 'ffzemote') {
    client.me(channel, `${user} --> https://www.frankerfacez.com/emoticons/?q=${args[0]}&sort=count-desc&days=0`);
  }

  if (command === 'filerepo') {
    client.me(channel, `${user} --> http://filerepo.darkvypr.com`);
  }

  if (command === 'filters') {
    client.me(channel, `${user} --> http://settings.darkvypr.com`);
  }

  if (command === 'firstlog') {
    axios.get(`https://api.ivr.fi/logs/firstmessage/${logschannel}/${defaultname}`)
      .catch(err => { client.me(channel, `${user} --> That channel or user doesn't exist, or is not logged!`) })
      .then((response) => {
        let firstmessage = response.data
        client.me(channel, `${user} --> ${firstmessage.user}'s first message in #${logschannel} was "${firstmessage.message}" and that was sent ${firstmessage.time} ago.`)
      });
  }

  async function getFollowage(user, channel) {
    let followDetails = await axios.get(`https://api.ivr.fi/twitch/subage/${user}/${channel}`)
    let followUser = followDetails.data.username
    let followChannel = followDetails.data.channel
    let followedAt = followDetails.data.followedAt
    let timeSinceFollow = humanizeDuration(new Date(followDetails.data.followedAt) - new Date(), { units: ["y", "mo", "d", "h", "m", "s"], round: true, largest: 3 })
    let obj = {
      followUser: followUser,
      followChannel: followChannel,
      followedAt: followedAt,
      timeSinceFollow: timeSinceFollow
    }
    return obj
  }

  if (command === 'followage' || command === 'fa') {
    var userLookup = `${args[0]}`
    if (!args[0])
      var userLookup = userlow

    var channelLookup = `${args[1]}`
    if (!args[1])
      var channelLookup = channel

    getFollowage(userLookup, channelLookup)
      .catch(err => { client.me(channel, `${user} --> There was an error getting that user's followage! Make sure that the account exists, and you have spelt the channel and username correctly!`) })
      .then(function(followage) {
        if (followage.followedAt === null) {
          client.me(channel, `${user} --> @${followage.followUser} is not following @${followage.followChannel}`)
        }
        else {
          client.me(channel, `${user} --> @${followage.followUser} followed @${followage.followChannel} on ${dateFormat(new Date(followage.followedAt), 'fullDate')} which was ${followage.timeSinceFollow} ago.`)
        }
      })
  }

  if (command === 'followbutton') {
    client.me(channel, `${user} --> https://i.darkvypr.com/follow.mp4`);
  }

  if (command === 'followers') {
    client.me(channel, `${user} --> Visit: https://twitch-tools.rootonline.de/followerlist_viewer.php?channel=${defaultname} for a list of people that follow ${defaultname} NOTED`);
  }

  if (command === 'following') {
    client.me(channel, `${user} --> Visit: https://www.twitchfollowing.com/?${defaultname} for a list of people that ${defaultname} is following.`);
  }

  if (command === 'fuck') {
    let fuckMSG = 'peepoShy'
    if (!args[0]) { client.me(channel, `${user} --> Please..... provide a user to fuck....... Example: "${prefix}fuck {user} {optional message}"`); return }
    let recipient = args[0]
    if (args[1]) { args.shift(); fuckMSG = args.join(' ') }
    client.me(channel, `${user} fucks ${recipient} in the ass: ${fuckMSG} 🍆🍑`)
  }

  if (command === 'gnkiss') {
    let kissMSG = 'FumoTuck 💓'
    if (!args[0]) { client.me(channel, `${user} --> Please provide a user to gnkiss. Example: "${prefix}gnkiss {user} {optional message}"`); return }
    let recipient = args[0]
    if (args[1]) { args.shift(); kissMSG = args.join(' ') }
    client.me(channel, `${user} tucks ${recipient} to bed and gently kisses their cheek: ${kissMSG} 💤`)
  }

  if (command === 'hare') {
    client.me(channel, `${user} --> https://i.imgur.com/3Sor3Wg.jpg`);
  }

  if (command === 'harrison1') {
    client.me(channel, `${user} --> https://i.imgur.com/zn65wUW.png`);
  }

  if (command === 'harrison2') {
    client.me(channel, `${user} --> https://i.imgur.com/niKaezK.mp4`);
  }

  if (command === 'harrison3') {
    client.me(channel, `${user} --> https://i.imgur.com/8aT41ls.png`);
  }

  if (command === 'hug') {
    client.me(channel, `${user} --> picks ${args[0]} up off of their feet and squeezes them tight ${hugmsg} 💗`);
  }

  if (command === 'imagerepo') {
    client.me(channel, `${user} --> http://imagerepo.darkvypr.com`);
  }

  if (command === 'info' || command === 'user') {
    getUserData(userlow, args).then(userData => {
      client.me(channel, `${user} --> ${userData.reply}`)
    })
  }

  if (command === 'ip') {
    axios.get(`http://api.ipstack.com/${args[0]}?access_key=${process.env['IP_KEY']}`)
      .then((response) => {
        let ipresults = response.data
        client.me(channel, `${user} --> Results for "${ipresults.ip}": Type: "${ipresults.type}" | Location ( ${ipresults.location.country_flag_emoji} ): "${ipresults.city}, ${ipresults.region_name}, ${ipresults.country_name}"`);
      });
  }

  if (command === 'kaf1') {
    client.me(channel, `${user} --> https://i.imgur.com/J99I0oD.mp4`);
  }

  if (command === 'kaf2') {
    client.me(channel, `${user} --> https://i.imgur.com/kKuxUBW.png`);
  }

  if (command === 'kanye') {
    axios.get('https://api.kanye.rest/')
      .then((response) => {
        let kanyequote = response.data
        client.me(channel, `${user} --> Random Kanye Quote: "${kanyequote.quote}"`);
      });
  }

  if (command === 'kiss') {
    let kissMSG = 'FumoKiss 💞'
    if (!args[0]) { client.me(channel, `${user} --> Please provide a user to kiss. Example: "${prefix}kiss {user} {optional message}"`); return }
    let recipient = args[0]
    if (args[1]) { args.shift(); kissMSG = args.join(' ') }
    client.me(channel, `${user} kisses ${recipient} on the cheek: ${kissMSG} 💋`)
  }

  if (command === 'kitten') {
    client.me(channel, `${user} --> https://i.imgur.com/3djjWjE.mp4 Whos my good wittwe~ kitten? I~ I am~ *shits* Uh oh~ ^w^ Kitten did you just make a poopy~ woopy~ iny youw panytsy~ wanytsys~? ^w^ I... I did daddy~ Im sowwy~ ^w^ ^w^ ^w^ Its ok kitten, i wike my kitten a wittwe *shits* *whispews* stinyky~ winyky~`);
  }

  if (command === 'list' || command === 'cutelist') {
    client.me(channel, `${user} --> https://cutelist.github.io/#/ SoCute`);
  }

  if (command === 'logs') {
    console.log({ command, args });
    client.me(channel, `${user} --> https://logs.ivr.fi/?channel=${logschannel}&username=${defaultname}`)
  }

  if (command === 'marbles') {
    client.me(channel, `${user} --> https://www.youtube.com/watch?v=IHZQ-23jrps NekoProud`);
  }

  async function mathCommand(args) {
    if (args.length == 0) {
      return { success: false, reply: 'Please provide an equation to evaluate. | Examples: https://i.darkvypr.com/mathjs.png' }
    }
    try {
      let answer = await axios.get(`https://api.mathjs.org/v4/?expr=${encodeURIComponent(args.join(''))}`)
      return { success: true, reply: `Solution: ${answer.data}` }
    } catch (err) { return { success: false, reply: `There was an error evaluating that problem. | Examples: https://i.darkvypr.com/mathjs.png | ${err}` } }
  }

  if (command === 'math') {
    mathCommand(args).then(answer => {
      client.me(channel, `${user} --> ${answer.reply} `)
    })
  }

  if (command === 'minglee') {
    client.me(channel, `${user} --> https://www.youtube.com/watch?v=OjNpRbNdR7E`);
    client.me(channel, `MingLee 🇨🇳 GLORY TO THE CCP`);
  }

  if (command === 'modlookup') {
    client.me(channel, `MODS https://modlookup.3v.fi/u/${defaultname} some channels won't be listed as they aren't tracked ${user}.`);
  }

  if (command === 'nam') {
    for (let i = 2; i--;)
      client.privmsg(channel, `AYAYA --> 👉 🚪 NammersOut elisDance NammersOut`);
  }

  if (command === 'neko') {
    if (channel === 'darkvypr') {
      client.me(channel, `${user} --> https://i.darkvypr.com/neko.mp4`);
    }
    else {
      client.me(channel, `${user} --> GearScare This command is only available in darkvypr's chat!`);
    }
  }

  async function getNews(user, args) {
    if (!args[0]) { return { success: false, reply: `Please input a query for the bot to use. For example: "${prefix}news covid omicron".` } }
    let news = await axios.get(`https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/search/NewsSearchAPI?q=${args.join()}&pageNumber=1&pageSize=10&autoCorrect=true&safeSearch=false&withThumbnails=false&fromPublishedDate=null&toPublishedDate=null`, { "headers": { "x-rapidapi-host": "contextualwebsearch-websearch-v1.p.rapidapi.com", "x-rapidapi-key": process.env['NEWS_KEY'] } })
    if (news.data.value.length == 0) { return { success: false, reply: `No articles found for that query!` } }
    let newsObj = {
      date: news.data.value[0].datePublished,
      dateString: humanizeDuration(timeDelta(news.data.value[0].datePublished), { round: true, largest: 2, delimiter: ' and ' }),
      news: truncate(news.data.value[0].description, 450)
    }
    if (checkPhrase(newsObj.news)) { return { success: false, reply: `cmonNep ???` } }
    return { success: true, reply: newsObj.news + ` (Published: ${newsObj.dateString} ago) ` }
  }

  if (command === 'news') {
    getNews(user, args).then(news => {
      client.me(channel, `${user} --> ${news.reply}`)
    })
  }

  if (command === 'noah') {
    client.me(channel, `${user} --> https://i.imgur.com/Dn0CjkF.png`);
  }

  if (command === 'numbers') {
    client.me(channel, `${user} --> NOTED https://darkvypr.com/numbers`);
  }

  if (command === 'oaks' || command === 'oaksemotes') {
    client.me(channel, `${user} --> peepoGiggles https://i.darkvypr.com/oaks-emotes.mp4`)
  }

  async function ocr(args) {
    if (args.length == 0) {
      return { success: false, reply: `Please provide a direct link to an image, and optionally a language. Valid Languages: https://i.darkvypr.com/ocr_languages.png | Usage: "${prefix}ocr {image} lang:{optional: source_language_code}" | Examples: "${prefix}ocr https://i.darkvypr.com/ocr_example.png" or "${prefix}ocr https://i.darkvypr.com/ocr_example_2.png lang:fre"` }
    }
    let language = 'eng'
    if (args[1]) {
      if (/(language|lang)(=|:)(ara|bul|chs|cht|hrv|cze|dan|eng|dut|fin|fre|ger|gre|hun|kor|ita|jpn|pol|por|rus|slv|spa|swe|tur)/i.test(args[1])) {
        language = args[1].replace(/(language|lang)(=|:)/, '')
      }
      else {
        return { success: false, reply: `That wasn't a valid target language! Valid Languages: https://i.darkvypr.com/ocr_languages.png | Usage: "${prefix}ocr {image} lang:{optional: source_language_code}" | Examples: "${prefix}ocr https://i.darkvypr.com/ocr_example.png" or "${prefix}ocr https://i.darkvypr.com/ocr_example_2.png lang:fre"` }
      }
    }
    let ocrResult = await axios.get(`https://api.ocr.space/parse/imageurl?apikey=${process.env['OCR_KEY']}&url=${args[0]}&language=${language}&scale=true&isTable=true`)
    if (!ocrResult.data.ParsedResults || !ocrResult.data.ParsedResults[0].ParsedText || ocrResult.data.ParsedResults[0].ParsedText == '') {
      return { success: false, reply: `No text was found in that image. If you are using an alternate language, please specify that. Valid Languages: https://i.darkvypr.com/ocr_languages.png | Usage: "${prefix}ocr {image} lang:{optional: source_language_code}" | Examples: "${prefix}ocr https://i.darkvypr.com/ocr_example.png" or "${prefix}ocr https://i.darkvypr.com/ocr_example_2.png lang:fre"` }
    }
    if (checkPhrase(ocrResult.data.ParsedResults[0].ParsedText)) {
      return { success: false, reply: `cmonNep ?????` }
    }
    return { success: true, reply: ocrResult.data.ParsedResults[0].ParsedText.replace(/(\t|\r\n|\n|\r)/gm, '') }
  }

  if (command === 'ocr') {
    ocr(args).then(ocrResult => {
      client.me(channel, `${user} --> ${ocrResult.reply}`)
    })
  }

  async function rPFP() {
    let chatter = await axios.get(`http://decapi.me/twitch/random_user/${channel}`)
    let randomChatterData = await axios.get(`https://api.ivr.fi/twitch/resolve/${chatter.data}`)
    if (args.indexOf('user:true') > -1) {
      return { chatter: chatter.data, pfp: randomChatterData.data.logo, reply: `User: ${chatter.data} | Profile Picture: ${randomChatterData.data.logo}` }
    }
    return { chatter: chatter.data, pfp: randomChatterData.data.logo, reply: `Random Profile Picture: ${randomChatterData.data.logo}` }
  }

  if (command === 'rpfp') {
    rPFP().then(pfp => {
      client.me(channel, `${user} --> ${pfp.reply}`)
    })
  }

  if (command === 'pfp') {
    getUserData(args).then(value => {
      client.me(channel, `${user} --> ${value.obj.pfp}`)
    })
  }

  async function pickRamdom(args) {
    if (args.length < 2) {
      return { randomElement: null, reply: `Please specify at least 2 items to pick from!` }
    }
    return { randomElement: args[+getRandomInt(args.length) - 1], reply: args[+getRandomInt(args.length) - 1] }
  }

  if (command === 'pick') {
    pickRamdom(args).then(pickData => {
      client.me(channel, `${user} --> ${pickData.reply}`)
    })
  }

  if (command === 'picsbeforedisaster') {
    client.me(channel, `${user} --> https://i.imgur.com/1hKKEx0.png`);
  }

  if (command === 'pings') {
    client.me(channel, `${user} --> DinkDonk https://darkvypr.com/pings`);
  }

  var plopArray = ["jfVieNQ.png", "PAjqrhD.png", "dwMMtSD.png", "EMixIJq.png", "BX5GXFO.png", "4PUBRLf.png", "g7vIKbC.png", "gBoJaoD.png", "vKyWwTE.png", "tPNuJ4r.png", "McBKJwY.png"]

  if (/^plop[\d+]$/.test(command)) {
    client.me(channel, `${user} --> https://i.imgur.com/${plopArray[+command.replace('plop', '') - 1]}`)
  }

  if (command == 'plop') {
    client.me(channel, `${user} --> Random Plop message: https://i.imgur.com/${plopArray[getRandomInt(plopArray.length)]}`)
  }

  if (command === 'plopcolour') {
    client.me(channel, `${user} --> #94DCCC`);
  }

  if (command === 'pm') {
    db.get("plopmoments").then(function(value) {
      let origpm = `${value}`
      let plusonepm = +origpm + +1
      db.set("plopmoments", `${plusonepm}`);
      client.me(channel, (`${user} --> There has been ${plusonepm} plop moments donkJAM`)
      )
    })
  }

  async function qrCode(args) {
    if (args.length == 0 || !/read|create/.test(args[0]) || !args[1]) {
      return { success: false, reply: `Invalid Syntax! Example to make a QR code: "${prefix}${command} create {text/data}", Example to read a QR code: "${prefix}${command} read {text/data}"` }
    }
    let action = args[0]
    args.shift()
    let content = encodeURIComponent(args.join(' '))
    let code = /^read$/i.test(action) ? await axios.get(`http://api.qrserver.com/v1/read-qr-code/?fileurl=${content}`) : /^create$/i.test(action) ? `http://api.qrserver.com/v1/create-qr-code/?data=${content}` : null
    if (code.data) {
      console.log(code.data[0].data)
      console.log(code.data[0].error)
      return { success: null, reply: code.data[0].symbol[0].data ? code.data[0].symbol[0].data : code.data[0].symbol[0].error ? code.data[0].symbol[0].error : 'An Unknown Error Has Occured!' }
    }
    return { success: true, reply: code }
  }

  if (command === 'qr' || command === 'qrcode') {
    qrCode(args).then(qrCode => {
      client.me(channel, `${user} --> ${qrCode.reply}`)
    })
  }

  if (command === 'query') {
    axios.get(`https://api.wolframalpha.com/v1/result?i=${args.join(' ')}&appid=${process.env['WOLFRAM_KEY']}`)
      .catch(err => { client.me(channel, `${user} --> Wolfram|Alpha did not understand your question! PANIC`) })
      .then((response) => {
        if (checkPhrase(response.data)) {
          client.me(channel, `${user} --> cmonNep ??????`);
        }
        else {
          client.me(channel, `${user} Results: ${response.data}`);
        }
      })
  }

  if (command === 'request') {
    client.me(channel, `${user} --> If you would like the bot in your chat, you can use the "${prefix}suggest" command. Example: "${prefix}suggest I would like the bot in my channel."`);
  }

  if (command === 'say') {
    if (checkPhrase(`${args.join(' ')}`)) {
      client.me(channel, `👥 cmonNep ?????`);
    }
    else {
      client.me(channel, `👥 ${args.join(' ')}`);
    }
  }

  if (command === 'shop' || command === 'store') {
    client.me(channel, `${user} --> A list of all purchasable items can be found here: https://darkvypr.com/shop`);
  }

  if (command === 'spam') {
    checkPermitted(userlow).then(isPermitted => {
      if (isPermitted) {
        if (!isNumber(args[0]) || !args[1]) {
          client.me(channel, `${user} --> Invalid Syntax! Example: "${prefix}spam {amount} {phrase}"`)
        }
        else if (args[0] > 80) {
          client.me(channel, `${user} --> The max spam is 80!`)
        }
        else if (!checkPhrase(`${args.join(' ')}`)) {
          let spamAmount = args[0]
          args.shift()
          for (let i = spamAmount; i--;)
            client.privmsg(channel, ` 󠀀 ${args.join(' ')}`)
        }
        else {
          client.me(channel, `${user} --> cmonNep ??????`)
        }
      }
      else {
        client.me(channel, `${user} --> You aren't permitted to use that command. Get the broadcaster to permit you and try again!`)
      }
    })
  }

  if (command === 'shibe' || command === 'shiba') {
    axios.get(`http://shibe.online/api/shibes?count=1&httpsUrls=true`)
      .then((response) => {
        let shiberesult = response.data
        client.me(channel, `${user} --> Random Shibe: ${shiberesult}`);
      });
  }

  async function songData(user, args) {
    if (!args[0]) { return { success: false, reply: `Please provide a song name to look up.` } }
    const searchInput = args.join(' ').match(/index(:|=)(\d+)/i)
    var index = 0
    if (searchInput) { index = +searchInput[2]; args.splice(args.indexOf(searchInput[0]), 1) }
    let songInfo = await axios.get(`http://api.musixmatch.com/ws/1.1/track.search?apikey=${process.env['MUSICXMATCH_KEY']}&q_track=${encodeURIComponent(args.join(' '))}&s_track_rating=DESC`)
    let tracks = songInfo.data.message.body.track_list
    if (tracks.length == 0) { return { success: false, reply: `No songs could be found using that phrase.` } }
    if (index > tracks.length - 1) { return { success: false, reply: `The song index you specified is larger than the amount of results. Please use an index less than or equal to ${tracks.length - 1}.` } }
    var flags = []
    if (tracks[index].track.explicit == 1) { flags.push('Explicit') }
    if (tracks[index].track.has_lyrics == 1) { flags.push('Has_Lyrics') }
    if (tracks[index].track.has_subtitles == 1) { flags.push('Has_Subtitles') }
    if (tracks[index].track.restricted == 1) { flags.push('Restricted') }
    return {
      success: true,
      reply: `Artist: ${tracks[index].track.artist_name} | Album: ${tracks[index].track.album_name} | Track: ${tracks[index].track.track_name} | Flags: ${flags.join(', ')}`
    }
  }

  if (command === 'song' || command === 'music') {
    songData(user, args).then(songData => {
      client.me(channel, `${user} --> ${songData.reply}`)
    })
  }

  if (command === 'specs') {
    client.me(channel, `${user} --> https://darkvypr.com/specs NekoProud`);
  }

  if (command === '🥪') {
    client.me(channel, `${user} --> https://www.youtube.com/shorts/7XkP11Pomuc`);
  }

  async function getUserTime(user, args) {
    var isUser
    var isSender
    var location
    if (!args[0]) {
      let userLocation = await db.get(`${user}time`)
      isUser = true
      isSender = true
      location = userLocation
    }
    else if (args[0].startsWith('@')) {
      let userLocation = await db.get(`${args[0].toLowerCase().replace('@', '')}time`)
      isUser = true
      isSender = false
      location = userLocation
    }
    else {
      isUser = false
      location = encodeURIComponent(args.join(' '))
    }
    if (location == null && isSender) {
      return { success: false, case: 'sender_unsetlocation', reply: `Before using this command, you must set your location with the ${prefix}set location command. Example: "${prefix}set location lasalle ontario", "${prefix}set location springfield virginia" or "${prefix}set location stockholm sweden". More info: https://darkvypr.com/commands` }
    }
    if (location == null && !isSender) {
      return { success: false, case: 'user_unsetlocation', reply: `That user hasn't set their location! Get them to set it and retry! Hint: "${prefix}set location"` }
    }
    let coordinates = await axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${location}&apiKey=${process.env['GEOCODING_KEY']}`)
    if (!coordinates.data.items[0]) {
      return { success: false, case: 'invalid_locaiton', reply: `The location provided to the API was invalid.` }
    }
    var [latitude, longitude, location] = [coordinates.data.items[0].position.lat, coordinates.data.items[0].position.lng, coordinates.data.items[0].title]
    let time = await axios.get(`https://api.bigdatacloud.net/data/timezone-by-location?latitude=${latitude}&longitude=${longitude}&key=${process.env['TIME_KEY']}`)
    let [dateTime, timeZone, utcOffset, fullTimeZone] = [new Date(time.data.localTime).toISOString(), time.data.effectiveTimeZoneShort, time.data.utcOffset, time.data.displayName]
    var currentTime = {
      date: dateFormat(dateTime, "fullDate"),
      time: dateFormat(dateTime, "h:MM:ss TT"),
    }
    if (isSender) {
      return {
        currentTime,
        reply: `${location} is in ${fullTimeZone}. It's currently ${currentTime.time}, ⌚ and the date is ${currentTime.date}. 📅`
      }
    }
    else if (!isSender && isUser) {
      return {
        currentTime,
        reply: `${args[0].toLowerCase()} is in ${fullTimeZone} (${location}). It's currently ${currentTime.time}, ⌚ and the date is ${currentTime.date}. 📅`
      }
    }
    else {
      return {
        currentTime,
        reply: `${location} is in ${timeZone}. It's currently ${currentTime.time}, ⌚ and the date is ${currentTime.date}. 📅`
      }
    }
  }

  if (command === 'time') {
    getUserTime(userlow, args).then(time => {
      client.me(channel, `${user} --> ${time.reply}`)
    })
  }

  async function getTwitter(user, args) {
    var isUser
    var isSender
    var account
    if (!args[0]) {
      let userTwitter = await db.get(`${user}twitter`)
      isUser = true
      isSender = true
      account = userTwitter
    }
    else if (args[0].startsWith('@')) {
      let userTwitter = await db.get(`${args[0].toLowerCase().replace('@', '')}twitter`)
      isUser = true
      isSender = false
      account = userTwitter
    }
    else {
      isUser = false
      account = encodeURIComponent(args.join(' '))
    }
    if (account == null && isSender) {
      return { success: false, reply: `Before using this command, you must set your Twitter account with the ${prefix}set twitter command. Example: "${prefix}set twitter darkvyprr" or "${prefix}set twitter @coolvisio". More info: https://darkvypr.com/commands` }
    }
    if (account == null && !isSender) {
      return { success: false, reply: `That user hasn't set their Twitter account! If you would like to check a specific Twitter account, don't include the @ symbol.` }
    }
    let tweetData = await axios.get(`https://decapi.me/twitter/latest/${account.toLowerCase().replace('@', '')}?include_replies=true&url=true&howlong=true`)
    return { success: false, reply: tweetData.data }
  }

  if (command === 'twitter') {
    getTwitter(userlow, args).then(tweetResult => {
      client.me(channel, `${user} --> ${tweetResult.reply}`)
    })
  }

  async function getSubage(userlow, args) {
    let [targetUser, targetChannel] = [args[0] ? args[0].toLowerCase().replace('@', '') : userlow, args[1] ? args[1].toLowerCase().replace('@', '') : channel]
    try {
      let subDetails = await axios.get(`https://api.ivr.fi/twitch/subage/${targetUser}/${targetChannel}`)
      let subData = subDetails.data
      let [hidden, user, channel, subStatus, subType, subTier, giftData, months, streak] = [subData.hidden, subData.username, subData.channel, subData.subscribed, subData.meta.type, subData.meta.tier, subData.meta.gift, subData.cumulative.months, subData.streak.months]
      let remainingOnActiveSub = humanizeDuration(timeDelta(subData.meta.endsAt), { units: ["d", "h", "m", "s"], round: true, largest: 2, delimiter: ' and ' })
      let timeSinceSubEnded = humanizeDuration(timeDelta(subData.cumulative.end), { units: ["d", "h", "m", "s"], round: true, largest: 2, delimiter: ' and ' })
      if (hidden) { return { success: true, reply: `@${user} has hidden their subscription status, or the target channel (#${channel}) is not an affiliate!` } }
      if (months == 0) { return { success: true, reply: `@${user} has never been subbed to @${channel}.` } }
      if (!subStatus && months != 0) { return { success: true, reply: `@${user} isn't currently subbed to @${channel} but they have previously. They were subbed for ${months} month(s) and their sub expired ${timeSinceSubEnded} ago.` } }
      if (subTier == 'Custom') { return { success: true, reply: `@${user} is currently subbed to @${channel} with a permanent sub! They have been subbed for ${months} month(s).` } }
      if (subTier == 3 && !subData.meta.endsAt) { return { success: true, reply: `@${user} is currently subbed to @${channel} with a permanent sub! They have been subbed for ${months} month(s).` } }
      if (subType == 'paid') { return { success: true, reply: `@${user} is currently subbed to @${channel} with a tier ${subTier} paid sub! They have been subbed for ${months} month(s) and are on a ${streak} month streak. Their sub expires/renews in ${remainingOnActiveSub}.` } }
      if (subType == 'prime') { return { success: true, reply: `@${user} is currently subbed to @${channel} with a free Twitch Prime sub! They have been subbed for ${months} month(s) and are on a ${streak} month streak. Their sub expires/renews in ${remainingOnActiveSub}.` } }
      if (subType == 'gift') { return { success: true, reply: `@${user} is currently subbed to @${channel} with a tier ${subTier} gift sub by ${giftData.name}! They have been subbed for ${months} month(s) and are on a ${streak} month streak. Their sub expires/renews in ${remainingOnActiveSub}.` } }
    }
    catch (err) {
      return { success: false, reply: `${err.response.data.error}` }
    }
  }

  if (command === 'subage' || command === 'sa') {
    getSubage(userlow, args).then(subData => {
      client.me(channel, `${user} --> ${subData.reply}`)
    })
  }

  async function translate(user, args) {
    if (!args[0]) { return { success: false, reply: "Please provide a phrase or word to translate! Example: https://i.darkvypr.com/translate-example.png" } }
    const toCheck = args.join(' ').match(/to(:|=)([a-zA-Z])+/i)
    const fromCheck = args.join(' ').match(/from(:|=)([a-zA-Z])+/i)
    var to = 'en'
    var from = ' '
    if (toCheck && toCheck[0].length > 5) { to = isoConv(capitalizeEachWord(toCheck[0].replace(/to(:|=)/i, ''))); args.splice(args.indexOf(toCheck[0]), 1) }
    if (fromCheck && fromCheck[0].length > 5) { from = isoConv(capitalizeEachWord(fromCheck[0].replace(/from(:|=)/i, ''))); args.splice(args.indexOf(fromCheck[0]), 1) }
    try {
      let translation = await axios.get(`https://api-free.deepl.com/v2/translate?auth_key=${process.env['TRANSLATE_KEY']}&text=${encodeURIComponent(args.join(' '))}&target_lang=${to}&source_lang=${from}`)
      translation = translation.data.translations[0]
      to = isoConv(to)
      from = isoConv(translation.detected_source_language.toLowerCase())
      return { success: true, reply: `(${from} > ${to}) Translation: ${translation.text}` }
    } catch (e) {
      return { success: true, reply: `Error! ${e.response.data.message}` }
    }
  }

  if (command === 'translate') {
    translate(userlow, args).then(translation => {
      client.me(channel, `${user} --> ${translation.reply}`)
    })
  }

  if (command === 'uid') {
    getUserData(userlow, args).then(userData => {
      client.me(channel, `${user} --> UID: ${userData.obj.uid}`)
    })
  }

  async function urbanDictionary(user, args) {
    if (!args[0]) { return { success: false, reply: "Please provide a phrase to look up!" } }
    const phraseCheck = args.join(' ').match(/index(:|=)(\d+)/i)
    var index = 0
    if (phraseCheck) { index = +phraseCheck[2]; args.splice(args.indexOf(phraseCheck[0]), 1) }
    let urbanResult = await axios.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(args.join(' '))}`, { timeout: 10000 })
    urbanResult = urbanResult.data.list
    if (urbanResult.length == 0) { return { success: false, reply: "Urban Dictionary does not have a definition for that word!" } }
    if (index > urbanResult.length - 1) { return { success: false, reply: `The definition index you specified is larger than the amount of results. Please use an index less than or equal to ${urbanResult.length - 1}.` } }
    return {
      success: true,
      reply: `(${urbanResult.length - index - 1} other definitions) (${urbanResult[index].thumbs_up} upvotes) - ${urbanResult[index].definition.replace(/\[|\]/gim, '').replace(/n:/, '').replace(/\"\r\n\r\n/gim, ' ').replace(/\b\\b/gim, '').replace(/(\r\n|\n|\r)/gim, " ")} - Example: ${urbanResult[index].example.replace(/\[|\]/gim, '').replace(/\"\r\n\r\n/gim, ' ').replace(/\b\\b/gim, '').replace(/(\r\n|\n|\r)/gim, " ")}`
    }
  }

  if (command === 'urban') {
    urbanDictionary(userlow, args).then(urban => {
      client.me(channel, `${user} --> ${urban.reply}`)
    })
  }

  if (command === 'vanish') {
    client.me(channel, `𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙`);
  }

  if (command === 'vei') {
    client.me(channel, `veiSway`);
    client.me(channel, `veiSway`);
    client.me(channel, `veiSway`);
    client.me(channel, `veiSway`);
    client.me(channel, `veiSway`);
  }

  if (command === 'vm') {
    db.get("vyprmoments").then(function(value) {
      let origvm = `${value}`
      let plusonevm = +origvm + +1
      db.set("vyprmoments", `${plusonevm}`);
      client.me(channel, (`${user} --> There has been ${plusonevm} vypr moments peepoShy`)
      )
    })
  }

  if (command === 'vyprcolour') {
    client.me(channel, `${user} --> #FF7FD3`);
  }

  if (command === 'vypr') {
    client.me(channel, `https://clips.twitch.tv/AbstemiousRacyTigerHeyGirl-ccTj4SmQPNDRhjmP or https://i.darkvypr.com/darkviper.mp4`);
  }

  async function getWeather(user, args) {
    var isUser
    var isSender
    var location
    if (!args[0]) {
      let userLocation = await db.get(`${user}time`)
      isUser = true
      isSender = true
      location = userLocation
    }
    else if (args[0].startsWith('@')) {
      let userLocation = await db.get(`${args[0].toLowerCase().replace('@', '')}time`)
      isUser = true
      isSender = false
      location = userLocation
    }
    else {
      isUser = false
      location = encodeURIComponent(args.join(' '))
    }
    if (location == null && isSender) {
      return { success: false, case: 'sender_unsetlocation', reply: `Before using this command, you must set your location with the ${prefix}set location command. Example: "${prefix}set location lasalle ontario", "${prefix}set location springfield virginia" or "${prefix}set location stockholm sweden". More info: https://darkvypr.com/commands` }
    }
    if (location == null && !isSender) {
      return { success: false, case: 'user_unsetlocation', reply: `That user hasn't set their location! Get them to set it and retry! Hint: "${prefix}set location"` }
    }
    let coordinates = await axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${location}&apiKey=${process.env['GEOCODING_KEY']}`)
    if (!coordinates.data.items[0]) {
      return { success: false, case: 'invalid_locaiton', reply: `The location provided to the API was invalid.` }
    }
    var [latitude, longitude, location] = [coordinates.data.items[0].position.lat, coordinates.data.items[0].position.lng, coordinates.data.items[0].title]
    let weather = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=hourly,daily&units=metric&appid=${process.env['WEATHER_KEY']}`)
    let [condition, icon, description] = [weather.data.current.weather[0].main, weather.data.current.weather[0].icon, weather.data.current.weather[0].description]
    let [celcius, fahrenheit] = [(+weather.data.current.temp).toFixed(1), (+weather.data.current.temp * 1.8 + 32).toFixed(1)]
    let [feelsLikeCelcius, feelsLikeFahrenheit] = [(+weather.data.current.feels_like).toFixed(1), (+weather.data.current.feels_like * 1.8 + 32).toFixed(1)]
    let [windSpeed, windGust] = [(+weather.data.current.wind_speed * 3.6).toFixed(1), (+weather.data.current.wind_gust * 3.6).toFixed(1)]
    let [humidity, clouds, alerts] = [+weather.data.current.humidity, +weather.data.current.clouds, weather.data.alerts]
    let [sunrise, sunset, currentTime] = [new Date(+weather.data.current.sunrise * 1000), new Date(+weather.data.current.sunset * 1000), new Date()]
    let [rain, snow] = [weather.data.current.rain, weather.data.current.snow]
    let weatherAlert = () => {
      switch (alerts) {
        case undefined:
          return 'None'
          break
        default:
          return weather.data.alerts[0].event + ' ⚠️'
      }
    }
    let precipitation = () => {
      if (!rain && !snow) {
        return ''
      }
      else if (rain && snow) {
        return `It's raining at a rate of ${rain['1h']} mm/hr, and snowing at a rate of ${snow['1h']} mm/hr. 🌧️🌨️`
      }
      else if (rain && !snow) {
        return `It's raining at a rate of ${rain['1h']} mm/hr. ☔ 🌧️`
      }
      else {
        return `It's snowing at a rate of ${snow['1h']} mm/hr. ☔ 🌧️`
      }
    }
    let windGusts = () => {
      switch (windGust) {
        case 'NaN':
          return 'No wind gust data. 💨'
          break
        default:
          return `with wind gusts of up to ${windGust} km/h. 💨`
      }
    }
    let conditionString = () => {
      switch (condition) {
        case 'Clear':
          return 'with clear skies. ☀️ ⛱️'
          break
        case 'Thunderstorm':
          return `with a ${description}. ⛈️ ☔`
          break
        case 'Drizzle':
          return 'with slight rain. 🌦️ 🌧️'
          break
        case 'Rain':
          return `with ${description}. 🌧️ ☔`
          break
        case 'Snow':
          return `with ${description}. 🌨️ ❄️`
          break
        case 'Clouds':
          return `with ${description}. ☁️ 🌥️`
          break
        default:
          return `with a special weather event: ${condition}. 📊 🔍`
      }
    }
    let sunState = () => {
      if (currentTime < sunrise) {
        let sunriseIn = humanizeDuration(sunrise - currentTime, { units: ["h", "m"], round: true, delimiter: " and " })
        return `Sun rises in ${sunriseIn}. 🌅`
      }
      else if (currentTime < sunset) {
        let sunsetIn = humanizeDuration(sunset - currentTime, { units: ["h", "m"], round: true, delimiter: " and " })
        return `Sun sets in ${sunsetIn}. 🌇`
      }
      else {
        let sunriseIn = humanizeDuration(sunrise.addHours(24) - currentTime, { units: ["h", "m"], round: true, delimiter: " and " })
        return `Sun rises in ${sunriseIn}. 🌅`
      }

    }
    let weatherObj = {
      success: true,
      location: location,
      temp: { c: celcius + '°C', f: fahrenheit + '°F', fC: feelsLikeCelcius + '°C', fF: feelsLikeFahrenheit + '°F' },
      precipitation: precipitation(),
      wind: { speed: windSpeed + ' km/h', gust: windGusts() },
      sun: sunState(),
      humidity: humidity + '% 💧',
      condition: conditionString(),
      clouds: clouds + '% ☁️',
      weatherAlert: weatherAlert()
    }
    if (isSender) {
      return {
        weatherObj,
        reply: `The temperature in ${weatherObj.location} is ${weatherObj.temp.c} (${weatherObj.temp.f}) feels like ${weatherObj.temp.fC} (${weatherObj.temp.fF}) ${weatherObj.condition} ${weatherObj.precipitation} The wind speed is ${weatherObj.wind.speed}, ${weatherObj.wind.gust} ${weatherObj.sun} Humidity: ${weatherObj.humidity} Cloud Coverage: ${weatherObj.clouds} Alert: ${weatherObj.weatherAlert}`
      }
    }
    else if (!isSender && isUser) {
      return {
        weatherObj,
        reply: `The temperature in ${args[0]}'s location (${weatherObj.location}) is ${weatherObj.temp.c} (${weatherObj.temp.f}) feels like ${weatherObj.temp.fC} (${weatherObj.temp.fF}) ${weatherObj.condition} ${weatherObj.precipitation} The wind speed is ${weatherObj.wind.speed}, ${weatherObj.wind.gust} ${weatherObj.sun} Humidity: ${weatherObj.humidity} Cloud Coverage: ${weatherObj.clouds} Alert: ${weatherObj.weatherAlert}`
      }
    }
    else {
      return {
        weatherObj,
        reply: `The temperature in ${weatherObj.location} is ${weatherObj.temp.c} (${weatherObj.temp.f}) feels like ${weatherObj.temp.fC} (${weatherObj.temp.fF}) ${weatherObj.condition} ${weatherObj.precipitation} The wind speed is ${weatherObj.wind.speed}, ${weatherObj.wind.gust} ${weatherObj.sun} Humidity: ${weatherObj.humidity} Cloud Coverage: ${weatherObj.clouds} Alert: ${weatherObj.weatherAlert}`
      }
    }
  }

  if (command === 'weather') {
    getWeather(userlow, args).then(weather => {
      client.me(channel, `${user} --> ${weather.reply}`)
    })
  }

  async function emoteLookup(user, args) {
    if (!args[0]) {
      return { success: false, reply: 'Please provide an emote or emote code/id to look up.' }
    }
    const isEmoteID = isNumber(args[0]) || /emotesv2_[a-z0-9]{32}/.test(args[0])
    try {
      const emoteData = await axios.get(`https://api.ivr.fi/v2/twitch/emotes/${args[0]}?id=${String(isEmoteID)}`)
      if (emoteData.data.emoteType == 'GLOBALS') {
        return { success: true, reply: `${emoteData.data.emoteCode} (ID: ${emoteData.data.emoteID}) is a ${emoteData.data.emoteAssetType.toLowerCase()} global Twitch emote. Emote Link: ${emoteData.data.emoteURL.replace('dark/1.0', 'dark/3.0')}` }
      }
      if (emoteData.data.emoteType == 'SUBSCRIPTIONS') {
        return { success: true, reply: `${emoteData.data.emoteCode} (ID: ${emoteData.data.emoteID}) is a ${emoteData.data.emoteAssetType.toLowerCase()} Tier ${emoteData.data.emoteTier} subscriber emote to the channel @${emoteData.data.channelName} ( @${emoteData.data.channelLogin} ). Emote Link: ${emoteData.data.emoteURL.replace('dark/1.0', 'dark/3.0')}` }
      }
      if (emoteData.data.emoteType == 'FOLLOWER') {
        return { success: true, reply: `${emoteData.data.emoteCode} (ID: ${emoteData.data.emoteID}) is a ${emoteData.data.emoteAssetType.toLowerCase()} follower emote to the channel @${emoteData.data.channelName} ( @${emoteData.data.channelLogin} ). Emote Link: ${emoteData.data.emoteURL.replace('dark/1.0', 'dark/3.0')}` }
      }
      if (emoteData.data.emoteType == 'SMILIES') {
        return { success: true, reply: `${emoteData.data.emoteCode} (ID: ${emoteData.data.emoteID}) is a ${emoteData.data.emoteAssetType.toLowerCase()} Twitch smiley emote. Emote Link: ${emoteData.data.emoteURL.replace('dark/1.0', 'dark/3.0')}` }
      }
    }
    catch (err) {
      return { success: false, reply: `Error Code: ${err.response.data.statusCode} | Error: ${err.response.data.message}` }
    }
  }

  if (command === 'weit' || command === 'whatemoteisit') {
    emoteLookup(user, args).then(emoteData => {
      client.me(channel, `${user} --> ${emoteData.reply}`)
    })
  }

  if (command === 'wyr') {
    axios.get(`https://would-you-rather-api.abaanshanid.repl.co/`)
      .then((response) => {
        let wyrresult = response.data
        client.me(channel, `${user} --> ${wyrresult.data} `);
      });
  }

  if (command === 'xqcow1') {
    client.me(channel, `${user} --> https://i.imgur.com/OGFxdzB.png`);
  }

  if (command === 'xqcow2') {
    client.me(channel, `${user} --> https://i.imgur.com/d8KqqiD.png`);
  }

  if (command === 'yag') {
    client.me(channel, `${user} --> idk this yagnesh person, but they are making a shit first impression to me xqcMood TeaTime so cringe wtf`);
  }

  if (command === 'ym') {
    db.get("yagmoments").then(function(value) {
      let origym = `${value}`
      let plusoneym = +origym + +1
      db.set("yagmoments", `${plusoneym}`);
      client.me(channel, (`${user} --> There has been ${plusoneym} yag moments peepoChat`)
      )
    })
  }

  if (command === 'zamnkeyword') {
    client.me(channel, `${user} --> https://files.darkvypr.com/backups/zamn.txt ZAMN`);
  }

  if (command === 'zhandy') {
    client.me(channel, `${user} --> https://i.imgur.com/gFaJUwS.png`);
  }

  // Loyalty System

  async function cooldownReset(user) {
    if (cdrcooldown.has(userlow)) {
      return {
        success: false,
        case: "cdr_is_on_cooldown",
        beforeReset: null,
        afterReset: null,
        reply: "Your cdr is on cooldown. Wait 2 hours in between each reset."
      }
    }
    else if (!huntNammersCooldown.has(userlow)) {
      return {
        success: false,
        case: "user_is_not_on_cooldown",
        beforeReset: null,
        afterReset: null,
        reply: 'You are not on any cooldowns! Use "${prefix}hunt" to get some nammers.'
      }
    }
    let userNammers = await db.get(`${user}nammers`)
    if (userNammers < 10) {
      return {
        success: false,
        case: "not_enough_nammers",
        beforeReset: +userNammers,
        afterReset: null,
        reply: `You need at least 20 nammers for a reset! You have ${userNammers}.`
      }
    }
    else {
      huntNammersCooldown.delete(user)
      cdrcooldown.add(user)
      setTimeout(() => { cdrcooldown.delete(userlow) }, 7200000)
      db.set(`${user}nammers`, +userNammers - 10)
      return {
        success: true,
        case: null,
        beforeReset: +userNammers,
        afterReset: +userNammers - 10,
        reply: `Your cooldown has been reset! (-10 nammers) | You now have ${+userNammers - 10} nammer(s). | Good luck! NekoPray (2 hr cooldown).`
      }
    }
  }

  if (command === 'cdr') {
    cooldownReset(userlow).then(cdrData => {
      if (!cdrData.success) {
        client.me(channel, `${user} --> ${cdrData.reply}`)
      }
      else {
        client.me(channel, `${user} --> ${cdrData.reply}`)
      }
    })
  }

  async function huntNammers(user) {
    let [userNammers, randomInt] = [await db.get(`${user}nammers`), Math.floor(Math.random() * 50) - 10]
    let huntMessage = (randomInt) => {
      switch (true) {
        case (randomInt >= 50):
          return `You take control of a city full of nammers, and send all ${randomInt} of its citizens to your prison.🏙️`
        case (randomInt >= 40):
          return `You raid Chaz, a police-free autonomous zone, and return with ${randomInt} nammers.🚧`
        case (randomInt >= 30):
          return `You visit a village of nammers, and come out with ${randomInt}.🛖`
        case (randomInt >= 20):
          return `You raid a local restaurant, and find ${randomInt} nammers.🍕`
        case (randomInt >= 10):
          return `You enter a small hut, and find a group of ${randomInt} nammers.👥`
        case (randomInt > 0):
          return `You find and capture a small huddle of ${randomInt} nammer(s).👤`
        case (randomInt == 0):
          return `You didn't find any nammers, better luck next time. PoroSad`
        default:
          return `You leave the prison gates cracked open, and ${randomInt * -1} nammer(s) unknowingly escape! PANIC`
      }
    }
    if (userNammers == null) {
      await db.set(`${user}nammers`, 50)
      return {
        success: true,
        case: 'new_user',
        beforeHunt: null,
        afterHunt: 50,
        reply: "You are a new user! Here's 50 nammers to get you started."
      }
    }
    else if (+userNammers + +randomInt < 0) {
      await db.set(`${user}nammers`, 0)
      return {
        success: true,
        case: 'lost_more_than_balance',
        beforeHunt: +userNammers,
        afterHunt: 0,
        reply: huntMessage(randomInt)
      }
    }
    else {
      let afterHunt = +userNammers + +randomInt
      await db.set(`${user}nammers`, afterHunt)
      return {
        success: true,
        case: 'regular',
        beforeHunt: +userNammers,
        afterHunt: afterHunt,
        reply: huntMessage(randomInt)
      }
    }
  }

  if (command === 'hunt') {
    if (huntNammersCooldown.has(userlow)) {
      client.me(channel, `${user} --> Please wait 1 hour in between hunting! GearScare ⛔`)
    }
    else {
      huntNammers(userlow).then(function(huntResult) {
        if (huntResult.case == 'new_user') {
          client.me(channel, `${user} --> ${huntResult.reply} | You now have 50 nammers | 1 hour cooldown`)

          huntNammersCooldown.add(userlow)
          setTimeout(() => { huntNammersCooldown.delete(userlow) }, 3600000)
        }
        else {
          client.me(channel, `${user} --> ${huntResult.reply} | You now have ${huntResult.afterHunt} nammer(s) | 1 hour cooldown`)

          huntNammersCooldown.add(userlow)
          setTimeout(() => { huntNammersCooldown.delete(userlow) }, 3600000)
        }
      })
    }
  }

  function killMessage(amount) {
    if (+amount >= 1 && +amount < 20) {
      return `You line ${amount} nammer(s) up in front of a firing squad,`
    }
    else if (+amount >= 20 && +amount < 50) {
      return `You send ${amount} nammer(s) off to "training" (a volcano),`
    }
    else if (+amount >= 50 && +amount < 80) {
      return `You drop a car on ${amount} nammer(s) killing them,`
    }
    else if (+amount >= 80 && +amount < 120) {
      return `You stare ${amount} nammer(s) in the eyes as you stab them one-by-one,`
    }
    else if (+amount >= 120 && +amount < 200) {
      return `You lethally inject ${amount} nammer(s) with rat poison,`
    }
    else if (+amount >= 200 && +amount < 250) {
      return `You fatally electrocute ${amount} nammer(s) one-by-one, make the others watch,`
    }
    else if (+amount >= 250 && +amount < 1000) {
      return `You make ${amount} nammer(s) jump off of a building in a single file line,`
    }
    else {
      return `You enlist ${amount} nammer(s) into the VietNaM war,`
    }
  }

  if (command === 'kill') {
    db.get(`${userlow}nammers`).then(function(value) {
      let nammers = `${value}`
      if (nammers === null || +nammers === 0) {
        client.me(channel, (`${user} --> GearScare ⛔ You don't have any nammers to kill! Use "${prefix}hunt" to get more.`))
      }
      else {
        if (+`${args[0]}` > +`${nammers}`) {
          client.me(channel, (`${user} --> MenheraCry You try to kill ${args[0]} nammer(s), but realize that you only have ${nammers} nammer(s), and give up.`))
        }
        else {
          let killamount = `${args[0]}`
          const regex = new RegExp('^([1-9]|[1-9][0-9]{1,6})$');
          testForNumber = `${regex.test(killamount)}`

          if (testForNumber === 'true') {
            let afterkill = +nammers - +killamount
            db.set(`${userlow}nammers`, afterkill)
            client.me(channel, (`${user} --> NekoProud 🔪 ${killMessage(killamount)} and are left with ${afterkill} nammer(s).`))
          }
          else if (`${args[0]}` === 'all') {
            db.set(`${userlow}nammers`, 0)
            client.me(channel, (`${user} --> GearScare 🔪 ${killMessage(nammers)} and now have nothing.`))
          }
          else {
            client.me(channel, (`${user} --> Please enter a valid amount of nammers to kill KannaSip`))
          }
        }
      }
    })
  }

  async function checkNammers(user) {
    let userNammers = await db.get(`${user}nammers`)
    if (userNammers == null) {
      return {
        success: true,
        case: 'user_not_found',
        nammers: null
      }
    }
    else {
      return {
        success: true,
        case: null,
        nammers: userNammers
      }
    }
  }

  if (command === 'nammers') {
    if (args.length == 0) {
      checkNammers(userlow).then(nammers => {
        if (nammers.case == 'user_not_found') {
          client.me(channel, `${user} --> You have never hunted! Use "${prefix}hunt" to get more nammers, and retry this command.`)
        }
        else {
          client.me(channel, `${user} --> You have ${nammers.nammers} nammer(s). Use "${prefix}hunt" to get more.`)
        }
      })
    }
    else {
      checkNammers(args[0].toLowerCase().replace('@', '')).then(nammers => {
        if (nammers.case == 'user_not_found') {
          client.me(channel, `${user} --> That user has never hunted!`)
        }
        else {
          client.me(channel, `${user} --> That user has ${nammers.nammers} nammer(s).`)
        }
      })
    }
  }

  async function giveNammers(sender, recipient, amount) {
    if (!recipient || !amount) {
      return {
        success: false,
        reason: 'syntax'
      }
    }
    else {
      let senderNammers = await db.get(`${sender.toLowerCase()}nammers`)
      let recipientNammers = await db.get(`${recipient.toLowerCase().replace('@', '')}nammers`)
      let checkIfNumber
      if (senderNammers == null) {
        return {
          success: false,
          reason: "sender doesn't exist"
        }
      }
      else if (recipientNammers == null) {
        return {
          success: false,
          reason: "recipient doesn't exist"
        }
      }

      else if (+senderNammers < +amount) {
        return {
          success: false,
          balance: +senderNammers,
          reason: 'tried to give too many'
        }
      }
      else if (sender == recipient.toLowerCase()) {
        return {
          success: false,
          reason: 'self give'
        }
      }
      else if (!isNumber(amount) && amount !== 'all') {
        return {
          success: false,
          reason: 'nan'
        }
      }
      else if (amount == 'all') {
        return {
          success: true,
          case: 'all',
          giveAmount: +senderNammers,
          senderAmountAfterGive: 0,
          recipientAmountAfterGive: +recipientNammers + +senderNammers
        }
      }
      else if (isNumber(amount)) {
        return {
          success: true,
          case: 'amount',
          giveAmount: amount,
          senderAmountAfterGive: +senderNammers - amount,
          recipientAmountAfterGive: +recipientNammers + +amount
        }
      }
      else {
        return {
          success: false,
          reason: 'unknown'
        }
      }
    }
  }

  if (command === 'give') {
    let [sender, recipient, amount] = [userlow, `${args[0]}`, args[1]]
    giveNammers(sender, recipient, amount).then(function(giveData) {
      if (giveData.success === false && giveData.reason === 'syntax') {
        client.me(channel, `${user} --> Please provide an amount to give away and a user to give to. Example: "${prefix}give darkvypr 100".`)
      }
      else if (giveData.success === false && giveData.reason === "sender doesn't exist") {
        client.me(channel, `${user} --> You aren't in the database! Use "${prefix}hunt" to get some nammers, and retry this command.`)
      }
      else if (giveData.success === false && giveData.reason === "recipient doesn't exist") {
        client.me(channel, `${user} --> That user doesn't exist in the database.`)
      }
      else if (giveData.success === false && giveData.reason === 'tried to give too many') {
        client.me(channel, `${user} --> You don't have enough nammers! You tried to give away ${amount} nammer(s) but only have ${giveData.balance}.`)
      }
      else if (giveData.success === false && giveData.reason === 'self give') {
        client.me(channel, `${user} --> You can't give nammers to yourself!`)
      }
      else if (giveData.success === false && giveData.reason === 'nan') {
        client.me(channel, `${user} --> That wasn't a valid amount to give away! Example: "${prefix}give darkvypr 100".`)
      }
      else if (giveData.success === true && giveData.case === 'all') {
        db.set(`${sender}nammers`, 0)
        db.set(`${recipient.toLowerCase().replace('@', '')}nammers`, giveData.recipientAmountAfterGive)
        client.me(channel, `${user} --> You successfully gave all ${giveData.giveAmount} of your nammers to ${recipient.toLowerCase()}. You now have 0 nammers, and ${recipient.toLowerCase()} now has ${giveData.recipientAmountAfterGive} nammer(s).`)
      }
      else if (giveData.success === true && giveData.case === 'amount') {
        db.set(`${sender}nammers`, giveData.senderAmountAfterGive)
        db.set(`${recipient.toLowerCase().replace('@', '')}nammers`, giveData.recipientAmountAfterGive)
        client.me(channel, `${user} --> You successfully gave ${giveData.giveAmount} of your nammers to ${recipient.toLowerCase()}. You now have ${giveData.senderAmountAfterGive} nammer(s), and ${recipient.toLowerCase()} now has ${giveData.recipientAmountAfterGive} nammer(s).`)
      }
      else if (giveData.success === false && giveData.reason === 'unknown') {
        client.me(channel, `${user} --> An unknown error has occurred! Please report this with the "${prefix}suggest" command. Please include screenshots and a short description of what triggered the event so I can fix it.`)
      }
      else {
        client.me(channel, `${user} --> An unknown error has occurred! Please report this with the "${prefix}suggest" command. Please include screenshots and a short description of what triggered the event so I can fix it.`)
      }
    })
  }

  if (command === 'gamble' || command === 'roulette') {
    if (!args[0]) {
      client.me(channel, (`${user} --> PANIC Please enter an amount of nammers to gamble with!`))
    }
    else {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
        if (nammers === null || +nammers === 0) {
          client.me(channel, (`${user} --> You don't have any nammers to gamble with! Type !hunt to get more.`))
        }
        else {
          let gambleamount = `${args[0]}`
          const regex = new RegExp('^([1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])$');
          testForNumber = `${regex.test(gambleamount)}`

          if (testForNumber === 'true') {
            if (+nammers < +gambleamount) {
              client.me(channel, (`${user} --> PANIC You don't have enough nammers! Get more by using !hunt.`))
            }
            else {
              let winloss = getRandomInt(2)
              if (winloss === 1) {
                let gamblewin = Math.round(+nammers + +gambleamount)
                db.set(`${userlow}nammers`, `${gamblewin}`)
                client.me(channel, (`${user} --> You bet ${gambleamount} nammer(s) and won! You now have ${gamblewin} nammer(s)! PagMan 💰`))
              }
              else {
                let gambleloss = Math.round(+nammers - +gambleamount)
                db.set(`${userlow}nammers`, `${gambleloss}`)
                client.me(channel, (`${user} --> You bet ${gambleamount} nammer(s) and lost! You now have ${gambleloss} nammer(s)! SadCat`))
              }
            }
          }
          else if (`${args[0]}` === 'all') {
            let winloss = getRandomInt(2)
            if (winloss === 1) {
              let gamblewin = Math.round(+nammers * 2)
              db.set(`${userlow}nammers`, `${gamblewin}`)
              client.me(channel, (`${user} --> You went all in and won! You now have ${gamblewin} nammer(s)! EZ 💰`))
            }
            else {
              db.set(`${userlow}nammers`, '0')
              client.me(channel, (`${user} --> You went all in and lost! You have 0 nammers now! Next time I guess Copium`))
            }
          }
          else {
            client.me(channel, (`${user} --> NOIDONTTHINKSO Thats not a valid number!`))
          }
        }
      })
    }
  }

  if (command === 'color' || command === 'colour') {
    if (/\b^red$|^blue$|^green$|firebrick|coral|yellowgreen|orangered|seagreen|goldenrod|chocolate|cadetblue|dodgerblue|hotpink|blueviolet|springgreen\b/i.test(`${args.join(' ')}`)) {
      db.get(`${userlow}nammers`).then(function(value) {
        if (+value < 300) {
          client.me(channel, (`${user} --> You don't have enough nammers. You need at least 300 to use this command! You have ${value}.`))
        }
        else {
          let deductedNammers = +value - 300
          db.set(`${userlow}nammers`, deductedNammers)
          client.privmsg(channel, `/color ${args[0]}`)
          client.me(channel, `${user} --> You successfully set my color to "${args[0]}", costing you 300 nammers. You now have ${deductedNammers} nammer(s). TehePelo`)
        }
      })
    }
    else {
      client.me(channel, (`${user} --> That command was not valid. Price: 300 nammers. Available Colours: https://i.darkvypr.com/colours.png`))
    }
  }

})