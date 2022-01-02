// require("http").createServer((_, res) => res.end("Alive!")).listen(8080)
const talkedRecently = new Set();
const commandcooldown = new Set();
const cdrcooldown = new Set();
const fs = require('fs-extra')
const {performance} = require('perf_hooks');
const Database = require("@replit/database")
const db = new Database()
const humanizeDuration = require("humanize-duration");
const axios = require('axios').default;
const { ChatClient, AlternateMessageModifier, SlowModeRateLimiter } = require("dank-twitch-irc");
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

client.on("ready", () => console.log("Successfully connected to chat"));
client.on("close", (error) => {
  if(error != null) {
    console.error("Client closed due to error", error);
  }
});

const channelOptions = fs.readFileSync('channels.txt').toString().split(' ')

client.connect();
client.joinAll(channelOptions)

setInterval(function() {
  axios.get(`https://supinic.com/api/test/auth?auth_user=${process.env['SUPI_USER_AUTH']}&auth_key=${process.env['SUPI_USERKEY_AUTH']}`)
  .catch(err => { client.whisper('darkvypr', `There was an error pinging Supi's API!`)})
  .then((response) => {
    let supiresults = response.data
    if(supiresults.statusCode === 200) {
      console.log('✅ SUCCESS Supinic API Ping ✅')
    }
    else {
      console.log('⛔ UNSUCCESSFUL Supinic API Ping ⛔')
      client.whisper('darkvypr', `There was an error pinging Supi's API!`)
    }
  });
}, 20 * 60000);

client.on("PRIVMSG", (msg) => {

   // BASIC VARIABLES

  let user = msg.displayName
  let userlow = msg.senderUsername
  let channel = msg.channelName
  let message = msg.messageText

  console.log(`[#${channel}] ${user} (${userlow}): ${message}`)

  function globalPing(msg, userSaid, channelSaid) {
    const ping1 = new RegExp(/\b(v|b)ypa(')?(s)?\b/)
    const ping2 = new RegExp(/(bright|dark)?(v|b)(y)p(e|u|o)?r/)
    const ping3 = new RegExp(/\b(dv(')?(s)?)\b/)
    const ping4 = new RegExp(/vpyr/)
    const ping5 = new RegExp(/\b(b|v)o?ip(o*|u)r\b/)
    const ping6 = new RegExp(/\b(bright|dark)vip(e|u|o)r\b/)
    const ping7 = new RegExp(/\b(b|v)ip(o|u)r\b/)
    const ping8 = new RegExp(/\b(b|v)pe?r\b/)
    const ping9 = new RegExp(/darkv/)
    const ping10 = new RegExp(/\b(dark|bright)?\s?dype?(r|a)\b/)
    const ping11 = new RegExp(/\b(b|v)ooper\b/)
    const ping12 = new RegExp(/(dark|bright)\s?diaper/)
    const ping13 = new RegExp(/(dark|bright)\s?viper|vypr/)

    const blacklistedChannels = new RegExp(/visioisiv|darkvypr|vyprbottesting|vyprbot|gotiand|arkadlus|vexnade|boronics|xenoplopqb/)
    const blacklistedUsers = new RegExp(/darkvypr|vyprbot|vyprbottesting|hhharrisonnnbot|apulxd|daumenbot|kuharabot|snappingbot|kaedtn|カイデン|oura_bot/)

    if(!blacklistedChannels.test(channelSaid) && !blacklistedUsers.test(userSaid)) {
      if(ping1.test(msg) || ping2.test(msg) || ping3.test(msg) || ping4.test(msg) || ping5.test(msg) || ping6.test(msg) || ping7.test(msg) || ping8.test(msg) || ping9.test(msg) || ping10.test(msg) || ping11.test(msg) || ping12.test(msg) || ping13.test(msg)) {
        client.whisper('darkvypr', `Channel: #${channel} | User: ${user} | Message: ${message}`)
      }
    }
  }

  globalPing(message, userlow, channel)
  
  if(/\bn(a|4)m(mer|ming)?\b/gi.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `NammersOut elisDance NammersOut`);
  }
  
  if(userlow === 'thepositivebot' && message.includes('this command has been removed') && channel === 'darkvypr') {
    client.privmsg(channel, `SHUT THE FUCK UP THEPOSITIVEBOT LAUGH`);
  }

  if(userlow === 'xenoplopqb' && message.includes('modCheck') && channel === 'darkvypr') {
    client.privmsg(channel, `modCheck`);
  }
  
  if(/\bn(a|4)m(mer|ming)?\b/gi.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `NammersOut elisDance NammersOut`);
  }
  
  if(/NaN/.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `NaN`);
  }

  if(/\bunhandled\s?promise\s?rejection\b/i.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `js`);
  }
  
  if(/\bokge\b/g.test(message) && userlow !== 'vyprbot' && channel === 'darkvypr') {
    client.privmsg(channel, `okge`);
  }


  
  if(!message.startsWith('vb ') || userlow === 'vyprbot') {
    return
  }
  
  if(userlow !== 'vyprbot' && userlow !== 'darkvypr') {
    if(commandcooldown.has(`${user}`)) {
      return
    }
    else {
      commandcooldown.add(`${user}`);
      setTimeout(() => {
        commandcooldown.delete(`${user}`);
      }, 2000);
      
      db.get("commandusage").then(function(value) {
        let usage = +value + 1
        db.set("commandusage", usage);
      })
    }
  }
  
  const PREFIX = "vb ";
  let [command, ...args] = msg.messageText.slice(PREFIX.length).split(/ +/g);

  // Variables

  var defaultname = `${args[0]}`
  if(defaultname === 'undefined')
    var defaultname = `${user}`

  var defaultname2 = `${args[1]}`
  if(defaultname2 === 'undefined')
    var defaultname2 = `${channel}`

  var gnkissmsg = `${args[1]}`
  if(gnkissmsg === 'undefined')
    var gnkissmsg = 'catKISS 💖'

  var kissmsg = `${args[1]}`
  if(kissmsg === 'undefined')
    var kissmsg = 'peepoShy'

  var logschannel = `${args[1]}`
  if(logschannel === 'undefined')
    var logschannel = 'xqcow'

  var hugmsg = `${args[1]}`
  if(hugmsg === 'undefined')
    var hugmsg = 'HUGGIES'

  // Clean Seconds

  function cleanSeconds(seconds) {
    return humanizeDuration(Math.round(seconds) * 1000);
  }

  // Owner Only Commands

  async function checkAdmin(user) {
    let admins = await db.get('admins')
    let adminsArray = admins.split(' ')
    if(adminsArray.indexOf(user) > -1) {
      return 'true'
    }
    else {
      return 'false'
    }
  }
  
  async function addAdmin(user) {
    let admins = await db.get('admins')
    let adminsArray = admins.split(' ')
    if(adminsArray.indexOf(user) > -1) {
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
    if(indexOfUser > -1) {
      adminsArray.splice(indexOfUser, 1)
      db.set('admins', `${adminsArray.join(' ').trim()}`)
    }
    else {
      return 'User is not an admin!'
    }
  }
  
  if (command === 'admin') {
    if(`${args[0]}` === 'undefined' || `${args[1]}` === 'undefined' || !/add|remove|delete|check/i.test(`${args[0]}`) && userlow === 'darkvypr') {
      client.me(channel, `DarkVypr --> Invalid Syntax! Example: "vb admin {add|delete|remove|check} {user}".`)
    }
    else if(`${args[0]}` === 'add' && userlow === 'darkvypr') {
      addAdmin(`${args[1].toLowerCase()}`).then(function(value) {
        if(`${value}` !== 'undefined') {
          client.me(channel, `DarkVypr --> There was an error with that command. Reason: ${value}`)
        }
        else {
          client.me(channel, `DarkVypr --> Successfully added user ${args[1].toLowerCase()} as an admin!`)
        }
      })
    }
    else if(`${args[0]}` === 'delete' || `${args[0]}` === 'remove' && userlow === 'darkvypr') {
      deleteAdmin(`${args[1].toLowerCase()}`).then(function(value) {
        if(`${value}` !== 'undefined') {
          client.me(channel, `DarkVypr --> There was an error with that command. Reason: ${value}`)
        }
        else {
          client.me(channel, `DarkVypr --> Successfully removed ${args[1].toLowerCase()}'s admin privileges!`)
        }
      })
    }
    else if(`${args[0]}` === 'check' && userlow === 'darkvypr') {
      checkAdmin(`${args[1].toLowerCase()}`).then(function(value){
        if(value === 'true') {
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
  
  if(command === 'rename') {
    checkAdmin(userlow).then(function(isAdmin) {
      if(isAdmin === 'true') {
        async function renameUser(oldName, newName) {
          let bday = await db.get(`${oldName}bday`)
          let location = await db.get(`${oldName}time`)
          let twitter = await db.get(`${oldName}twitter`)
          let nammers = await db.get(`${oldName}nammers`)
          if(`${bday}` !== 'null') {
            db.set(`${newName}bday`, bday)
          }
          if(`${location}` !== 'null') {
            db.set(`${newName}time`, location)
          }
          if(`${twitter}` !== 'null') {
            db.set(`${newName}twitter`, twitter)
          }
          if(`${nammers}` !== 'null') {
            db.set(`${newName}nammers`, nammers)
          }
          if(`${nammers}` === 'null' && `${twitter}` === 'null' && `${location}` === 'null' && `${bday}` === 'null') {
            client.me(channel, `${user} --> That user dosen't have any data associated with their account!`)
          }
          else {
            db.list(oldName).then(function(value) {
              for (let i = 0; i < value.length; i++) {
                db.delete(value[i])
              }
            })
            client.me(channel, `${user} --> Succesfully transferred all of the data from "${oldName}" to "${newName}"! EZ`) 
          }
        }
        if(`${args[0]}` === 'undefined' || `${args[1]}` === 'undefined') {
          client.me(channel, `${user} --> Provide an old and new account.`)
        }
        else {
          renameUser(`${args[0].toLowerCase()}`, `${args[1].toLowerCase()}`)
        }
      }
      else {
        client.me(channel, `${user} --> You don't have the required permission to use that command! If you would like to have all of your data moved over to a new name, use "vb suggest" and I will get to it. Required: Developer`)
      }
    })
  }

  if(command === 'join') {
    if(`${userlow}` === 'darkvypr') {
      client.join(`${args[0].toLowerCase()}`)
      let content = ' ' + args[0].toLowerCase()
      fs.writeFile('channels.txt', content, { flag: 'a+' }, err => {})
      client.me(channel, (`${user} --> Succesfully joined channel: "${args[0].toLowerCase()}"! TehePelo 👍`))
      client.me(`${args[0].toLowerCase()}`, (`Successfully joined! KonCha`))
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }
  
  if(command === 'part') {
    if(`${userlow}` === 'darkvypr') {
      const channellist = fs.readFileSync(channelsFile).toString()
      let removedchannel = channellist.replace(`${args[0].toLowerCase()}`, '')
      let removedchannelandspaces = removedchannel.replace(/\s\s+/g, ' ').trim()
        
      fs.writeFile('channels.txt', removedchannelandspaces, err => {})
      client.me(channel, (`${user} --> Succesfully left channel: "${args[0].toLowerCase()}"! SadCat`))
      client.part(`${args[0].toLowerCase()}`)
    }
    else if(`${userlow}` === `${channel}`) {
      const channellist = fs.readFileSync(channelsFile).toString()
      let removedchannel = channellist.replace(`${channel.toLowerCase()}`, '')
      let removedchannelandspaces = removedchannel.replace(/\s\s+/g, ' ').trim()
        
      fs.writeFile('channels.txt', removedchannelandspaces, err => {})
      client.me(channel, (`${user} --> Succesfully left channel: "${channel.toLowerCase()}"! SadCat`))
      client.part(`${channel.toLowerCase()}`)
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer or Channel Broadcaster.`);
    }
  }

  if(command === 'datadelete') {
    if(`${userlow}` === 'darkvypr') {
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

  if(command === 'datacreate') {
    if(`${userlow}` === 'darkvypr') {
      db.set(`${args[0].toLowerCase()}`, `${args[1]}`);
      client.me(channel, `${user} --> Succesfully added key: "${args[0]}"  value: "${args[1]}" NOTED`)
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  if(command === 'datainspect') {
    if(`${userlow}` === 'darkvypr') {
      db.get(`${args[0].toLowerCase()}`).then(function(value) {
        client.me(channel, (`${user} --> Key: "${args[0]}" Value: "${value}". NOTED`))
      })
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  if(command === 'datalist') {
    if(`${userlow}` === 'darkvypr') {
      if(`${args[0]}` === 'undefined') {
        db.list().then(keys => console.log(keys))
      }
      else if(`${args[1]}` === 'chat:true' || `${args[1]}` === 'public:true') {
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

  if(command === 'setnammers') {
    if(`${userlow}` === 'darkvypr') {
      db.set(`${args[0].toLowerCase()}nammers`, `${args[1]}`)
      client.me(channel, (`${user} --> Set ${args[0]}'s nammers to ${args[1]}!`))
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  if(command === 'addnammers') {
    if(`${userlow}` === 'darkvypr') {
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

  if(command === 'cooldownoverride') {
    if(`${userlow}` === 'darkvypr') {
      talkedRecently.delete(`${args[0]}`)
      client.me(channel, `${user} --> Reset the cooldown of user: "${args[0]}"!`);
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  // Add Hours

  Date.prototype.addHours = function(h) {
    this.setHours(this.getHours()+h);
    return this;
  }

  // Leppu Query

  async function getUserData(userLookup) {
    let userData = await axios.get(`https://api.ivr.fi/twitch/resolve/${userLookup}`)
    .catch(err => { client.me(channel, `${user} --> That user doesn't exist!`) })

    function isAffiliate(data) {
      if(`${data}` == 'true') {
        return 'Affiliate '
      }
      else {
        return ''
      }
    }

    function isPartner(data) {
      if(`${data}` == 'true') {
        return 'Partner '
      }
      else {
        return ''
      }
    }

    function isStaff(data) {
      if(`${data}` == 'true') {
        return 'Staff '
      }
      else {
        return ''
      }
    }

    function isSiteAdmin(data) {
      if(`${data}` == 'true') {
        return 'Admin '
      }
      else {
        return ''
      }
    }

    function isBot(data) {
      if(`${data}` == 'true') {
        return 'Verified_Bot '
      }
      else {
        return ''
      }
    }

    let creationDate = new Date(userData.data.createdAt).toDateString()
    let timeSinceCreation = humanizeDuration((new Date(creationDate).addHours(-5)) - (new Date().addHours(-5)), { units: ["y", "mo", "d", "m"], round: true, largest: 3 })

    let rolesArray = (isAffiliate(userData.data.roles.isAffiliate) + isPartner(userData.data.roles.isPartner) + isStaff(userData.data.roles.isStaff) + isSiteAdmin(userData.data.roles.isSiteAdmin) + isBot(userData.data.bot)).trim().split(' ')
    let roles = (isAffiliate(userData.data.roles.isAffiliate) + isPartner(userData.data.roles.isPartner) + isStaff(userData.data.roles.isStaff) + isSiteAdmin(userData.data.roles.isSiteAdmin) + isBot(userData.data.bot)).trim().split(' ').join(', ')

    var obj = {
      banned: userData.data.banned,
      name: userData.data.displayName,
      uid: userData.data.id,
      bio: userData.data.bio,
      colour: userData.data.chatColor,
      pfp: userData.data.logo,
      roles: roles,
      rolesArray: rolesArray,
      creationDate: creationDate,
      timeSinceCreation: timeSinceCreation
    }
    return obj
  }
  
  // Check for no-no words

  function checkPhrase(phrase) {
    return /(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|η|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/i.test(phrase.toLowerCase())
  }
  
  // Bot Info

  if(command === 'ping' || command === 'help') {
    let Sseconds = process.uptime()
    let ramusage = `${Math.round(process.memoryUsage().rss / 1024 / 1024)}`
    async function pingServer() {
      const t0 = performance.now()
      await client.ping()
      const t1 = performance.now()
      const latency = (t1 - t0).toFixed()
      return latency
    }
    db.get("commandusage").then(function(usage) {
      pingServer().then(function(latency){
        client.me(channel, (`PunOko 🏓 ${user} --> | Latency: ${latency} ms | Bot Uptime: ${cleanSeconds(Sseconds)} | Commands Used: ${usage} | RAM Usage: ${ramusage} MB | Prefix: "vb" | Commands: https://darkvypr.com/commands | Use "vb request" for info on requesting the bot.`))
      })
    })
  }

  if(command === 'commands') {
    client.me(channel, `${user} --> A list of commands can be found here NekoProud 👉 https://darkvypr.com/commands`);
  }
  
  // Set Commands

  if(command === 'setbirthday') {
    const regex = new RegExp('^(?!0?2/3)(?!0?2/29/.{3}[13579])(?!0?2/29/.{2}[02468][26])(?!0?2/29/.{2}[13579][048])(?!(0?[469]|11)/31)(?!0?2/29/[13579][01345789]0{2})(?!0?2/29/[02468][1235679]0{2})(0?[1-9]|1[012])/(0?[1-9]|[12][0-9]|3[01])/([0-9]{4})$')
    if(args[0] === 'undefined' || !regex.test(args[0])) {
      client.me(channel, `${user} --> Invalid syntax! Make sure your birthday is in MM/DD/YYYY format. Examples: "vb setbirthday 8/14/2005", "vb setbirthday 10/16/2004" or "vb setbirthday 9/11/1973".`)
    }
    else {
      db.set(`${userlow}bday`, args[0])
      .then(client.me(channel, `${user} --> Succesfully set your birthday to ${args[0]}! Make sure your birthday is in MM/DD/YYYY format.`))
    }
  }


  if(command === 'setlocation') {
    let location1 = `${args[0]}`
    let location2 = `${args[1]}`

    if(`${location1}`  === 'undefined') {
      client.me(channel, `${user} --> That's not a valid location! Examples: "vb setlocation stockholm sweden" or "vb setlocation springfield virginia".`)
    }
    else {
      if(`${location2}` === 'undefined') {
        client.me(channel, `${user} --> That's not a valid location! Examples: "vb setlocation stockholm sweden" or "vb setlocation springfield virginia".`)
      }
      else {
        let location1up = location1[0].toUpperCase() + location1.substring(1)
        let location2up = location2[0].toUpperCase() + location2.substring(1)

        let finallocation = `${location1up}, ${location2up}`

        db.set(`${userlow}time`, `${finallocation}`)
        .then(client.me(channel, `${user} --> Succesfully set your location to ${finallocation}!`))
      }
    }
  }

  if(command === 'locationoverride') {
    if(`${userlow}` === 'darkvypr') {
      db.set(`pvcL777time`, `Milano, Italy`);
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  // Social Commands - Self Promo

  if(command === 'disc' || command === 'discord') {
    if(channel === 'darkvypr' || channel === 'visioisiv' || channel === 'gotiand' || userlow === 'darkvypr') {
      client.me(channel, `Join the homie server ${user} TriHard 👉 http://idiotas.darkvypr.com`);
    }
    else {
      client.me(channel, `${user} --> GearScare This command is only available in darkvypr, #VisioisiV and #Gotiand.`);
    }
  }

  if(command === 'youtube'|| command === 'yt') {
    if(channel === 'darkvypr' || `${userlow}` === 'darkvypr') {
      client.me(channel, `${user} --> Sub pls AYAYAsmile http://yt.darkvypr.com`);
    }
    else {
      client.me(channel, `${user} --> GearScare This command is only available in DarkVypr's chat`);
    }
  }
  
  if(command === 'github' || command === 'git') {
    if(channel === 'darkvypr' || `${userlow}` === 'darkvypr') {
      client.me(channel, `${user} --> peepoChat http://git.darkvypr.com`);
    }
    else {
      client.me(channel, `GearScare This command is only available in DarkVypr's chat ${user}`); 
    }
  }

  if(command === 'site' || command === 'website' || command === 'links') {
    if(channel === 'darkvypr' || `${userlow}` === 'darkvypr') {
      client.me(channel, `${user} --> https://darkvypr.com NekoProud`);
    }
    else {
      client.me(channel, `GearScare This command is only available in DarkVypr's chat ${user}`);
    }
  }

  // Suggestions

  if(command === 'suggest') {
    if(`${args[0]}` === 'undefined') {
      client.me(channel, `${user} --> You must provide a suggestion when using this command. Example: "!suggest I would like the bot to be added to my channel."`)
    }
    else {
      db.get('suggestion').then(function(value) {
        let plusone = +value + 1
        db.set("suggestion", plusone);

        let content = `${args.join(' ')}`
        let today = new Date().toISOString().slice(0, 10)
        let state = 'ACTIVE'

        fs.writeFile(`suggestions/ACTIVE/${userlow}_ID:${plusone}.txt`, `User: ${user} | State: ${state} | Date: ${today} | Suggestion: ${content}`, err => {})
        client.me(channel, `${user} --> Your suggestion has been saved and will be read shortly. (ID: ${plusone})`)
        client.whisper('darkvypr', `[New Suggestion] A new suggestion has been made: User: ${userlow} | ID: ${plusone} | Suggestion: ${content}`)
      })
    }
  }

  if(command === 'unset') {
    if(`${args[0]}` === 'undefined') {
      client.me(channel, `${user} --> You must provide a suggestion to unset when using this command. Example: "!unset 10" would unset the suggestion with the ID of '10'.`)
    }
    else {
      let suggestionid = `${args[0]}`
      let state = 'DISMISSED BY AUTHOR'
      let checkfile = fs.existsSync(`suggestions/ACTIVE/${userlow}_ID:${suggestionid}.txt`)

      if(`${checkfile}` === 'true') {
        fs.rename(`suggestions/ACTIVE/${userlow}_ID:${suggestionid}.txt`, `suggestions/DISMISSED/${userlow}_ID:${suggestionid}.txt`, function (err) {
          if (err) throw err
        })
        client.me(channel, `${user} --> Successfully unset suggestion: ${suggestionid}`)
      }
      else {
        client.me(channel, `${user} --> Invalid Command. You either didn't make this suggestion or it dosen't exist!`)
      }
    }
  }

  if(command === 'complete') {
    let suggestionuser = `${args[0]}`
    let suggestionid = `${args[1]}`
    let suggestionstatus = `${args[2]}`
    let suggestionreasonunsplit = `${args.join(' ')}`
    let suggestionreasonsplit = suggestionreasonunsplit.split(" ")
    let suggestionreason = suggestionreasonsplit.slice(3).toString().replace(/,/g, ' ')
    if(userlow === 'darkvypr') {
      if(`${suggestionuser.toLowerCase()}` === 'undefined') {
        client.me(channel, `This guy dosen't even know how to use his own command LULW --> DarkVypr`)
      }
      else {
        let checkfile = fs.existsSync(`suggestions/ACTIVE/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`)
        if(`${suggestionstatus.toUpperCase()}` === 'DENIED') {
          if(`${checkfile}` === 'true') {
            fs.writeFile(`suggestions/ACTIVE/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, ` | Reason: ${suggestionreason}`, { flag: 'a+' }, err => {})
            fs.rename(`suggestions/ACTIVE/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, `suggestions/DENIED-CLOSED/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, function (err) {
              if (err) throw err
            })
            client.me(channel, `${user} --> Successfully denied suggestion ${suggestionid}, and whispered the user.`)
            client.whisper(suggestionuser.toLowerCase(), `[Suggestion Update] Your suggestion with the ID:${suggestionid} was denied! Reason: ${suggestionreason}`)
          }
          else {
            client.me(channel, `${user} --> Suggestion dosen't exist or invalid syntax! ⛔ Usage: !complete {user} {id} {completed|approved|denied|held}`)
          }
        }
        else if(`${suggestionstatus.toUpperCase()}` === 'HELD' || `${suggestionstatus.toUpperCase()}` === 'ON-HOLD') {
          if(`${checkfile}` === 'true') {
            fs.writeFile(`suggestions/ACTIVE/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, ` | Reason: ${suggestionreason}`, { flag: 'a+' }, err => {})
            fs.rename(`suggestions/ACTIVE/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, `suggestions/HELD/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, function (err) {
              if (err) throw err
            })
            client.me(channel, `${user} --> Successfully held suggestion ${suggestionid}, and whispered the user.`)
            client.whisper(suggestionuser.toLowerCase(), `[Suggestion Update] Your suggestion with the ID:${suggestionid} was put on hold! Reason: ${suggestionreason}`)
          }
          else {
            client.me(channel, `${user} --> Suggestion dosen't exist or invalid syntax! ⛔ Usage: !complete {user} {id} {completed|approved|denied|held}`)
          }
        }
        else {
          if(`${checkfile}` === 'true') {
            fs.writeFile(`suggestions/ACTIVE/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, ` | Reason: ${suggestionreason}`, { flag: 'a+' }, err => {})
            fs.rename(`suggestions/ACTIVE/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, `suggestions/COMPLETED/${suggestionuser.toLowerCase()}_ID:${suggestionid}.txt`, function (err) {
              if (err) throw err
            })
            client.me(channel, `${user} --> Successfully approved suggestion ${suggestionid}, and whispered the user.`)
            client.whisper(suggestionuser.toLowerCase(), `[Suggestion Update] Your suggestion with the ID:${suggestionid} was approved! Reason: ${suggestionreason}`)
          }
          else {
            client.me(channel, `${user} --> Suggestion dosen't exist or invalid syntax! ⛔ Usage: !complete {user} {id} {completed|approved|denied|held}.`)
          }
        }
      }
    }
    else {
      client.me(channel, `Whoops! ${user} --> you don't have the required permission to use that command! Required: Bot Developer.`);
    }
  }

  // Permission System
  
  async function permitUser(user) {
    var existingPermits = await db.get(`${channel}permits`)
    if(`${existingPermits}` === 'null') {
      await db.set(`${channel}permits`, channel)
    }
    var existingPermits = await db.get(`${channel}permits`)
    let existingPermitsArray = existingPermits.split(' ')
    if(existingPermitsArray.indexOf(user) > -1) {
      return 'That user is alredy permitted in this channel!'
    }
    else {
      existingPermitsArray.push(user)
      let joinedExisting = existingPermitsArray.join(' ').trim()
      db.set(`${channel}permits`, joinedExisting)
    }
  }

  async function unpermitUser(user) {
    var existingPermits = await db.get(`${channel}permits`)
    if(`${existingPermits}` === 'null') {
      await db.set(`${channel}permits`, channel)
    }
    var existingPermits = await db.get(`${channel}permits`)
    let existingPermitsArray = existingPermits.split(' ')
    let indexOfUser = existingPermitsArray.indexOf(user)
    if(indexOfUser > -1) {
      existingPermitsArray.splice(indexOfUser)
      let joinedExisting = existingPermitsArray.join(' ').trim()
      db.set(`${channel}permits`, joinedExisting)
    }
    else {
      return 'That user is not permitted in this channel!'
    }
  }

  async function checkPermitted(user) {
    var permits = await db.get(`${channel}permits`)
    if(`${permits}` === 'null') {
      await db.set(`${channel}permits`, channel)
    }
    else {
      var permits = await db.get(`${channel}permits`)
      permitsArray = permits.split(' ')
      if(permitsArray.indexOf(user) > -1) {
        return 'true'
      }
      else {
        return 'false'
      }
    }
  }

  if(command === 'permit') {
    checkAdmin(userlow).then(function(isAdmin) {
      if(userlow === 'darkvypr' || userlow === channel || isAdmin === 'true') {
        if(!/^add$|^remove$|^delete$|^check$/i.test(`${args[0]}`) || `${args[1]}` === 'undefined') {
          client.me(channel, `${user} --> Invalid Syntax! Example: "vb permit {add|delete|remove|check} {user}".`)
        }
        else if(`${args[0]}` === 'add') {
          permitUser(`${args[1].toLowerCase()}`).then(function(value) {
            if(value === 'That user is alredy permitted in this channel!') {
              client.me(channel, `${user} --> That user is alredy permitted in #${channel}!`)
            }
            else {
              client.me(channel, `${user} --> Successfully allowed user ${args[1].toLowerCase()} to use all permission locked commands!`)
            }
          })
        }
        else if(`${args[0]}` === 'delete' || `${args[0]}` === 'remove') {
          unpermitUser(`${args[1].toLowerCase()}`).then(function(value) {
            if(value === 'That user is not permitted in this channel!') {
              client.me(channel, `${user} --> That user is not permitted in #${channel}!`)
            }
            else {
              client.me(channel, `${user} --> Successfully removed ${args[1].toLowerCase()}'s permissions to use all locked commands!`)
            }
          })
        }
        else if(`${args[0]}` === 'check') {
          checkPermitted(`${args[1].toLowerCase()}`).catch(err => { client.me(channel, `${user} --> ${err}!`) }).then(function(value) {
            if(value === 'true') {
              client.me(channel, `${user} --> User ${args[1]} is permitted in #${channel}! ✅`)
            }
            else {
              client.me(channel, `${user} --> User ${args[1]} is not permitted in #${channel}! ❌`)
            }
          })
        }
      }
      else {
        client.me(channel, `${user} --> You dont have permission to use that command! Required: Bot Developer, Broadcaster or Admin`)
      }
    })
  }

  // Countdowns

  if(command === 'christmas') {
    today = new Date().addHours(-5)
    xmas = new Date("December 25, 2022");

    let timeUntilChristmas = humanizeDuration(xmas - today, { units: ["d", "h", "m", "s"], round: true, largest: 2, delimiter: " and " })

    if(today.toDateString() === 'Sat Dec 25 2022') {
      client.me(channel, `YAAAY peepoSnow It's finally that time of year! Merry Christmas! peepoSnow YAAAY`);
    }
    else {
      client.me(channel, `${user} --> There is ${timeUntilChristmas} (EST +5) left until christmas! peepoSnow 🎄`);
    }
  }

  if(command === '2022' || command === 'newyears') {
    today = new Date().addHours(-5)
    newYears = new Date("January 01, 2022");

    let timeUntilNewYears = humanizeDuration(newYears - today, { units: ["d", "h", "m", "s"], round: true, largest: 2, delimiter: " and "})

    if(today.toDateString() === 'Sat Jan 01 2022') {
      client.me(channel, `YAAAY 🎉🎈🎊 HAPPY NEW YEARS! 🎊🎈🎉YAAAY`);
    }
    else {
      client.me(channel, `${user} --> There is ${timeUntilNewYears} (EST +5) left until new years! PauseChamp 🎊🎈🎉`);
    }
  }
  
  // General Commands - Not Self Promo or attached to me

  if(command === '7tvemote') {
    client.me(channel, `${user} --> https://7tv.app/emotes?sortBy=popularity&page=0&query=${args[0]}`);
  }

  if(command === '7tvuser') {
    client.me(channel, `${user} --> https://7tv.app/users/${defaultname}`);
  }

  if(command === '8ball') {
    axios.get(`https://8ball.delegator.com/magic/JSON/${args.join(' ')}`)
      .then((response) => {
        let ballresults = response.data
        client.me(channel, `${user} --> The 8-Ball says: ${ballresults.magic.answer}`);
      });
  }

  if(command === 'adblock') {
    client.me(channel, `${user} --> TriHard UBLOCK FILTERS: https://bit.ly/3j36lKB CHROME STORE: https://bit.ly/30hvkTF`);
  }

  if(command === 'alogs') {
    console.log({ command, args });
    client.me(channel, `${user} --> https://logs.apulxd.ga/?channel=${defaultname2}&username=${defaultname}`)
  }

  async function getBirthdayDetails(name) {
    let bday = await db.get(`${name}bday`)
    if (`${bday}` === 'null') {
      return 'null'
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
    if (`${args[0]}` === 'undefined') {
      getBirthdayDetails(userlow).then(function(value) {
        let birthday = value
        if (birthday === 'null') {
          client.me(channel, `${user} --> Before using this command, you must set your birthday with the vb setbirthday command. It must be in M/D/YYYY or MM/DD/YYYY format. Examples: "vb setbirthday 8/14/2005", "vb setbirthday 10/16/2004" or "vb setbirthday 9/11/1973".`)
        }
        else {
          client.me(channel, `${user} --> You are currently ${birthday.currentage} years old, and will be turning ${birthday.turningage} on ${birthday.userBirthdayYear} which is in ${birthday.humanizedtime}. PauseChamp ⌚`)
        }
      })
    }
    else {
      let specificuser = `${args[0]}`
      if (specificuser[0] === '@') {
        let removedatsign = specificuser[0].replace('@', '') + specificuser.substring(1).toLowerCase()
        getBirthdayDetails(removedatsign).then(function(value) {
          let birthday = value
          if (birthday === 'null') {
            client.me(channel, `${user} --> User ${removedatsign} hasn't set their birthday! Get them to set it and retry this command!`)
          }
          else {
            client.me(channel, `${user} --> User ${removedatsign} is currently ${birthday.currentage} years old, and will be turning ${birthday.turningage} on ${birthday.userBirthdayYear} which is in ${birthday.humanizedtime}. PauseChamp ⌚`)
          }
        })
      }
      else {
        getBirthdayDetails(args[0].toLowerCase()).then(function(value) {
          let birthday = value
          if (birthday === 'null') {
            client.me(channel, `${user} --> User ${args[0]} hasn't set their birthday! Get them to set it and retry this command!`)
          }
          else {
            client.me(channel, `${user} --> User ${args[0]} is currently ${birthday.currentage} years old, and will be turning ${birthday.turningage} on ${birthday.userBirthdayYear} which is in ${birthday.humanizedtime}. PauseChamp ⌚`)
          }
        })
      }
    }
  }

  if(command === 'bm') {
    db.get("bisiomoments").then(function(value) {
      let origbm = `${value}`
      let plusonebm = +origbm + +1
      db.set("bisiomoments", `${plusonebm}`);
      client.me(channel, (`${user} --> There has been ${plusonebm} bisio moments donkJAM`)
      )
    })
  }

  if(command === 'bot') {
    axios.get(`https://api.ivr.fi/twitch/resolve/${args[0]}`)
    .catch(err => { client.me(channel, `${user}, That user doesn't exist!`)})
    .then((response) => {
      let userdata = response.data
      if(`${userdata.bot}` === 'true') {
        client.me(channel, `${user} --> User "${userdata.displayName}" is a verified bot! ✅`)
      }
      else {
        client.me(channel, `${user} --> User "${userdata.displayName}" is NOT a verified bot! ❌`)
      }
    });
  }
  
  if(command === 'botlist') {
    client.me(channel, `${user} --> MrDestructoid BOP https://files.darkvypr.com/DarkVyprBotList.txt`);
  }

  if(command === 'breed') {
    client.me(channel, `${user} breeds with ${args[0]} for hours LewdAhegao spilledGlue`);
  }

  if(command === 'bttvemote') {
    client.me(channel, `${user} --> https://betterttv.com/emotes/shared/search?query=${args[0]}`);
  }

  if(command === 'cat') {
    axios.get('https://api.thecatapi.com/v1/images/search')
      .then((response) => {
        let catimage = response.data[0]
        client.me(channel, `${user} --> Random cat: ${catimage.url}`);
      });
  }

  if(command === 'catfact') {
    axios.get('https://catfact.ninja/fact?max_length=300')
      .then((response) => {
        let catfact = response.data
        client.me(channel, `${user} --> ${catfact.fact}`);
      });
  }

  if(command === 'channels') {
    client.me(channel, `${user} --> A list of the channels I am in are available here: http://channels.darkvypr.com/ | Use !request for info on how to get the bot in your chat!`);
  }

  if(command === 'chatterino') {
    client.me(channel, `${user} --> Homies: http://chatterinohomies.darkvypr.com Dankerino: http://dankerino.darkvypr.com`);
  }

  if(command === 'clear') {
    checkAdmin(userlow).then(function(isAdmin) {
      checkPermitted(userlow).then(function(isPermitted) {
        if(isPermitted === 'true' || isAdmin === 'true') {
          let clearamount = +`${args[0]}`
          if(clearamount > 100) {
            client.me(channel, `${user} --> The max clear is 100!`);
          }
          else {
            for( let i=clearamount; i--; )
              client.privmsg(channel, `/clear`);
          }
        }
        else {
          client.privmsg(channel, `${user} --> You aren't permitted to use that command. Get the broadcaster to permit you and try again!`)
        }
      })
    })
  }

  if(command === 'code') {
    if(`${args[0]}` === 'undefined') {
      client.me(channel, `${user} --> The code for the whole bot can be found at: http://bot.darkvypr.com/ | Input a command name to view the code for a command. Example: "!code loyalty".`);
    }
    else {
      client.me(channel, `${user} --> The ${args[0]} command's code can be found at: https://code.darkvypr.com/${args[0]}.txt`);
    }
  }

  if(command === 'coin') {
    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }
    let flipresult = getRandomInt(2)
    if(flipresult === 2) {
      client.me(channel, `${user} --> Result of your coin flip: "Heads!" (Yes)`);
    }
    else {
        client.me(channel, `${user} --> Result of your coin flip: "Tails!" (No)`);
    }
  }

  if(command === 'coomer') {
    client.me(channel, `${user} --> https://i.imgur.com/PqQCXC3.png`);
  }

	if(command === 'covid') {
    if(`${args[0]}` === 'undefined') {
      db.get(`${userlow}time`).then(function(value) {
        let usercitycountry = `${value}`
        if(usercitycountry === 'null') {
          client.me(channel, `${user} --> Before using this command, you must set your location with the vb setlocation command. Example: “vb setlocation lasalle ontario”, “vb setlocation springfield virginia” or “vb setlocation stockholm sweden”. More info: https://darkvypr.com/commands`)
        }
        else {
          axios.get(`https://api.tomtom.com/search/2/search/${usercitycountry}.json?key=${process.env['COUNTRY_CONVERT_KEY']}`)
          .then((response) => {
            let convertedcountry = response.data
            let parsedconvertedcountry = `${convertedcountry.results[0].address.country}`

          axios.get(`https://disease.sh/v3/covid-19/countries/${parsedconvertedcountry}`)
          .then((response) => {
            let covidusercountry = response.data
            client.me(channel, `${user} --> Stats for your country (${covidusercountry.country}): Today's Cases: ${covidusercountry.todayCases} | Today's Deaths: ${covidusercountry.todayDeaths} | Total Cases: ${covidusercountry.cases} | Total Deaths: ${covidusercountry.deaths}`)
          });
          });
        }
      })
    }

    else {
      let specificlocation = `${args.join(' ')}`
      if(specificlocation[0] === '@') {
        let removedatsign = specificlocation[0].replace('@', '') + specificlocation.substring(1)
        let removedatsignlow = removedatsign.toLowerCase()
		    db.get(`${removedatsignlow}time`).then(function(value) {
			    let lookuptime = `${value}`
          if(lookuptime === 'null') {
            client.me(channel, (`${user} --> That user hasen't set their location! Get them to set it and retry. PANIC`))
		      }
          else {
            axios.get(`https://api.tomtom.com/search/2/search/${lookuptime}.json?key=${process.env['COUNTRY_CONVERT_KEY']}`)
            .then((response) => {
              let convertedcountry = response.data
              let parsedconvertedcountry = `${convertedcountry.results[0].address.country}`

            axios.get(`https://disease.sh/v3/covid-19/countries/${parsedconvertedcountry}`)
            .then((response) => {
              let covidusercountry = response.data
              client.me(channel, `${user} --> Stats for ${specificlocation}'s country (${covidusercountry.country}): Today's Cases: ${covidusercountry.todayCases} | Today's Deaths: ${covidusercountry.todayDeaths} | Total Cases: ${covidusercountry.cases} | Total Deaths: ${covidusercountry.deaths}`)
            });
            });
          }
        })
      }

      else {
        axios.get(`https://disease.sh/v3/covid-19/countries/${args.join(' ')}`)
          .then((response) => {
            let coviduserquery = response.data
            client.me(channel, `${user} --> Stats for ${coviduserquery.country}: Today's Cases: ${coviduserquery.todayCases} | Today's Deaths: ${coviduserquery.todayDeaths} | Total Cases: ${coviduserquery.cases} | Total Deaths: ${coviduserquery.deaths}`)
          });
      }
    }
  }

  if(command === 'dance') {
    client.me(channel, `${user} elisDance https://i.darkvypr.com/dance.mp4`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
    client.me(channel, `elisDance`);
  }

  if(command === 'define') {
    axios.get(`https://dictionaryapi.com/api/v3/references/collegiate/json/${args.join(' ')}?key=${process.env['DICTIONARY_KEY']}`)
      .then((response) => {
        let defineresult = response.data[0]
        if(`${defineresult}` === 'undefined') {
          client.me(channel, `${user} --> No definition available for that string or word!`)
        }
        else {
          let shortanswer = `${defineresult.shortdef}`
          if(`${shortanswer}` === 'undefined') {
            client.me(channel, `${user} --> No definition available for that string or word!`)
          }
          else {
            if(checkPhrase(shortanswer)) {
              client.me(channel, `${user} --> cmonNep ?????`)
            }
            else {
              client.me(channel, `${user} --> Definition: ${shortanswer}`)
            }
          }
        }
      });
  }

  if(command === 'derick') {
    client.me(channel, `${user} --> https://i.imgur.com/Uo9K0xk.png`);
  }

  if(command === 'dogjam') {
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

  if(command === 'domain') {
    if(`${args[0]}` === 'undefined') {
      client.me(channel, `${user} --> Please input a domain to lookup!`)
    }
    else {
      axios.get(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${process.env['WHOIS_KEY']}&domainName=${args[0]}&outputFormat=JSON&ipWhois=1&preferFresh=1`)
      .then((response) => {
        let whoisresults = response.data
        if(`${whoisresults.WhoisRecord.dataError}` === 'INCOMPLETE_DATA') {
          client.me(channel, `${user} --> There was an error loading the data for ${args[0]}! Hint: That TLD isn't supported, or the domain dosent exist.`)
        }
        else {
          client.me(channel, `${user} --> Info for "${whoisresults.WhoisRecord.domainName}" Registrant Name: ${whoisresults.WhoisRecord.registrant.name} | Registrar Name: ${whoisresults.WhoisRecord.registrarName} | Location: ${whoisresults.WhoisRecord.registrant.city}, ${whoisresults.WhoisRecord.registrant.country} | Created: "${whoisresults.WhoisRecord.registryData.audit.createdDate}"`);
        }
      })
    }
  }

  if(command === 'echo') {
    if(userlow === 'darkvypr' || userlow === 'yagnesh' || userlow === 'xenoplopqb') {
      let checkifin = args[0].toLowerCase()
      if(checkifin[0] === 'i' && checkifin[1] === 'n' && checkifin[2] === ":") {
        let channelsay = checkifin.replace('in:', '')
        let messagesendunsplit = `${args.join(' ')}`
        let messagesendsplit = messagesendunsplit.split(" ")
        let messagesend = messagesendsplit.slice(1).toString().replace(/,/g, ' ')
        if(channelsay === 'all' && userlow === 'darkvypr') {
          for (let i = 0; i < channelOptions.length; i++) {
            channelsay = channelOptions[i]
            client.privmsg(channelsay, messagesend);
          }
        }
        else {
          client.privmsg(channelsay, messagesend);
        }
      }
      else {
        client.privmsg(channel, `${args.join(' ')}`);
      }
    }
    else {
      client.me(channel, `${user} --> You don't have the required permission to use that command! Use !say instead.`);
    }
  }

  if(command === 'elischat') {
    if(channel === 'darkvypr' || `${userlow}` === 'darkvypr') {
      client.me(channel, `${user} --> https://i.imgur.com/J3qKoiZ.png`);
    }
    else {
      client.me(channel, `GearScare This command is only available in DarkVypr's chat ${user}`);
    }
  }

  if(command === 'emotes') {
    if(`${args[0]}` === 'undefined') {
      axios.get(`https://api.ivr.fi/twitch/resolve/${user}`)
      .then((response) => {
      let userdata = response.data
      client.me(channel, `${user} --> The emotes for ${userdata.displayName} can be found at: https://emotes.raccatta.cc/twitch/${userdata.displayName}`);
      });
    }
    else {
      axios.get(`https://api.ivr.fi/twitch/resolve/${args[0]}`)
      .catch(err => { client.me(channel, `${user} --> That user doesn't exist!`)})
      .then((response) => {
      let userdata = response.data
      client.me(channel, `${user} --> The emotes for ${userdata.displayName} can be found at: https://emotes.raccatta.cc/twitch/${userdata.displayName}`);
      });  
    }
  }

  if(command === 'farmer') {
    client.me(channel, `${user} --> MrDestructoid Farmer: http://miner.darkvypr.com`);
    client.me(channel, `${user} --> Setup: https://youtu.be/0VkM7NOZkuA`);
  }

  if(command === 'ffzemote') {
    client.me(channel, `${user} --> https://www.frankerfacez.com/emoticons/?q=${args[0]}&sort=count-desc&days=0`);
  }

  if(command === 'filerepo') {
    client.me(channel, `${user} --> http://filerepo.darkvypr.com`);
  }

  if(command === 'filters') {
    client.me(channel, `${user} --> http://settings.darkvypr.com`);
  }

  if(command === 'firstlog') {
    axios.get(`https://api.ivr.fi/logs/firstmessage/${logschannel}/${defaultname}`)
    .catch(err => { client.me(channel, `${user} --> That channel or user doesn't exist, or is not logged!`)})
    .then((response) => {
      let firstmessage = response.data
      client.me(channel, `${user} --> ${firstmessage.user}'s first message in #${logschannel} was "${firstmessage.message}" and that was sent ${firstmessage.time} ago.`)
    });
  }

  if(command === 'followbutton') {
    client.me(channel, `${user} --> https://i.darkvypr.com/follow.mp4`);
  }

  if(command === 'followers') {
    client.me(channel, `${user} --> Visit: https://twitch-tools.rootonline.de/followerlist_viewer.php?channel=${defaultname} for a list of people that follow ${defaultname} NOTED`);
  }

  if(command === 'following') {
    client.me(channel, `${user} --> Visit: https://www.twitchfollowing.com/?${defaultname} for a list of people that ${defaultname} is following.`);
  }

  if(command === 'fuck') {
    client.me(channel, `${user} fucks ${args[0]} LewdAhegao spilledGlue`);
  }

  if(command === 'gnkiss') {
    client.me(channel, `${user} tucks ${args[0]} to bed and gently kisses their cheek: ${gnkissmsg}`);
  }

  if(command === 'hare') {
    client.me(channel, `${user} --> https://i.imgur.com/3Sor3Wg.jpg`);
  }

  if(command === 'harrison1') {
    client.me(channel, `${user} --> https://i.imgur.com/zn65wUW.png`);
  }

  if(command === 'harrison2') {
    client.me(channel, `${user} --> https://i.imgur.com/niKaezK.mp4`);
  }

  if(command === 'harrison3') {
    client.me(channel, `${user} --> https://i.imgur.com/8aT41ls.png`);
  }

  if(command === 'hug') {
    client.me(channel, `${user} --> picks ${args[0]} up off of their feet and squeezes them tight ${hugmsg} 💗`);
  }

  if(command === 'imagerepo') {
    client.me(channel, `${user} --> http://imagerepo.darkvypr.com`);
  }

  if(command === 'info') {
    if(`${args[0]}` === 'undefined') {
      getUserData(userlow).then(function(value) {
        client.me(channel, `${user} --> Name: @${value.name} | Banned: ${value.banned} | UID: ${value.uid} | Created: ${value.creationDate} (${value.timeSinceCreation} ago) | Colour: ${value.colour} | Bio: ${value.bio} | Profile Picture: ${value.pfp} | Roles: ${value.roles}`)
      })
    }
    else {
      getUserData(`${args[0]}`).then(function(value) {
        client.me(channel, `${user} --> Name: @${value.name} | Banned: ${value.banned} | UID: ${value.uid} | Created: ${value.creationDate} (${value.timeSinceCreation} ago) | Colour: ${value.colour} | Bio: ${value.bio} | Profile Picture: ${value.pfp} | Roles: ${value.roles}`)
      })
    }
  }
  
  if(command === 'ip') {
    axios.get(`http://api.ipstack.com/${args[0]}?access_key=${process.env['IP_KEY']}`)
      .then((response) => {
        let ipresults = response.data
        client.me(channel, `${user} --> Results for "${ipresults.ip}": Type: "${ipresults.type}" | Location ( ${ipresults.location.country_flag_emoji} ): "${ipresults.city}, ${ipresults.region_name}, ${ipresults.country_name}"`);
      });
  }

  if(command === 'kaf1') {
    client.me(channel, `${user} --> https://i.imgur.com/J99I0oD.mp4`);
  }

  if(command === 'kaf2') {
    client.me(channel, `${user} --> https://i.imgur.com/kKuxUBW.png`);
  }

  if(command === 'kanye') {
    axios.get('https://api.kanye.rest/')
      .then((response) => {
        let kanyequote = response.data
        client.me(channel, `${user} --> Random Kanye Quote: "${kanyequote.quote}"`);
      });
  }

  if(command === 'kiss') {
    client.me(channel, `${user} pulls ${args[0]} close and kisses them on the lips. ${kissmsg} 💋💖`);
  }

  if(command === 'kitten') {
    client.me(channel, `${user} --> https://i.imgur.com/3djjWjE.mp4 Whos my good wittwe~ kitten? I~ I am~ *shits* Uh oh~ ^w^ Kitten did you just make a poopy~ woopy~ iny youw panytsy~ wanytsys~? ^w^ I... I did daddy~ Im sowwy~ ^w^ ^w^ ^w^ Its ok kitten, i wike my kitten a wittwe *shits* *whispews* stinyky~ winyky~`);
  }

  if(command === 'list' || command === 'cutelist') {
    client.me(channel, `${user} --> https://cutelist.github.io/#/ SoCute`);
  }

  if(command === 'logs') {
    console.log({ command, args });
    client.me(channel, `${user} --> https://logs.ivr.fi/?channel=${logschannel}&username=${defaultname}`)
  }

  if(command === 'marbles') {
    client.me(channel, `${user} --> https://www.youtube.com/watch?v=IHZQ-23jrps NekoProud`);
  }

  if(command === 'math') {
    if(`${args[0]}` === 'undefined') {
      client.me(channel, `${user} --> Please provide a problem to evaluate!`);
    }
    else {
      axios.get(`https://api.mathjs.org/v4/?expr=${encodeURIComponent(args.join(''))}`)
      .then((response) => {
        client.me(channel, `${user} --> ${response.data}`);
      })
    }
  }
  
  if(command === 'minglee') {
    client.me(channel, `${user} --> https://www.youtube.com/watch?v=OjNpRbNdR7E`);
    client.me(channel, `MingLee 🇨🇳 GLORY TO THE CCP`);
  }

  if(command === 'modlookup') {
    client.me(channel, `MODS https://modlookup.3v.fi/u/${defaultname} some channels won't be listed as they aren't tracked ${user}.`);
  }

  if(command === 'nam') {
    for( let i=20; i--; )
      client.privmsg(channel, `AYAYA --> 👉 🚪 NammersOut elisDance NammersOut`);
  }

  if(command === 'neko') {
    if(channel === 'darkvypr') {
      client.me(channel, `${user} --> https://i.darkvypr.com/neko.mp4`);
    }
    else {
      client.me(channel, `${user} --> GearScare This command is only available in darkvypr's chat!`);
    }
  }
  
  if(command === 'noah') {
    client.me(channel, `${user} --> https://i.imgur.com/Dn0CjkF.png`);
  }

  if(command === 'numbers') {
    client.me(channel, `${user} --> NOTED https://darkvypr.com/numbers`);
  }

  // OCR Language Detect

  let ocrlang = `${args[1]}`

  if(`${ocrlang}` !== 'undefined') {
    var ocrlangresult = `&language=${args[1]}`
  }

  else {
    var ocrlangresult = '&language=eng'
  }

  // OCR Command

  if(command === 'ocr') {
    axios.get(`https://api.ocr.space/parse/imageurl?apikey=${process.env['OCR_KEY']}&url=${args[0]}${ocrlangresult}`)
      .then((response) => {
        let ocrresults = response.data.ParsedResults[0].ParsedText
        if(ocrresults === 'undefined' || ocrresults === '' || ocrresults === ' ') {
          client.me(channel, `${user} --> OCR.space was unable to find the text in that image. Make sure that the image's text is clearly visible with no pictures or items that may confuse the API.`);
        }
        else {
          client.me(channel, `${user} --> OCR Results: ${ocrresults.replace('\r\n', '')}`);
        }
      })
  }

  if(command === 'pfp') {
    if(`${args[0]}` === 'undefined') {
      getUserData(userlow).then(function(value){
        client.me(channel, `${user} --> Your profile picture: ${value.pfp}`)
      })
    }
    else {
      getUserData(`${args[0]}`).then(function(value){
        client.me(channel, `${user} --> ${value.name}'s profile picture: ${value.pfp}`)
      })
    }
  }

  if(command === 'picsbeforedisaster') {
    client.me(channel, `${user} --> https://i.imgur.com/1hKKEx0.png`);
  }

  if(command === 'pings') {
    client.me(channel, `${user} --> DinkDonk https://darkvypr.com/pings`);
  }

  if(command === 'plop1') {
    client.me(channel, `${user} --> https://i.imgur.com/jfVieNQ.png`);
  }

  if(command === 'plop2') {
    client.me(channel, `${user} --> https://i.imgur.com/PAjqrhD.png`);
  }

  if(command === 'plop3') {
    client.me(channel, `${user} --> https://i.imgur.com/dwMMtSD.png`);
  }

  if(command === 'plop4') {
    client.me(channel, `${user} --> https://i.imgur.com/EMixIJq.png`);
  }

  if(command === 'plop5') {
    client.me(channel, `${user} --> https://i.imgur.com/BX5GXFO.png`);
  }

  if(command === 'plop6') {
    client.me(channel, `${user} --> https://i.imgur.com/4PUBRLf.png`);
  }

  if(command === 'plop7') {
    client.me(channel, `${user} --> https://i.imgur.com/g7vIKbC.png`);
  }

  if(command === 'plop8') {
    client.me(channel, `${user} --> https://i.imgur.com/gBoJaoD.png`);
  }

  if(command === 'plop9') {
    client.me(channel, `${user} --> https://i.imgur.com/vKyWwTE.png`);
  }

  if(command === 'plop10') {
    client.me(channel, `${user} --> https://i.imgur.com/tPNuJ4r.png`);
  }

  if(command === 'plop11') {
    client.me(channel, `${user} --> https://i.imgur.com/McBKJwY.png`);
  }

  if(command === 'plopcolour') {
    client.me(channel, `${user} --> #94DCCC`);
  }

  if(command === 'pm') {
    db.get("plopmoments").then(function(value) {
      let origpm = `${value}`
      let plusonepm = +origpm + +1
      db.set("plopmoments", `${plusonepm}`);
      client.me(channel, (`${user} --> There has been ${plusonepm} plop moments donkJAM`)
      )
    })
  }

  if(command === 'query') {
    axios.get(`https://api.wolframalpha.com/v1/result?i=${args.join(' ')}&appid=${process.env['WOLFRAM_KEY']}`)
      .catch(err => { client.me(channel, `${user} --> Wolfram|Alpha did not understand your question! PANIC`)}) 
      .then((response) => {
        if(checkPhrase(response.data)) {
          client.me(channel, `${user} --> cmonNep ??????`);
        }
        else {
          client.me(channel, `${user} Results: ${response.data}`);
        }
      })
  }

  if(command === 'request') {
    client.me(channel, `${user} --> If you would like the bot in your chat, you can use the "vb suggest" command. Example: "vb suggest I would like the bot in my channel."`);
  }

  if(command === 'say') {
    if(checkPhrase(`${args.join(' ')}`)) {
      client.me(channel, `👥 cmonNep ?????`);
    }
    else {
      client.me(channel, `👥 ${args.join(' ')}`);
    }
  }
  
  if(command === 'shop' || command === 'store') {
    client.me(channel, `${user} --> A list of all purchasable items can be found here: https://darkvypr.com/shop`);
  }
  
  if(command === 'spam') {
    checkAdmin(userlow).then(function(isAdmin) {
      checkPermitted(userlow).catch(err => { client.me(channel, `${user} --> ${err}`)}).then(function(isPermitted) {
        if(isAdmin === 'true' || isPermitted === 'true' || userlow === channel) {
          let spamAmount = +`${args[0]}`
          if(spamAmount > 80) {
            client.me(channel, `${user} --> The max spam is 80!`)
          }
          else if(!checkPhrase(`${args.join(' ')}`)) {
            let cleanedupresponse = args.splice(1, 1).join(' ')
            for( let i=spamAmount; i--; )
              client.me(channel, cleanedupresponse)
          }
          else {
            client.me(channel, `${user} --> cmonNep ??????`)
          }
        }
        else {
          client.privmsg(channel, `${user} --> You aren't permitted to use that command. Get the broadcaster to permit you and try again!`)
        }
      })
    })
  }

  if(command === 'shibe' || command === 'shiba') {
    axios.get(`http://shibe.online/api/shibes?count=1&httpsUrls=true`)
      .then((response) => {
        let shiberesult = response.data
        client.me(channel, `${user} --> Random Shibe: ${shiberesult}`);
      });
  }


  if(command === 'specs') {
    client.me(channel, `${user} --> https://darkvypr.com/specs NekoProud`);
  }

  if(command === 'setstatus') {
    fs.ensureFileSync(`status/${userlow}.json`)
    if(`${args.join(' ').trim()}` === 'clear' || `${args.join(' ').trim()}` === 'none') {
      let newStatus = JSON.stringify({status: `noActiveStatus`, dateOfStatus: ``})
      fs.writeFileSync(`status/${userlow}.json`, newStatus)
      client.me(channel, `${user} --> Successfully cleared your status.`);
    }
    else if(`${args.join(' ')}` === '') {
      client.me(channel, `${user} --> This command gives you a status that people can check. Example: "vb setstatus learning javascript". To clear your status, use: "vb setstatus none" "vb setstatus clear".`)
    }
    else {
      let newStatus = JSON.stringify({status: `${args.join(' ')}`, dateOfStatus: `${new Date()}`})
      fs.writeFileSync(`status/${userlow}.json`, newStatus)
      client.me(channel, `${user} --> Successfully set your current status to: "${args.join(" ")}"`);
    }
  }
  
  if(command === '🥪') {
    client.me(channel, `${user} --> https://www.youtube.com/shorts/7XkP11Pomuc`);
  }
  
  if(command === 'status') {
    if(`${args[0]}` === 'undefined') {
      let doesUserExist = fs.existsSync(`status/${userlow}.json`) 
      if(doesUserExist === true) {
        function addZero(i) {
          if (i < 10) {i = "0" + i}
          return i;
        }
        let status = fs.readJsonSync(`status/${userlow}.json`)
        let currentStatus = status.status
        if(currentStatus === 'noActiveStatus') {
          client.me(channel, `${user} --> You have not set your status. Example: "vb setstatus learning javascript"`)
        }
        else {
          let dateSetDateObj = new Date(status.dateOfStatus)
          let sinceDateSet = humanizeDuration(new Date(dateSetDateObj) - new Date(), { units: ["d", "h", "m", "s"], round: true, largest: 2 })
          let dateSetFormatted = (dateSetDateObj.getMonth() + 1) + '/' + dateSetDateObj.getDate() + '/' + dateSetDateObj.getFullYear() + ' at ' + (+dateSetDateObj.getHours() - 5) + ':' + addZero(dateSetDateObj.getMinutes())
          
          client.me(channel, `${user} --> Your current status is: ${currentStatus} | Set on ${dateSetFormatted} (${sinceDateSet} ago) (EST-5). To clear your status, use: "vb setstatus none" or "vb setstatus clear".`) 
        }
      }
      else {
        client.me(channel, `${user} --> You have not set your status. Example: "vb setstatus learning javascript"`)
      }
    }
    else {
      let userToCheck = `${args[0].replace('@', '').toLowerCase()}`
      let doesUserExist = fs.existsSync(`status/${userToCheck}.json`)
      if(doesUserExist === true) {
        function addZero(i) {
          if (i < 10) {i = "0" + i}
          return i;
        }
        let status = fs.readJsonSync(`status/${userToCheck}.json`)
        let currentStatus = status.status
        if(currentStatus === 'noActiveStatus') {
          client.me(channel, `${user} --> That user has not yet set their status.`)
        }
        else {
          let dateSetDateObj = new Date(status.dateOfStatus)
          let sinceDateSet = humanizeDuration(new Date(dateSetDateObj) - new Date(), { units: ["d", "h", "m", "s"], round: true, largest: 2 })
          let dateSetFormatted = (dateSetDateObj.getMonth() + 1) + '/' + dateSetDateObj.getDate() + '/' + dateSetDateObj.getFullYear() + ' at ' + (+dateSetDateObj.getHours() - 5) + ':' + addZero(dateSetDateObj.getMinutes())
          client.me(channel, `${user} --> ${userToCheck}'s current status is: ${currentStatus} | Set on ${dateSetFormatted} (${sinceDateSet} ago) (EST-5)`)
        }
      }
      else {
        client.me(channel, `${user} --> That user has not yet set their status.`)
      }
    }
  }

  async function getUserTime(username) {
    let userLocation = await db.get(`${username}time`)
    if(`${userLocation}` === 'null') {
      return 'null'
    }
    else {
      let userTime = await axios.get(`https://timezone.abstractapi.com/v1/current_time/?api_key=${process.env['TIME_KEY']}&location=${userLocation}`)
      let dateTime = userTime.data.datetime
      let timezone = userTime.data.timezone_abbreviation
      let yearMonthDay = dateTime[0] + dateTime[1] + dateTime[2] + dateTime[3] + dateTime[4] + dateTime[5] + dateTime[6] + dateTime[7] + dateTime[8] + dateTime[9]
      let currentHour = dateTime[11] + dateTime[12]
      let currentMinute = dateTime[14] + dateTime[15]
      let currentSecond = dateTime[17] + dateTime[18]
      function checkAMPM(currentHour) {
        if(+currentHour < 12) {
          return 'am'
        }
        else {
          return 'pm'
        }
      }
      let meridiem = checkAMPM(currentHour)
      
      function getHour(currentHour) {
        if(+currentHour === 00) {
          return 12
        }
        else if(+currentHour < 10) {
          return dateTime[12]
        }
        else if(+currentHour === 10 || +currentHour === 11 || +currentHour === 12) {
          return currentHour
        }
        else {
          return currentHour - 12
        }
      }
      let hour = getHour(currentHour)

      var currentTime = {
        date: yearMonthDay,
        time: hour + ":" + currentMinute + ":" + currentSecond + " " + meridiem,
        timezone: timezone,
        location: userLocation
      }
      return currentTime
    }
  }

  async function getLocationTime(location) {
    let locationTime = await axios.get(`https://timezone.abstractapi.com/v1/current_time/?api_key=${process.env['TIME_KEY']}&location=${location}`)
    let dateTime = locationTime.data.datetime
    if (`${dateTime}` === 'undefined') {
      client.me(channel, `${user} --> That wasn't a valid location!`)
    }
    let timezone = locationTime.data.timezone_abbreviation
    let yearMonthDay = dateTime[0] + dateTime[1] + dateTime[2] + dateTime[3] + dateTime[4] + dateTime[5] + dateTime[6] + dateTime[7] + dateTime[8] + dateTime[9]
    let currentHour = dateTime[11] + dateTime[12]
    let currentMinute = dateTime[14] + dateTime[15]
    let currentSecond = dateTime[17] + dateTime[18]
    function checkAMPM(currentHour) {
      if(+currentHour < 12) {
        return 'am'
      }
      else {
        return 'pm'
      }
    }
    let meridiem = checkAMPM(currentHour) 
    function getHour(currentHour) {
      if(+currentHour === 00) {
        return 12
      }
      else if(+currentHour < 10) {
        return dateTime[12]
      }
      else if(+currentHour === 10 || +currentHour === 11 || +currentHour === 12) {
        return currentHour
      }
      else {
        return currentHour - 12
      }
    }
    let hour = getHour(currentHour)
    var currentTime = {
      date: yearMonthDay,
      time: hour + ":" + currentMinute + ":" + currentSecond + " " + meridiem,
      timezone: timezone
    }
    return currentTime
  }
  
  if(command === 'time') {
    let lookupSpecific = `${args.join(' ')}`
    if(lookupSpecific === '') {
      getUserTime(userlow).then(function(value){
        if(value === 'null') {
          client.me(channel, `${user} --> That user hasn't set their location! Get them to set it and retry! PANIC`)
        }
        else {
          client.me(channel, `${user} --> At your location (${value.location}) (${value.timezone}) it's ${value.time} and the date is ${value.date}.`)
        }
      })
    }
    else if(lookupSpecific[0] === '@') {
      let cleanedUserLookup = lookupSpecific.replace('@', '').toLowerCase()
      getUserTime(cleanedUserLookup).then(function(value) {
        if(value === 'null') {
          client.me(channel, `${user} --> That user hasn't set their location! Get them to set it and retry! PANIC`)
        }
        else {
          client.me(channel, `${user} --> ${lookupSpecific}'s current time (${value.location}) (${value.timezone}) is ${value.time} and the date is ${value.date}.`)          
        }
      })
    }
    else {
      getLocationTime(lookupSpecific).then(function(value){
        client.me(channel, `${user} --> The current time in ${lookupSpecific} (${value.timezone}) is ${value.time} and the date is ${value.date}.`)
      })
    }
  }

  async function translateText(text, toLanguage) {
    function checkTargetLang(toLanguage) {
      switch(toLanguage) {
        case 'bulgarian':
          return 'BG'
          break
        case 'czech':
          return 'CS'
          break
        case 'danish':
          return 'DA'
          break
        case 'german':
          return 'DE'
          break
        case 'spanish':
          return 'ES'
          break
        case 'greek':
          return 'EL'
          break
        case 'estonian':
          return 'ET'
          break
        case 'french':
          return 'FR'
          break
        case 'finnish':
          return 'FI'
          break
        case 'hungarian':
          return 'HU'
          break
        case 'italian':
          return 'IT'
          break
        case 'japanese':
          return 'JA'
          break
        case 'lithuanian':
          return 'LT'
          break
        case 'latvian':
          return 'LV'
          break
        case 'dutch':
          return 'NL'
          break
        case 'polish':
          return 'PL'
          break
        case 'portuguese':
          return 'PT-PT'
          break
        case 'romanian':
          return 'RO'
          break
        case 'russian':
          return 'RU'
          break
        case 'slovak':
          return 'SK'
          break
        case 'slovenian':
          return 'SL'
          break
        case 'swedish':
          return 'SV'
          break
        case 'chinese':
          return 'ZH'
          break
        default:
          return 'EN-US'
      }
    }
    let targetLang = checkTargetLang(toLanguage)
    let translation = await axios.get(`https://api-free.deepl.com/v2/translate?auth_key=${process.env['TRANSLATE_KEY']}&text=${text}&target_lang=${targetLang}`)

    var translationDetails = {
      translatedText: translation.data.translations[0].text,
      sourceLang: translation.data.translations[0].detected_source_language,
      targetLang: targetLang
    }
      return translationDetails
  }
  
  if(command === 'translate') {
    if(`${args[0]}`.includes('to:')) {
      let targetLang = `${args[0]}`.replace('to:', '').toLowerCase().trim()
      if(/\bfrench|Bulgarian|Czech|Danish|German|Greek|English|Spanish|Estonian|Finnish|French|Hungarian|Italian|Japanese|Lithuanian|Latvian|Dutch|Polish|Portuguese|Romanian|Russian|Slovak|Slovenian|swedish|chinese/i.test(`${targetLang}`)) {
        let textUnsplit = `${args.join(' ')}`
        let textSplit = textUnsplit.split(" ")
        let textSend = textSplit.slice(1).toString().replace(/,/g, ' ')
        translateText(encodeURIComponent(textSend), targetLang).then(function(value){
          client.me(channel, `${user} --> ${value.sourceLang} > ${value.targetLang} | Text: ${value.translatedText}`)
        })
      }
      else {
        client.me(channel, `${user} --> That isn't a valid language! Valid languages can be found here: https://i.darkvypr.com/languages.png`)
      }
    }
    else {
      translateText(encodeURIComponent(args.join(' '))).then(function(value){
        client.me(channel, `${user} --> ${value.sourceLang} > EN | Text: ${value.translatedText}`)
      })
    }
  }
  
  if(command === 'urban') {
    axios.get(`https://api.urbandictionary.com/v0/define?term=${args.join(' ')}`, { timeout: 10000 })
      .then((response) => {
        let urbanresult = response.data
        if(`${urbanresult.list[0]}` === 'undefined') {
          client.me(channel, `${user} --> Urban Dictionary does not have a definition for that word!`)
        }
        else {
          let dirtyresponse = urbanresult.list[0].definition
          let cleanedupresponse = dirtyresponse.replace(/\[|\]/gim, '')
          console.log(checkPhrase(cleanedupresponse))
          if(checkPhrase(cleanedupresponse)) {
            client.me(channel, `${user} --> cmonNep ??????`);
          }
          else {
            client.me(channel, `${user} --> ${cleanedupresponse}`)
          }
        }
      });
  }

  if(command === 'vanish') {
    client.me(channel, `𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙`);
  }

  if(command === 'vei') {
    client.me(channel, `veiSway`);
    client.me(channel, `veiSway`);
    client.me(channel, `veiSway`);
    client.me(channel, `veiSway`);
    client.me(channel, `veiSway`);
  }

  if(command === 'vm') {
    db.get("vyprmoments").then(function(value) {
      let origvm = `${value}`
      let plusonevm = +origvm + +1
      db.set("vyprmoments", `${plusonevm}`);
      client.me(channel, (`${user} --> There has been ${plusonevm} vypr moments peepoShy`)
      )
    })
  }

  if(command === 'vyprcolour') {
    client.me(channel, `${user} --> #FF7FD3`);
  }

  async function getWeatherUser(name) {
    let userLocation = await db.get(`${name}time`)
    if (`${userLocation}` === 'null') {
      return 'null'
    }
    else {
      let userCoordinates = await axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${userLocation}&apiKey=${process.env['GEOCODING_KEY']}`)
      let userLatitude = userCoordinates.data.items[0].position.lat
      let userLongitude = userCoordinates.data.items[0].position.lng
      let userLocationAPI = userCoordinates.data.items[0].title

      let userWeather = await axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${userLatitude}&lon=${userLongitude}&units=metric&appid=${process.env['WEATHER_KEY']}`)
      let condition = userWeather.data.weather[0].main
      let icon = userWeather.data.weather[0].icon
      let description = userWeather.data.weather[0].description

      let userTempC = Math.round(userWeather.data.main.temp)
      let userTempF = Math.round(+userTempC * 1.8 + 32)
      let userFeelsLikeC = Math.round(userWeather.data.main.feels_like)
      let userFeelsLikeF = Math.round(+userFeelsLikeC * 1.8 + 32)

      let userWindKMH = Math.round(+userWeather.data.wind.speed * 3.6)
      let userWindMPH = Math.round(userWindKMH / 1.609)

      let userHumidity = userWeather.data.main.humidity

      let cloudCoverage = userWeather.data.clouds.all

      function getCondition(checkCondition) {
        switch (checkCondition) {
          case 'Clear':
            return 'with clear skies ☀️⛱️'
            break
          case 'Thunderstorm':
            return `with a ${description} ⛈️☔`
            break
          case 'Drizzle':
            return 'with slight rain 🌦️🌧️'
            break
          case 'Rain':
            return `with ${description} 🌧️☔`
            break
          case 'Snow':
            return `with ${description} 🌨️❄️`
            break
          case 'Clouds':
            return `with ${description} ☁️🌥️`
            break
          default:
            return `with a special weather event: ${condition} 📊🔍`
        }
      }

      let conditionString = getCondition(condition)

      var weatherDetails = {
        location: userLocationAPI,
        tempC: userTempC,
        feelsLikeC: userFeelsLikeC,
        tempF: userTempF,
        feelsLikeF: userFeelsLikeF,
        windKMH: userWindKMH,
        windMPH: userWindMPH,
        humidity: userHumidity,
        condition: conditionString,
        cloudCoverage: cloudCoverage
      }
      return weatherDetails
    }
  }

  async function getWeatherLocation(location) {
    let userCoordinates = await axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${location}&apiKey=${process.env['GEOCODING_KEY']}`)
    if (`${userCoordinates.data.items[0]}` === 'undefined') {
      client.me(channel, `${user} --> That wasn't a valid location!`)
    }
    let userLatitude = userCoordinates.data.items[0].position.lat
    let userLongitude = userCoordinates.data.items[0].position.lng
    let userLocationAPI = userCoordinates.data.items[0].title

    let userWeather = await axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${userLatitude}&lon=${userLongitude}&units=metric&appid=${process.env['WEATHER_KEY']}`)
    let condition = userWeather.data.weather[0].main
    let icon = userWeather.data.weather[0].icon
    let description = userWeather.data.weather[0].description

    let userTempC = Math.round(userWeather.data.main.temp)
    let userTempF = Math.round(+userTempC * 1.8 + 32)
    let userFeelsLikeC = Math.round(userWeather.data.main.feels_like)
    let userFeelsLikeF = Math.round(+userFeelsLikeC * 1.8 + 32)

    let userWindKMH = Math.round(+userWeather.data.wind.speed * 3.6)
    let userWindMPH = Math.round(userWindKMH / 1.609)

    let userHumidity = userWeather.data.main.humidity

    let cloudCoverage = userWeather.data.clouds.all

    function getCondition(checkCondition) {
      switch (checkCondition) {
        case 'Clear':
          return 'with clear skies ☀️⛱️'
          break
        case 'Thunderstorm':
          return `with a ${description} ⛈️☔`
          break
        case 'Drizzle':
          return 'with slight rain 🌦️🌧️'
          break
        case 'Rain':
          return `with ${description} 🌧️☔`
          break
        case 'Snow':
          return `with ${description} 🌨️❄️`
          break
        case 'Clouds':
          return `with ${description} ☁️🌥️`
          break
        default:
          return `with a special weather event: ${condition} 📊🔍`
      }
    }

    let conditionString = getCondition(condition)

    var weatherDetails = {
      location: userLocationAPI,
      tempC: userTempC,
      feelsLikeC: userFeelsLikeC,
      tempF: userTempF,
      feelsLikeF: userFeelsLikeF,
      windKMH: userWindKMH,
      windMPH: userWindMPH,
      humidity: userHumidity,
      condition: conditionString,
      cloudCoverage: cloudCoverage
    }
    return weatherDetails
  }

  if (command === 'weather') {
    let specificLocation = `${args.join(' ')}`
    if (`${args[0]}` === 'undefined') {
      getWeatherUser(userlow).then(function(value) {
        if (value === 'null') {
          client.me(channel, `${user} --> Before using this command, you must set your location with the vb setlocation command. Example: “vb setlocation lasalle ontario”, “vb setlocation springfield virginia” or “vb setlocation stockholm sweden”. More info: https://darkvypr.com/commands`)
        }
        else {
          client.me(channel, `${user} --> The weather in ${value.location} is currently ${value.tempC}°C (${value.tempF}°F) ${value.condition} Wind speed: ${value.windKMH} km/h (${value.windMPH} mp/h) 💨 Humidity: ${value.humidity}% 💧 Cloud Coverage: ${value.cloudCoverage}% ☁️`)
        }
      })
    }
    else if (`${specificLocation[0]}` === "@") {
      cleanedUpUser = specificLocation.replace('@', '').toLowerCase()
      getWeatherUser(cleanedUpUser).then(function(value) {
        if (value === 'null') {
          client.me(channel, `${user} --> That user hasn't set their location! Get them to set it and retry! PANIC`)
        }
        else {
          client.me(channel, `${user} --> The weather in ${cleanedUpUser}'s location (${value.location}) is currently ${value.tempC}°C (${value.tempF}°F) ${value.condition} Wind speed: ${value.windKMH} km/h (${value.windMPH} mp/h) 💨 Humidity: ${value.humidity}% 💧 Cloud Coverage: ${value.cloudCoverage}% ☁️`)
        }
      })
    }
    else {
      getWeatherLocation(specificLocation).then(function(value) {
        client.me(channel, `${user} --> The weather in ${value.location} is currently ${value.tempC}°C (${value.tempF}°F) ${value.condition} Wind speed: ${value.windKMH} km/h (${value.windMPH} mp/h) 💨 Humidity: ${value.humidity}% 💧 Cloud Coverage: ${value.cloudCoverage}% ☁️`)
      })
    }
  }

  if(command === 'wyr') {
    axios.get(`https://would-you-rather-api.abaanshanid.repl.co/`)
      .then((response) => {
        let wyrresult = response.data
        client.me(channel, `${user} --> ${wyrresult.data} `);
      });
  }

  if(command === 'xqcow1') {
    client.me(channel, `${user} --> https://i.imgur.com/OGFxdzB.png`);
  }

  if(command === 'xqcow2') {
    client.me(channel, `${user} --> https://i.imgur.com/d8KqqiD.png`);
  }

  if(command === 'yag') {
    client.me(channel, `${user} --> idk this yagnesh person, but they are making a shit first impression to me xqcMood TeaTime so cringe wtf`);
  }

  if(command === 'ym') {
    db.get("yagmoments").then(function(value) {
      let origym = `${value}`
      let plusoneym = +origym + +1
      db.set("yagmoments", `${plusoneym}`);
      client.me(channel, (`${user} --> There has been ${plusoneym} yag moments peepoChat`)
      )
    })
  }

  if(command === 'zamnkeyword') {
    client.me(channel, `${user} --> https://files.darkvypr.com/backups/zamn.txt ZAMN`);
  }

  if(command === 'zhandy') {
    client.me(channel, `${user} --> https://i.imgur.com/gFaJUwS.png`);
  }

  // Loyalty System

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  if(command === 'cdr') {
    if(cdrcooldown.has(`${user}`)) {
      client.me(channel, (`${user} --> Your cdr is on cooldown. Wait 2 hours in between each cdr. GearScare ⛔`))
    }
    else {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
        if(+nammers < 20) {
          client.me(channel, (`${user} --> GearScare ⛔ You don't have enough nammers for a reset! You have ${nammers} nammers, and need at least 20! Use "!hunt" to get more.`))
        }
        else {
          talkedRecently.delete(`${user}`)
          cdrcooldown.add(`${user}`);
          setTimeout(() => {
            cdrcooldown.delete(`${user}`);
          }, 7200000);

          let nammerscdr = +nammers - 20
          db.set(`${userlow}nammers`, nammerscdr)

          client.me(channel, (`${user} --> Your cooldown has been reset! (-20 nammers) Good luck! NekoPray (2 hr cooldown)`))
        }
      })
    }
  }

  if(command === 'hunt') {
    if(talkedRecently.has(`${user}`)) {
      client.me(channel, (`${user} --> Wait 1 hour in between hunting! GearScare ⛔`))
    }

    else {
      db.get(`${userlow}nammers`).then(function(value) {
			  let nammers = `${value}`
          if(nammers === 'null' || nammers === 'NaN') {
            let nammeramount = Math.round(getRandomInt(30) + 20)
            db.set(`${userlow}nammers`, nammeramount)
            (client.me(channel, (`${user} --> KKona 👋 You caught ${nammeramount} nammers, and have a balance of: ${nammeramount} nammers. Since this is your first time hunting, you get 20 extra. GearSmile Stab`)))

            talkedRecently.add(`${user}`);
            setTimeout(() => {
              talkedRecently.delete(`${user}`);
            }, 3600000);
		      }
          else { 
            let nammeramount = getRandomInt(60)
            if(`${userlow}` === 'darkvypr' || `${userlow}` === 'tyebuddha') {
              console.log(nammeramount)
              let totalnammers = Math.round(+nammers + nammeramount * 1.3)
              db.set(`${userlow}nammers`, totalnammers)
              client.me(channel, (`${user} --> GearSmile ⛓ You caught ${Math.round(nammeramount * 1.3)} (+${Math.round((nammeramount * 1.3) - nammeramount)} EleGiggle ) nammers, and have a total of ${totalnammers} nammers! (30 min cooldown)`))
              
              talkedRecently.add(`${user}`);
              setTimeout(() => {
                talkedRecently.delete(`${user}`);
              }, 1800000);
            }
            else {
              let totalnammers = +nammers + nammeramount
              db.set(`${userlow}nammers`, totalnammers)
              client.me(channel, (`${user} --> GearSmile ⛓ You caught ${nammeramount} nammers, and have a total of ${totalnammers} nammers! (1 hr cooldown)`))
              
              talkedRecently.add(`${user}`);
              setTimeout(() => {
                talkedRecently.delete(`${user}`);
              }, 3600000);
            }
          }
      })
    }
  }

  function killMessage(amount) {
    if(+amount >= 1 && +amount < 20) {
      return `You line ${amount} nammer(s) up in front of a firing squad,`
    }
    else if(+amount >= 20 && +amount < 50) {
      return `You send ${amount} nammer(s) off to "training" (a volcano),`
    }
    else if(+amount >= 50 && +amount < 80) {
      return `You drop a car on ${amount} nammer(s) killing them,`
    }
    else if(+amount >= 80 && +amount < 120) {
      return `You stare ${amount} nammer(s) in the eyes as you stab them one-by-one,`
    }
    else if(+amount >= 120 && +amount < 200) {
      return `You lethally inject ${amount} nammer(s) with rat poison,`
    }
    else if(+amount >= 200 && +amount < 250) {
      return `You fatally electrocute ${amount} nammer(s) one-by-one, make the others watch,`
    }
    else if(+amount >= 250 && +amount < 1000) {
      return `You make ${amount} nammer(s) jump off of a building in a single file line,`
    }
    else {
      return `You enlist ${amount} nammer(s) into the VietNaM war,`
    }
  }
  
  if(command === 'kill') {
		db.get(`${userlow}nammers`).then(function(value) {
			let nammers = `${value}`
        if(nammers === 'null' || +nammers === 0) {
          client.me(channel, (`${user} --> GearScare ⛔ You don't have any nammers to kill! Use "!hunt" to get more.`))
		    }
        else {
          if(+`${args[0]}` > +`${nammers}`) {
            client.me(channel, (`${user} --> MenheraCry You try to kill ${args[0]} nammer(s), but realize that you only have ${nammers} nammer(s), and give up.`))
          }
          else {
            let killamount = `${args[0]}`
            const regex = new RegExp('^([1-9]|[1-9][0-9]{1,6})$');
            testForNumber = `${regex.test(killamount)}`

            if(testForNumber === 'true') {
              let afterkill = +nammers - +killamount
              db.set(`${userlow}nammers`, afterkill)
              client.me(channel, (`${user} --> NekoProud 🔪 ${killMessage(killamount)} and are left with ${afterkill} nammer(s).`))
            }
            else if(`${args[0]}` === 'all') {
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

  if(command === 'nammers') {
    if(`${args[0]}` === 'undefined') {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
          if(nammers === 'null') {
            client.me(channel, (`${user} --> GearScare ⛔ You don't have any nammers! Get some by typing "!hunt", and kill some by typing "!kill {amount}"!`))
          }
          else {
            client.me(channel, (`${user} --> NOTED You have ${nammers} nammer(s). Get some by typing "!hunt", and kill some by typing "!kill {amount}".`))
          }
      })
    }
    else {
      let checkuser = `${args[0]}`.toLowerCase()
      db.get(`${checkuser}nammers`).then(function(value) {
        let nammers = `${value}`
          if(nammers === 'null') {
            client.me(channel, (`${user} --> GearScare ⛔ That user dosent exist!`))
          }
          else {
            client.me(channel, (`${user} --> NOTED ${args[0]} has ${nammers} nammer(s).`))
          }
      })
    }
  }

  if(command === 'give') {
    let giveamount = `${args[1]}`
    const regex = new RegExp('^([1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])$');
    testForNumber = `${regex.test(giveamount)}`

    let recipient = `${args[0]}`

    if(recipient === 'undefined') {
      client.me(channel, (`${user} --> Invalid Syntax. You must specify a recipient, and an amount to give away!`))
    }
    else if(recipient.toLowerCase() === userlow) {
      client.me(channel, (`${user} --> Invalid Syntax. You cannot give nammers to yourself!`))
    }
    else if(`${testForNumber}` === 'true') {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
        if(nammers === 'null' || +nammers === 0) {
          client.me(channel, (`${user} --> GearScare ⛔ You don't have any nammers to give away! Use "!hunt" to get more. ppOverheat`))
        }
        else if(+`${giveamount}` > +`${nammers}`) {
          client.me(channel, (`${user} --> GearScare ⛔ You tried to give away ${giveamount} nammer(s), but you only have ${nammers} nammer(s). You keep all of your nammers for a rainy day.`))
        }
        else {
          db.get(`${recipient.toLowerCase()}nammers`).then(function(valuerecipient) {
            let recipientnammers = `${valuerecipient}`
            if(`${recipientnammers}` === 'null') {
              client.me(channel, `${user} --> That user dosen't exist in the database!`)
            }
            else {
              let aftergive = +nammers - +giveamount
              db.set(`${userlow}nammers`, aftergive)
              let recipientaddednammers = +recipientnammers + +giveamount

              db.set(`${recipient.toLowerCase()}nammers`, recipientaddednammers)
              client.me(channel, `${user} --> GearSmile 👉 🚢 Successfully shipped ${giveamount} nammer(s) to ${recipient.toLowerCase()}! Your new balance is: ${aftergive} nammer(s), and ${recipient.toLowerCase()}'s new balance is: ${recipientaddednammers} nammer(s)!`)
            }
          })
        }
      })
    }
    else if(giveamount === 'all') {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
        if(nammers === 'null' || +nammers === 0) {
          client.me(channel, (`${user} --> GearScare ⛔ It looks like you don't have any nammers to give away! Use "!hunt" to get more. ppOverheat`))
        }
        else if(+`${giveamount}` > +`${nammers}`) {
          client.me(channel, (`${user} --> GearScare ⛔ You tried to give away ${giveamount} nammer(s), but you only have ${nammers} nammer(s). You keep all of your nammers for a rainy day.`))
        }
        else {
          db.get(`${recipient.toLowerCase()}nammers`).then(function(valuerecipient) {
            let recipientnammers = `${valuerecipient}`
            if(`${recipientnammers}` === 'null') {
              client.me(channel, `${user} --> That user dosen't exist in the database!`)
            }
            else {
              let giveamount = nammers
              db.set(`${userlow}nammers`, 0)
              let recipientaddednammers = +recipientnammers + +giveamount

              db.set(`${recipient.toLowerCase()}nammers`, recipientaddednammers)
              client.me(channel, `${user} --> GearSmile 👉 🚢 Successfully shipped all of your nammers (${giveamount}) to ${recipient.toLowerCase()}! ${recipient.toLowerCase()}'s new balance is: ${recipientaddednammers} nammer(s)!`)
            }
          })
        }
      })
    }
    else {
      client.me(channel, (`${user} --> Please enter a valid amount of nammers to give away!`))
    }
  }

  if(command === 'gamble' || command === 'roulette') {
    if(`${args[0]}` === 'undefined') {
      client.me(channel, (`${user} --> PANIC Please enter an amount of nammers to gamble with!`))
    }
    else {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
          if(nammers === 'null' || +nammers === 0) {
            client.me(channel, (`${user} --> You don't have any nammers to gamble with! Type !hunt to get more.`))
          }
          else {
            let gambleamount = `${args[0]}`
            const regex = new RegExp('^([1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])$');
            testForNumber = `${regex.test(gambleamount)}`

            if(testForNumber === 'true') {
              if(+nammers < +gambleamount) {
                client.me(channel, (`${user} --> PANIC You don't have enough nammers! Get more by using !hunt.`))
              }
              else {
                let winloss = getRandomInt(2)
                if(winloss === 1) {
                  let gamblewin = Math.round(+nammers + +gambleamount)
                  db.set(`${userlow}nammers`, `${gamblewin}`)
                  client.me(channel, (`${user} --> You bet ${gambleamount} nammer(s) and won! You now have ${gamblewin} nammers! PagMan 💰`))
                }
                else {
                  let gambleloss = Math.round(+nammers - +gambleamount)
                  db.set(`${userlow}nammers`, `${gambleloss}`)
                  client.me(channel, (`${user} --> You bet ${gambleamount} nammer(s) and lost! You now have ${gambleloss} nammers! SadCat`))
                }
              }        
            }
            else if(`${args[0]}` === 'all') {
              let winloss = getRandomInt(2)
              if(winloss === 1) {
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

  if(command === 'color' || command === 'colour') {
    if(/\b^red$|^blue$|^green$|firebrick|coral|yellowgreen|orangered|seagreen|goldenrod|chocolate|cadetblue|dodgerblue|hotpink|blueviolet|springgreen\b/i.test(`${args.join(' ')}`)) {
      db.get(`${userlow}nammers`).then(function(value){
        if(+value < 300) {
          client.me(channel, (`${user} --> You don't have enough nammers. You need at least 300 to use this command! You have ${value}.`))
        }
        else {
          let deductedNammers = +value - 300
          db.set(`${userlow}nammers`, deductedNammers)
          client.privmsg(channel, `/color ${args[0]}`)
          client.me(channel, `${user} --> You successfully set my color to "${args[0]}", costing you 300 nammers. You now have ${deductedNammers} nammers. TehePelo`)
        }
      })
    }
    else {
      client.me(channel, (`${user} --> That command was not valid. Price: 300 nammers. Available Colours: https://i.darkvypr.com/colours.png`))
    }
  }
  
})