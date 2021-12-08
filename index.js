// require("http").createServer((_, res) => res.end("Alive!")).listen(8080)
const talkedRecently = new Set();
const cdrcooldown = new Set();
const fs = require('fs')
const Database = require("@replit/database")
const db = new Database()
const humanizeDuration = require("humanize-duration");
const axios = require('axios').default;
const { ChatClient, AlternateMessageModifier } = require("dank-twitch-irc");
let client = new ChatClient({
  
  username: process.env['TWITCH_USERNAME'],
  password: process.env['TWITCH_PASSWORD'],

  rateLimits: "verifiedBot",
  maxChannelCountPerConnection: 100, // 90 by default

  connectionRateLimits: {
    parallelConnections: 10,
    releaseTime: 500,
  },

  connection: {
    type: "websocket",
    secure: true,
  },
});

client.use(new AlternateMessageModifier(client));

client.on("ready", () => console.log("Successfully connected to chat"));
client.on("close", (error) => {
  if(error != null) {
    console.error("Client closed due to error", error);
  }
});

client.on("PRIVMSG", (msg) => {
  console.log(`[#${msg.channelName}] ${msg.displayName}: ${msg.messageText}`);
});

const channelsFile = 'channels.txt'
const channelOptions = fs.readFileSync(channelsFile).toString().split('""').filter(
  function(i){return i != null;}).join('').split(' ')

client.connect();
client.joinAll(channelOptions)

client.on("PRIVMSG", (msg) => {

   // BASIC VARIABLES

  let user = msg.displayName
  let userlow = msg.displayName.toLowerCase()
  let channel = msg.channelName
  let message = msg.messageText

  // Command Usage Counter

  if(userlow === 'vyprbot') {
    db.get("commandusage").then(function(value) {
      let origusage = `${value}`
      let plusoneusage = +origusage + 1
      db.set("commandusage", plusoneusage);
      console.log(plusoneusage)
    })
  }

  if(!message.startsWith('!') || userlow === 'vyprbot') {
    return
  }

  const PREFIX = "!";
  let [command, ...args] = msg.messageText.slice(PREFIX.length).split(/ +/g);

  // Variables

  var defaultname = `${args[0]}`
  if(defaultname === 'undefined')
    var defaultname = `${user}`

  var defaultname2 = `${args[1]}`
  if(defaultname2 === 'undefined')
    var defaultname2 = `${user}`

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

  if(command === 'join') {
    if(`${userlow}` === 'darkvypr') {
      client.join(`${args[0].toLowerCase()}`)
      let content = ' ' + args[0].toLowerCase()
      fs.writeFile('channels.txt', content, { flag: 'a+' }, err => {})
      client.say(channel, (`${user} --> Succesfully joined channel: "${args[0].toLowerCase()}"! MrDestructoid 👍`))
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  if(command === 'part') {
    if(`${userlow}` === 'darkvypr') {
      const channellist = fs.readFileSync(channelsFile).toString()
      let removedchannel = channellist.replace(`${args[0].toLowerCase()}`, '')
      let removedchannelandspaces = removedchannel.replace(/\s\s+/g, ' ').trim()
      
      fs.writeFile('channels.txt', removedchannelandspaces, err => {})
      client.say(channel, (`${user} --> Succesfully left channel: "${args[0].toLowerCase()}"! SadCat`))
      client.part(`${args[0].toLowerCase()}`)
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  if(command === 'datadelete') {
    if(`${userlow}` === 'darkvypr') {
      db.get(`${args[0]}`).then(function(value) {
        let valueofkey = `${value}`
        client.say(channel, (`${user} --> Succesfully deleted key: "${args[0]}" value: "${valueofkey}" MODS`))
        db.delete(`${args[0]}`)
      })
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  if(command === 'datacreate') {
    if(`${userlow}` === 'darkvypr') {
      db.set(`${args[0]}`, `${args[1]}`);
      client.say(channel, `${user} --> Succesfully added key: "${args[0]}"  value: "${args[1]}" NOTED`)
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  if(command === 'datainspect') {
    if(`${userlow}` === 'darkvypr') {
      db.get(`${args[0]}`).then(function(value) {
        client.say(channel, (`${user} --> Key: "${args[0]}" Value: "${value}". NOTED`))
      })
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  if(command === 'datalist') {
    if(`${userlow}` === 'darkvypr') {
      db.list()
      .then(keys => console.log(keys))
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  if(command === 'setnammers') {
    if(`${userlow}` === 'darkvypr') {
      db.set(`${args[0]}nammers`, `${args[1]}`)
      client.say(channel, (`${user} --> Set ${args[0]}'s nammers to ${args[1]}!`))
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  if(command === 'addnammers') {
    if(`${userlow}` === 'darkvypr') {
      db.get(`${args[0]}nammers`).then(function(value) {
        let addednammers = +value + +args[1]
        db.set(`${args[0]}nammers`, addednammers)
        client.say(channel, (`${user} --> Gave ${args[1]} nammers to ${args[0]}!`))
      })
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  if(command === 'cooldownoverride') {
    if(`${userlow}` === 'darkvypr') {
      talkedRecently.delete(`${args[0]}`)
      client.say(channel, `${user} --> Reset the cooldown of user: "${args[0]}"!`);
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  // Bot Info

  if(command === 'ping' || command === 'help' || command === 'info') {

    db.get("commandusage").then(function(value) {
      let usage = +value + 1
      let latency = Math.floor(Math.random() * 70)
      let Sseconds = process.uptime()

      client.say(channel, (`PunOko 🏓 ${user} --> | Latency: ${latency} ms | Bot Uptime: ${cleanSeconds(Sseconds)} | Commands Used: ${usage} | Prefix: "!" | Use !commands to get a list of commands. | Use !request for info on requesting the bot.`))
    })
  }

  if(command === 'commands') {
    client.say(channel, `${user} --> A list of commands can be found here NekoProud 👉 https://darkvypr.com/commands`);
  }

  // Set Commands

  if(command === 'settwitter') {
    db.set(`${userlow}twitter`, `${args[0]}`)
      .then(() => db.list())
      .then(keys => console.log(keys))
      .then(client.say(channel, `${user} --> Succesfully set your Twitter account to ${args[0]}!`))
  }

  if(command === 'setbirthday') {
    let bdaymonthlow = `${args.join(' ')}`
    let bdaymonthup = bdaymonthlow[0].toUpperCase() + bdaymonthlow.substring(1)
    db.set(`${userlow}bday`, `${bdaymonthup}`)
      .then(client.say(channel, `${user} --> Succesfully set your birthday to ${bdaymonthup}!`))
  }

  if(command === 'setlocation') {
    let location1 = `${args[0]}`
    let location2 = `${args[1]}`

    if(`${location1}`  === 'undefined') {
      client.say(channel, `${user} --> That's not a valid location! Examples: "!setlocation stockholm sweden" or "!setlocation springfield virginia".`)
    }
    else {
      if(`${location2}` === 'undefined') {
        client.say(channel, `${user} --> That's not a valid location! Examples: "!setlocation stockholm sweden" or "!setlocation springfield virginia".`)
      }
      else {
        let location1up = location1[0].toUpperCase() + location1.substring(1)
        let location2up = location2[0].toUpperCase() + location2.substring(1)

        let finallocation = `${location1up}, ${location2up}`

        db.set(`${userlow}time`, `${finallocation}`)
        .then(client.say(channel, `${user} --> Succesfully set your location to ${finallocation}!`))
      }
    }
  }

  if(command === 'locationoverride') {
    if(`${userlow}` === 'darkvypr') {
      db.set(`pvcL777time`, `Milano, Italy`);
    }
    else {
      client.say(channel, `Whoops! ${user} --> you don't have the required permission to use that command!`);
    }
  }

  // Social Commands - Self Promo

  if(command === 'disc' || command === 'discord') {
    client.say(channel, `Join the homie server ${user} TriHard 👉 http://idiotas.darkvypr.com`);
  }

  if(command === 'youtube'|| command === 'yt') {
    if(channel === '#darkvypr' || `${userlow}` === 'darkvypr') {
      client.say(channel, `${user} --> Sub pls AYAYAsmile http://yt.darkvypr.com`);
    }
    else {
      client.say(channel, `${user} --> GearScare This command is only available in DarkVypr's chat`);
    }
  }

  if(command === 'twitter') {
    db.get(`${userlow}twitter`).then(function(value) {
      let sendertwitter = `${value}`
      if(sendertwitter !== 'null') {
        client.say(channel, (`${user} --> ${user}'s Twitter can be found at: https://twitter.com/${sendertwitter}`))
      }
      else {
        client.say(channel, (`${user} --> To use the "!twitter" command, you must first set your Twitter account with the !settwitter command, followed by your twitter handle. Example: "!settwitter darkvyprr". More info: https://darkvypr.com/commands YESIDOTHINKSO`))
      }
    })
  }

  if(command === 'github' || command === 'git') {
    if(channel === '#darkvypr' || `${userlow}` === 'darkvypr') {
      client.say(channel, `${user} --> peepoChat http://git.darkvypr.com`);
    }
    else {
      client.say(channel, `GearScare This command is only available in DarkVypr's chat ${user}`); 
    }
  }

  if(command === 'site' || command === 'website' || command === 'links') {
    if(channel === '#darkvypr' || `${userlow}` === 'darkvypr') {
      client.say(channel, `${user} --> https://darkvypr.com NekoProud`);
    }
    else {
      client.say(channel, `GearScare This command is only available in DarkVypr's chat ${user}`);
    }
  }

  // Suggestions

  if(command === 'vbsuggest') {
    if(`${args[0]}` === 'undefined') {
      client.say(channel, `${user} --> You must provide a suggestion when using this command. Example: "!suggest I would like the bot to be added to my channel."`)
    }
    else {
      db.get('suggestion').then(function(value) {
        let plusone = +value + 1
        db.set("suggestion", plusone);

        let content = `${args.join(' ')}`
        let today = new Date().toISOString().slice(0, 10)
        let state = 'ACTIVE'

        fs.writeFile(`suggestions/${user}_ID:${plusone}.txt`, `User: ${user} | State: ${state} | Date: ${today} | Suggestion: ${content}`, err => {})
        client.say(channel, `${user} --> Your suggestion has been saved and will be read shortly. (ID: ${plusone})`)
      })
    }
  }

  // General Commands - Not Self Promo or attached to me

  if(command === '7tvemote') {
    client.say(channel, `${user} --> https://7tv.app/emotes?sortBy=popularity&page=0&query=${args[0]}`);
  }

  if(command === '7tvuser') {
    client.say(channel, `${user} --> https://7tv.app/users/${defaultname}`);
  }

  if(command === '8ball') {
    axios.get(`https://8ball.delegator.com/magic/JSON/${args.join(' ')}`)
      .then((response) => {
        let ballresults = response.data
        client.say(channel, `${user} --> The 8-Ball says: ${ballresults.magic.answer}`);
      });
  }

  if(command === 'adblock') {
    client.say(channel, `${user} --> TriHard UBLOCK FILTERS: https://bit.ly/3j36lKB CHROME STORE: https://bit.ly/30hvkTF`);
  }

  if(command === 'alogs') {
    console.log({ command, args });
    client.say(channel, `${user} --> https://logs.apulxd.ga/?channel=${defaultname2}&username=${defaultname}`)
  }

  /*if(command === 'birthday') {
    if(`${args[0]}` === 'undefined') {
      db.get(`${userlow}bday`).then(function(value) {
        let bdayvalue = `${value}`
        if(bdayvalue === 'null') {
          client.say(channel, `${user}, To use the "!birthday" command, you must first set your birthday with the "!setbirthday" command. Example: "!setbirthday August 14". More info: https://darkvypr.com/commands`)
        }
        else {
          client.say(channel, `${user}, Your birthday is on ${bdayvalue}!`)
        }
      })
    }
    else {
      db.get(`${args[0]}bday`).then(function(value) {
        let bdayvalue = `${value}`
        client.say(channel, `${user}, ${args[0]}'s birthday is on ${bdayvalue}!`)
      }) 
    }
  }*/

  if(command === 'bm') {
    db.get("bisiomoments").then(function(value) {
      let origbm = `${value}`
      let plusonebm = +origbm + +1
      db.set("bisiomoments", `${plusonebm}`);
      client.say(channel, (`${user} --> There has been ${plusonebm} bisio moments donkJAM`)
      )
    })
  }

  if(command === 'botlist') {
    client.say(channel, `${user} --> MrDestructoid BOP https://files.darkvypr.com/DarkVyprBotList.txt`);
  }

  if(command === 'breed') {
    client.say(channel, `${user} breeds with ${args[0]} for hours LewdAhegao spilledGlue`);
  }

  if(command === 'bttvemote') {
    client.say(channel, `${user} --> https://betterttv.com/emotes/shared/search?query=${args[0]}`);
  }

  if(command === 'cat') {
    axios.get('https://api.thecatapi.com/v1/images/search')
      .then((response) => {
        let catimage = response.data[0]
        client.say(channel, `${user} --> Random cat: ${catimage.url}`);
      });
  }

  if(command === 'catfact') {
    axios.get('https://catfact.ninja/fact?max_length=300')
      .then((response) => {
        let catfact = response.data
        client.say(channel, `${user} --> ${catfact.fact}`);
      });
  }

  if(command === 'channels') {
    client.say(channel, `${user} --> A list of the channels I am in are available here: http://channels.darkvypr.com/ | Use !request for info on how to get the bot in your chat!`);
  }

  if(command === 'chatterino') {
    client.say(channel, `${user} --> Homies: http://chatterinohomies.darkvypr.com Dankerino: http://dankerino.darkvypr.com`);
  }

  if(command === 'christmas') {
    today = new Date();

    xmas = new Date("December 25, 2021");
    msPerDay = 24 * 60 * 60 * 1000;
    timeLeft = (xmas.getTime() - today.getTime());
    e_daysLeft = timeLeft / msPerDay;
    daysLeft = Math.floor(e_daysLeft);
    e_hrsLeft = (e_daysLeft - daysLeft) * 24;
    hrsLeft = Math.floor(e_hrsLeft);
    minsLeft = Math.floor((e_hrsLeft - hrsLeft) * 60);

    client.say(channel, `${user} --> There is ${daysLeft} days, ${hrsLeft} hours and ${minsLeft} minutes left until christmas! peepoSnow 🎄`);
  }

  if(command === 'code') {
    if(`${args[0]}` === 'undefined') {
      client.say(channel, `${user} --> The code for the whole bot can be found at: http://bot.darkvypr.com/ | Input a command name to view the code for a command. Example: "!code loyalty".`);
    }
    else {
      client.say(channel, `${user} --> The ${args[0]} command's code can be found at: https://code.darkvypr.com/${args[0]}.txt`);
    }
  }

  if(command === 'coin') {
    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }
    let flipresult = getRandomInt(5)
    if(flipresult <= 2) {
      client.say(channel, `${user} --> Result of your coin flip: "Heads!" (Yes)`);
    }
    else {
        client.say(channel, `${user} --> Result of your coin flip: "Tails!" (No)`);
    }
  }

  if(command === 'coomer') {
    client.say(channel, `${user} --> https://i.imgur.com/PqQCXC3.png`);
  }

	if(command === 'covid') {
    if(`${args[0]}` === 'undefined') {
      db.get(`${userlow}time`).then(function(value) {
        let usercitycountry = `${value}`
        if(usercitycountry === 'null') {
          client.say(channel, `${user} --> Before using this command, you must set your location with the !setlocation command. Example: “!setlocation lasalle ontario”, “!setlocation springfield virginia” or “!setlocation stockholm sweden”. More info: https://darkvypr.com/commands`)
        }
        else {
          axios.get(`https://api.tomtom.com/search/2/search/${usercitycountry}.json?key=${process.env['COUNTRY_CONVERT_KEY']}`)
          .then((response) => {
            let convertedcountry = response.data
            let parsedconvertedcountry = `${convertedcountry.results[0].address.country}`

          axios.get(`https://disease.sh/v3/covid-19/countries/${parsedconvertedcountry}`)
          .then((response) => {
            let covidusercountry = response.data
            client.say(channel, `${user} --> Stats for your country (${covidusercountry.country}): Today's Cases: ${covidusercountry.todayCases} | Today's Deaths: ${covidusercountry.todayDeaths} | Total Cases: ${covidusercountry.cases} | Total Deaths: ${covidusercountry.deaths}`)
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
            client.say(channel, (`${user} --> That user hasen't set their location! Get them to set it and retry. PANIC`))
		      }
          else {
            axios.get(`https://api.tomtom.com/search/2/search/${lookuptime}.json?key=${process.env['COUNTRY_CONVERT_KEY']}`)
            .then((response) => {
              let convertedcountry = response.data
              let parsedconvertedcountry = `${convertedcountry.results[0].address.country}`

            axios.get(`https://disease.sh/v3/covid-19/countries/${parsedconvertedcountry}`)
            .then((response) => {
              let covidusercountry = response.data
              client.say(channel, `${user} --> Stats for ${specificlocation}'s country (${covidusercountry.country}): Today's Cases: ${covidusercountry.todayCases} | Today's Deaths: ${covidusercountry.todayDeaths} | Total Cases: ${covidusercountry.cases} | Total Deaths: ${covidusercountry.deaths}`)
            });
            });
          }
        })
      }

      else {
        axios.get(`https://disease.sh/v3/covid-19/countries/${args.join(' ')}`)
          .then((response) => {
            let coviduserquery = response.data
            client.say(channel, `${user} --> Stats for ${coviduserquery.country}: Today's Cases: ${coviduserquery.todayCases} | Today's Deaths: ${coviduserquery.todayDeaths} | Total Cases: ${coviduserquery.cases} | Total Deaths: ${coviduserquery.deaths}`)
          });
      }
    }
  }

  if(command === 'dance') {
    client.say(channel, `${user} elisDance https://i.darkvypr.com/dance.mp4`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
    client.say(channel, `elisDance`);
  }

  if(command === 'define') {
    axios.get(`https://dictionaryapi.com/api/v3/references/collegiate/json/${args.join(' ')}?key=${process.env['DICTIONARY_KEY']}`)
      .then((response) => {
        let defineresult = response.data[0]
        if(`${defineresult}` === 'undefined') {
          client.say(channel, `${user} --> No definition available for that string or word!`)
        }
        else {
          let shortanswer = `${defineresult.shortdef}`
          if(`${shortanswer}` === 'undefined') {
            client.say(channel, `${user} --> No definition available for that string or word!`)
          }
          else {
            client.say(channel, `${user} --> Definition: ${shortanswer}`)
          }
        }
      });
  }

  if(command === 'derick') {
    client.say(channel, `${user} --> https://i.imgur.com/Uo9K0xk.png`);
  }

  if(command === 'dogjam') {
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
    client.say(channel, `dogJAM`);
  }

  if(command === 'domain') {
    if(`${args[0]}` === 'undefined') {
      client.say(channel, `${user} --> Please input a domain to lookup!`)
    }
    else {
      axios.get(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${process.env['WHOIS_KEY']}&domainName=${args[0]}&outputFormat=JSON&ipWhois=1&preferFresh=1`)
      .then((response) => {
        let whoisresults = response.data
        if(`${whoisresults.WhoisRecord.dataError}` === 'INCOMPLETE_DATA') {
          client.say(channel, `${user} --> There was an error loading the data for ${args[0]}! Hint: That TLD isn't supported, or the domain dosent exist.`)
        }
        else {
          client.say(channel, `${user} --> Info for "${whoisresults.WhoisRecord.domainName}" Registrant Name: ${whoisresults.WhoisRecord.registrant.name} | Registrar Name: ${whoisresults.WhoisRecord.registrarName} | Location: ${whoisresults.WhoisRecord.registrant.city}, ${whoisresults.WhoisRecord.registrant.country} | Created: "${whoisresults.WhoisRecord.registryData.audit.createdDate}"`);
        }
      })
    }
  }

  if(command === 'elischat') {
    if(channel === '#darkvypr' || `${userlow}` === 'darkvypr') {
      client.say(channel, `${user} --> https://i.imgur.com/J3qKoiZ.png`);
    }
    else {
      client.say(channel, `GearScare This command is only available in DarkVypr's chat ${user}`);
    }
  }

  if(command === 'emotes') {
    if(`${args[0]}` === 'undefined') {
      axios.get(`https://api.ivr.fi/twitch/resolve/${user}`)
      .then((response) => {
      let userdata = response.data
      client.say(channel, `${user} --> The emotes for ${userdata.displayName} can be found at: https://emotes.raccatta.cc/twitch/${userdata.displayName}`);
      });
    }
    else {
      axios.get(`https://api.ivr.fi/twitch/resolve/${args[0]}`)
      .catch(err => { client.say(channel, `${user} --> That user doesn't exist!`)})
      .then((response) => {
      let userdata = response.data
      client.say(channel, `${user} --> The emotes for ${userdata.displayName} can be found at: https://emotes.raccatta.cc/twitch/${userdata.displayName}`);
      });  
    }
  }

  if(command === 'farmer') {
    client.say(channel, `${user} --> MrDestructoid Farmer: http://miner.darkvypr.com`);
    client.say(channel, `${user} --> Setup: https://youtu.be/0VkM7NOZkuA`);
  }

  if(command === 'ffzemote') {
    client.say(channel, `${user} --> https://www.frankerfacez.com/emoticons/?q=${args[0]}&sort=count-desc&days=0`);
  }

  if(command === 'filerepo') {
    client.say(channel, `${user} --> http://filerepo.darkvypr.com`);
  }

  if(command === 'filters') {
    client.say(channel, `${user} --> http://settings.darkvypr.com`);
  }

  if(command === 'firstlog') {
    axios.get(`https://api.ivr.fi/logs/firstmessage/${logschannel}/${defaultname}`)
    .catch(err => { client.say(channel, `${user} --> That channel or user doesn't exist, or is not logged!`)})
    .then((response) => {
      let firstmessage = response.data
      client.say(channel, `${user} --> ${firstmessage.user}'s first message in #${logschannel} was "${firstmessage.message}" and that was sent ${firstmessage.time} ago.`)
    });
  }

  if(command === 'followbutton') {
    client.say(channel, `${user} --> https://i.darkvypr.com/follow.mp4`);
  }

  if(command === 'followers') {
    client.say(channel, `${user} --> Visit: https://twitch-tools.rootonline.de/followerlist_viewer.php?channel=${defaultname} for a list of people that follow ${defaultname} NOTED`);
  }

  if(command === 'following') {
    client.say(channel, `${user} --> Visit: https://okayeg.com/followlist?username=${defaultname} for a list of people that ${defaultname} is following.`);
  }

  if(command === 'fuck') {
    client.say(channel, `${user} fucks ${args[0]} LewdAhegao spilledGlue`);
  }

  if(command === 'gnkiss') {
    client.say(channel, `${user} tucks ${args[0]} to bed and gently kisses their cheek: ${gnkissmsg}`);
  }

  if(command === 'hare') {
    client.say(channel, `${user} --> https://i.imgur.com/3Sor3Wg.jpg`);
  }

  if(command === 'harrison1') {
    client.say(channel, `${user} --> https://i.imgur.com/zn65wUW.png`);
  }

  if(command === 'harrison2') {
    client.say(channel, `${user} --> https://i.imgur.com/niKaezK.mp4`);
  }

  if(command === 'harrison3') {
    client.say(channel, `${user} --> https://i.imgur.com/8aT41ls.png`);
  }

  if(command === 'hug') {
    client.say(channel, `${user} --> picks ${args[0]} up off of their feet and squeezes them tight ${hugmsg} 💗`);
  }

  if(command === 'imagerepo') {
    client.say(channel, `${user} --> http://imagerepo.darkvypr.com`);
  }

  if(command === 'ip') {
    axios.get(`http://api.ipstack.com/${args[0]}?access_key=${process.env['IP_KEY']}`)
      .then((response) => {
        let ipresults = response.data
        client.say(channel, `${user} --> Results for "${ipresults.ip}": Type: "${ipresults.type}" | Location ( ${ipresults.location.country_flag_emoji} ): "${ipresults.city}, ${ipresults.region_name}, ${ipresults.country_name}"`);
      });
  }

  if(command === 'isbot') {
    axios.get(`https://api.ivr.fi/twitch/resolve/${args[0]}`)
    .catch(err => { client.say(channel, `${user}, That user doesn't exist!`)})
    .then((response) => {
      let userdata = response.data
      if(`${userdata.bot}` === 'true') {
        client.say(channel, `${user} --> User, "${userdata.displayName}" is a verified bot! ✅`)
      }
      else {
        client.say(channel, `${user} --> User, "${userdata.displayName}" is NOT a verified bot! ❌`)
      }
    });
  }

  if(command === 'kaf1') {
    client.say(channel, `${user} --> https://i.imgur.com/J99I0oD.mp4`);
  }

  if(command === 'kaf2') {
    client.say(channel, `${user} --> https://i.imgur.com/kKuxUBW.png`);
  }

  if(command === 'kanye') {
    axios.get('https://api.kanye.rest/')
      .then((response) => {
        let kanyequote = response.data
        client.say(channel, `${user} --> Random Kanye Quote: "${kanyequote.quote}"`);
      });
  }

  if(command === 'kiss') {
    client.say(channel, `${user} pulls ${args[0]} close and kisses them on the lips. ${kissmsg} 💋💖`);
  }

  if(command === 'kitten') {
    client.say(channel, `${user} --> https://i.imgur.com/3djjWjE.mp4 Whos my good wittwe~ kitten? I~ I am~ *shits* Uh oh~ ^w^ Kitten did you just make a poopy~ woopy~ iny youw panytsy~ wanytsys~? ^w^ I... I did daddy~ Im sowwy~ ^w^ ^w^ ^w^ Its ok kitten, i wike my kitten a wittwe *shits* *whispews* stinyky~ winyky~`);
  }

  if(command === 'list' || command === 'cutelist') {
    client.say(channel, `${user} --> https://cutelist.github.io/#/ SoCute`);
  }

  if(command === 'logs') {
    console.log({ command, args });
    client.say(channel, `${user} --> https://logs.ivr.fi/?channel=${logschannel}&username=${defaultname}`)
  }

  if(command === 'marbles') {
    client.say(channel, `${user} --> https://www.youtube.com/watch?v=IHZQ-23jrps NekoProud`);
  }

  if(command === 'minglee') {
    client.say(channel, `${user} --> https://www.youtube.com/watch?v=OjNpRbNdR7E`);
    client.say(channel, `MingLee 🇨🇳 GLORY TO THE CCP`);
  }

  if(command === 'modlookup') {
    client.say(channel, `MODS https://modlookup.3v.fi/u/${defaultname} some channels won't be listed as they aren't tracked ${user}.`);
  }

  if(command === 'nam') {
    client.say(channel, `${user} --> 👉 🚪 NammersOut elisDance NammersOut`);
  }

  if(command === 'noah') {
    client.say(channel, `${user} --> https://i.imgur.com/Dn0CjkF.png`);
  }

  if(command === 'numbers') {
    client.say(channel, `${user} --> NOTED https://darkvypr.com/numbers`);
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
        let ocrresults = response.data
        client.say(channel, `${user} --> OCR Results: ${ocrresults.ParsedResults[0].ParsedText}`);
      });
  }

  if(command === 'pfp') {
    if(`${args[0]}` === 'undefined') {
     axios.get(`https://api.ivr.fi/twitch/resolve/${user}`)
      .then((response) => {
        let userdata = response.data
        client.say(channel, `${user} --> ${userdata.logo}`)
      });
    }
    else {
     axios.get(`https://api.ivr.fi/twitch/resolve/${args[0]}`)
      .catch(err => { client.say(channel, `${user}, That user doesn't exist!`)})
      .then((response) => {
        let userdata = response.data
        client.say(channel, `${user} --> ${userdata.logo}`)
      });
    }
  }

  if(command === 'picsbeforedisaster') {
    client.say(channel, `${user} --> https://i.imgur.com/1hKKEx0.png`);
  }

  if(command === 'pings') {
    client.say(channel, `${user} --> DinkDonk https://darkvypr.com/pings`);
  }

  if(command === 'plop1') {
    client.say(channel, `${user} --> https://i.imgur.com/jfVieNQ.png`);
  }

  if(command === 'plop2') {
    client.say(channel, `${user} --> https://i.imgur.com/PAjqrhD.png`);
  }

  if(command === 'plop3') {
    client.say(channel, `${user} --> https://i.imgur.com/dwMMtSD.png`);
  }

  if(command === 'plop4') {
    client.say(channel, `${user} --> https://i.imgur.com/EMixIJq.png`);
  }

  if(command === 'plop5') {
    client.say(channel, `${user} --> https://i.imgur.com/BX5GXFO.png`);
  }

  if(command === 'plop6') {
    client.say(channel, `${user} --> https://i.imgur.com/4PUBRLf.png`);
  }

  if(command === 'plop7') {
    client.say(channel, `${user} --> https://i.imgur.com/g7vIKbC.png`);
  }

  if(command === 'plop8') {
    client.say(channel, `${user} --> https://i.imgur.com/gBoJaoD.png`);
  }

  if(command === 'plop9') {
    client.say(channel, `${user} --> https://i.imgur.com/vKyWwTE.png`);
  }

  if(command === 'plop10') {
    client.say(channel, `${user} --> https://i.imgur.com/tPNuJ4r.png`);
  }

  if(command === 'plopcolour') {
    client.say(channel, `${user} --> #94DCCC`);
  }

  if(command === 'pm') {
    db.get("plopmoments").then(function(value) {
      let origpm = `${value}`
      let plusonepm = +origpm + +1
      db.set("plopmoments", `${plusonepm}`);
      client.say(channel, (`${user} --> There has been ${plusonepm} plop moments donkJAM`)
      )
    })
  }

  if(command === 'query') {
    axios.get(`https://api.wolframalpha.com/v1/result?i=${args.join(' ')}&appid=${process.env['WOLFRAM_KEY']}`)
      .catch(err => { client.say(channel, `${user} --> Wolfram|Alpha did not understand your question! PANIC`)}) 
      .then((response) => {
        let queryresults = response.data
        client.say(channel, `${user} Results: ${queryresults}`);
        })
  }

  if(command === 'regex101pings') {
    client.say(channel, `${user} --> DinkDonk https://regex101.com/r/WtN0Sp/12`);
  }

  if(command === 'request') {
    client.say(channel, `${user} --> If you would like the bot in your chat, you can use the !vbsuggest command. Example: "!vbsuggest I would like the bot added to my channel."`);
  }

  if(command === 'say' || command === 'echo') {
    client.say(channel, `👥 ${args.join(' ')}`);
  }

  if(command === 'specs') {
    client.say(channel, `${user} --> https://darkvypr.com/specs NekoProud`);
  }

  if(command === '🥪') {
    client.say(channel, `${user} --> https://www.youtube.com/shorts/7XkP11Pomuc`);
  }

	if(command === 'time') {
    if(`${args[0]}` === 'undefined') {
      db.get(`${userlow}time`).then(function(value) {
        let senderttime = `${value}`
        if(senderttime === 'null') {
          client.say(channel, `${user} --> Before using this command, you must set your location with the !setlocation command. Example: “!setlocation lasalle ontario”, “!setlocation springfield virginia” or “!setlocation stockholm sweden”. More info: https://darkvypr.com/commands`)
        }
        else {
          axios.get(`https://timezone.abstractapi.com/v1/current_time/?api_key=${process.env['TIME_KEY']}&location=${senderttime}`)
          .then((response) => {
            let timeresults = response.data
            let datetime = timeresults.datetime
            let date = datetime[5] + datetime[6] + '/' + datetime[8] + datetime[9] + '/' + datetime[0] + datetime[1] + datetime[2] + datetime[3]
            let hourfromdatetime = datetime[11] + datetime[12]
            let restofdatetime = datetime[13] + datetime[14] + datetime[15] + datetime[16] + datetime[17] + datetime[18]
            if(+hourfromdatetime > 12) {
              let toampm = (+hourfromdatetime - 12) + restofdatetime + ' pm'
              client.say(channel, (`${user} --> The time in your location, ${senderttime} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))
            }
            else if(+hourfromdatetime === 12) {
              let toampm = 12 + restofdatetime + ' pm'
              client.say(channel, (`${user} --> The time in your location, ${senderttime} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`)) 
            }
            else if(+hourfromdatetime === 00) {
              let toampm = 12 + restofdatetime + ' am'
              client.say(channel, (`${user} --> The time in your location, ${senderttime} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`)) 
            } 
            else {
              let hourfromdatetime = datetime[12]
              let toampm = hourfromdatetime + restofdatetime + ' am'
              client.say(channel, (`${user} --> The time in your location, ${senderttime} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))
            }
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
            client.say(channel, (`${user} --> That user hasen't set their location! Get them to set it and retry. PANIC`))
		      }
          else {
            axios.get(`https://timezone.abstractapi.com/v1/current_time/?api_key=${process.env['TIME_KEY']}&location=${lookuptime}`)
            .then((response) => {
              let timeresults = response.data
              let datetime = timeresults.datetime
              let date = datetime[5] + datetime[6] + '/' + datetime[8] + datetime[9] + '/' + datetime[0] + datetime[1] + datetime[2] + datetime[3]
              let hourfromdatetime = datetime[11] + datetime[12]
              let restofdatetime = datetime[13] + datetime[14] + datetime[15] + datetime[16] + datetime[17] + datetime[18]
              if(+hourfromdatetime > 12) {
                let toampm = (+hourfromdatetime - 12) + restofdatetime + ' pm'
                client.say(channel, (`${user} --> @${removedatsign}'s local time, ${lookuptime} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))
              }
              else if(+hourfromdatetime === 12) {
                let toampm = 12 + restofdatetime + ' pm'
                client.say(channel, (`${user} --> @${removedatsign}'s local time, ${lookuptime} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))
              }
              else if(+hourfromdatetime === 00) {
                let toampm = 12 + restofdatetime + ' am'
                client.say(channel, (`${user} --> @${removedatsign}'s local time, ${lookuptime} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))              } 
              else {
                let hourfromdatetime = datetime[12]
                let toampm = hourfromdatetime + restofdatetime + ' am'
                client.say(channel, (`${user} --> @${removedatsign}'s local time, ${lookuptime} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))
              }
            });
          }
        })
      }
      else {
        axios.get(`https://timezone.abstractapi.com/v1/current_time/?api_key=${process.env['TIME_KEY']}&location=${args.join(' ')}`)
          .then((response) => {
            let timeresults = response.data
            let datetime = timeresults.datetime
            let date = datetime[5] + datetime[6] + '/' + datetime[8] + datetime[9] + '/' + datetime[0] + datetime[1] + datetime[2] + datetime[3]
            let hourfromdatetime = datetime[11] + datetime[12]
            let restofdatetime = datetime[13] + datetime[14] + datetime[15] + datetime[16] + datetime[17] + datetime[18]
            if(+hourfromdatetime > 12) {
              let toampm = (+hourfromdatetime - 12) + restofdatetime + ' pm'
              client.say(channel, (`${user} --> The time in ${args.join(' ')} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))
            }
            else if(+hourfromdatetime === 12) {
              let toampm = 12 + restofdatetime + ' pm'
              client.say(channel, (`${user} --> The time in ${args.join(' ')} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`)) 
            }
            else if(+hourfromdatetime === 00) {
              let toampm = 12 + restofdatetime + ' am'
              client.say(channel, (`${user} --> The time in ${args.join(' ')} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))
            } 
            else {
              let hourfromdatetime = datetime[12]
              let toampm = hourfromdatetime + restofdatetime + ' am'
              client.say(channel, (`${user} --> The time in ${args.join(' ')} (${timeresults.timezone_abbreviation}) is: ${toampm} and the date is: ${date} ⌚`))
            }
          });
      }
    }
  }

  if(command === 'urban') {
    axios.get(`https://api.urbandictionary.com/v0/define?term=${args.join(' ')}`)
      .then((response) => {
        let urbanresult = response.data
        if(`${urbanresult.list[0]}` === 'undefined') {
          client.say(channel, `${user} --> Urban Dictionary does not have a definition for that word!`)
        }
        else {
          let dirtyresponse = urbanresult.list[0].definition
          let cleanedupresponse = dirtyresponse.replace(/\[|\]/gim, '')
          client.say(channel, `${user} --> ${cleanedupresponse}`)
        }
      });
  }

  if(command === 'vanish') {
    client.say(channel, `𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙﷽𒅌꧅  DamnWart 𒌧𒅃꧅꧅𒈓𒈙꧅𒈙𒈙ဪဪ𒈙`);
  }

  if(command === 'vei') {
    client.say(channel, `veiSway`);
    client.say(channel, `veiSway`);
    client.say(channel, `veiSway`);
    client.say(channel, `veiSway`);
    client.say(channel, `veiSway`);
  }

  if(command === 'vm') {
    db.get("vyprmoments").then(function(value) {
      let origvm = `${value}`
      let plusonevm = +origvm + +1
      db.set("vyprmoments", `${plusonevm}`);
      client.say(channel, (`${user} --> There has been ${plusonevm} vypr moments peepoShy`)
      )
    })
  }

  if(command === 'vyprcolour') {
    client.say(channel, `${user} --> #FF7FD3`);
  }

	if(command === 'weather') {
    if(`${args[0]}` === 'undefined') {
      db.get(`${userlow}time`).then(function(value) {
        let usercitycountry = `${value}`
        if(usercitycountry === 'null') {
          client.say(channel, `${user} --> Before using this command, you must set your location with the !setlocation command. Example: “!setlocation lasalle ontario”, “!setlocation springfield virginia” or “!setlocation stockholm sweden”. More info: https://darkvypr.com/commands`)
        }
        else {
          axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${usercitycountry}&apiKey=${process.env['GEOCODING_KEY']}`)
          .then((response) => {
            let unparsedcoords = response.data
            let parsedcoordslat = `${unparsedcoords.items[0].position.lat}`
            let parsedcoordslong = `${unparsedcoords.items[0].position.lng}`
            let namefromapi = `${unparsedcoords.items[0].title}`
            

          axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${parsedcoordslat}&lon=${parsedcoordslong}&units=metric&appid=${process.env['WEATHER_KEY']}`)
          .then((response) => {
            let weatherresults = response.data

            let checkcondition = `${weatherresults.weather[0].main}`
            let checkicon = `${weatherresults.weather[0].icon}`
            let weatherdescription = `${weatherresults.weather[0].description}`
            let speedkmh = +`${weatherresults.wind.speed}` * 3.6
            let speedmph = speedkmh / 1.609

            if(checkcondition === 'Clear') {
              let checkedcondition = 'with clear skies ☀️🌇'
              let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
              client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
            }
            else if(checkcondition === 'Thunderstorm') {
              let checkedcondition = `with a ${weatherdescription} ⛈️☔`
              let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
              client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
            }
            else if(checkcondition === 'Drizzle') {
              let checkedcondition = 'with slight rain 🌦️🌧️'
              let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
              client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
            }
            else if(checkcondition === 'Rain') {
              let checkedcondition = `with ${weatherdescription} 🌧️☔`
              let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
              client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
            }
            else if(checkcondition === 'Snow') {
              let checkedcondition = `with ${weatherdescription} 🌨️❄️`
              let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
              client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
            }
            else if(checkcondition === 'Clouds') {
              let checkedcondition = `with ${weatherdescription} ☁️🌥️`
              let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
              client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
            }
            else if(checkicon === '50d' || checkicon === '50n') {
              let checkedcondition = `with a special weather event: ${checkcondition} 🔍`
              let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
              client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
            }
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
            client.say(channel, (`${user} --> That user hasen't set their location! Get them to set it and retry. PANIC`))
		      }
          else {
            axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${lookuptime}&apiKey=${process.env['GEOCODING_KEY']}`)
            .then((response) => {
              let unparsedcoords = response.data
              let parsedcoordslat = `${unparsedcoords.items[0].position.lat}`
              let parsedcoordslong = `${unparsedcoords.items[0].position.lng}`
              let namefromapi = `${unparsedcoords.items[0].title}`

            axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${parsedcoordslat}&lon=${parsedcoordslong}&units=metric&appid=${process.env['WEATHER_KEY']}`)
            .then((response) => {
             let weatherresults = response.data
             let checkcondition = `${weatherresults.weather[0].main}`
             let checkicon = `${weatherresults.weather[0].icon}`
             let weatherdescription = `${weatherresults.weather[0].description}`
             let speedkmh = +`${weatherresults.wind.speed}` * 3.6
             let speedmph = speedkmh / 1.609

             if(checkcondition === 'Clear') {
                let checkedcondition = 'with clear skies ☀️🌇'
                let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
                client.say(channel, `${user} --> The temperature in ${args[0]}'s location (${namefromapi}) is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round  (toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
             }
             else if(checkcondition === 'Thunderstorm') {
                let checkedcondition = `with a ${weatherdescription} ⛈️☔`
                let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
                client.say(channel, `${user} --> The temperature in ${args[0]}'s location (${namefromapi}) is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
              }
              else if(checkcondition === 'Drizzle') {
                let checkedcondition = 'with slight rain 🌦️🌧️'
                let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
                client.say(channel, `${user} --> The temperature in ${args[0]}'s location (${namefromapi}) is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
              }
              else if(checkcondition === 'Rain') {
                let checkedcondition = `with ${weatherdescription} 🌧️☔`
                let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
                client.say(channel, `${user} --> The temperature in ${args[0]}'s location (${namefromapi}) is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
              }
              else if(checkcondition === 'Snow') {
                let checkedcondition = `with ${weatherdescription} 🌨️❄️`
                let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
                client.say(channel, `${user} --> The temperature in ${args[0]}'s location (${namefromapi}) is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
              }
              else if(checkcondition === 'Clouds') {
                let checkedcondition = `with ${weatherdescription} ☁️🌥️`
                let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
                client.say(channel, `${user} --> The temperature in ${args[0]}'s location (${namefromapi}) is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
              }
              else if(checkicon === '50d' || checkicon === '50n') {
                let checkedcondition = `with a special weather event: ${checkcondition} 🔍`
                let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
                client.say(channel, `${user} --> The temperature in ${args[0]}'s location (${namefromapi}) is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
              }
            });
            });
          }
        })
      }

      else {
        axios.get(`https://geocode.search.hereapi.com/v1/geocode?q=${args.join(' ')}&apiKey=${process.env['GEOCODING_KEY']}`)
          .then((response) => {
            let unparsedcoords = response.data
            let parsedcoordslat = `${unparsedcoords.items[0].position.lat}`
            let parsedcoordslong = `${unparsedcoords.items[0].position.lng}`
            let namefromapi = `${unparsedcoords.items[0].title}`

        axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${parsedcoordslat}&lon=${parsedcoordslong}&units=metric&appid=${process.env['WEATHER_KEY']}`)
        .then((response) => {
          let weatherresults = response.data
          let checkcondition = `${weatherresults.weather[0].main}`
          let checkicon = `${weatherresults.weather[0].icon}`
          let weatherdescription = `${weatherresults.weather[0].description}`
          let speedkmh = +`${weatherresults.wind.speed}` * 3.6
          let speedmph = speedkmh / 1.609

          if(checkcondition === 'Clear') {
            let checkedcondition = 'with clear skies ☀️🌇'
            let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
            client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
          }
          else if(checkcondition === 'Thunderstorm') {
            let checkedcondition = `with a ${weatherdescription} ⛈️☔`
            let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
            client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
          }
          else if(checkcondition === 'Drizzle') {
            let checkedcondition = 'with slight rain 🌦️🌧️'
            let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
            client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
          }
          else if(checkcondition === 'Rain') {
            let checkedcondition = `with ${weatherdescription} 🌧️☔`
            let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
            client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
          }
          else if(checkcondition === 'Snow') {
            let checkedcondition = `with ${weatherdescription} 🌨️❄️`
            let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
            client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
          }
          else if(checkcondition === 'Clouds') {
            let checkedcondition = `with ${weatherdescription} ☁️🌥️`
            let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
            client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
          }
          else if(checkicon === '50d' || checkicon === '50n') {
            let checkedcondition = `with a special weather event: ${checkcondition} 🔍`
            let toFahrenheit = +`${weatherresults.main.temp}` * 1.8 + 32
            client.say(channel, `${user} --> The temperature in ${namefromapi} is currently ${Math.round(weatherresults.main.temp)}°C (${Math.round(toFahrenheit)}°F) ${checkedcondition}. Wind speed: ${Math.round(speedkmh)} km/h (${Math.round(speedmph)} mp/h). 💨 Humidity: ${weatherresults.main.humidity}% 💧`)
          }
        });
        });
      }
    }
  }

  if(command === 'wyr') {
    axios.get(`https://would-you-rather-api.abaanshanid.repl.co/`)
      .then((response) => {
        let wyrresult = response.data
        client.say(channel, `${user} --> ${wyrresult.data} `);
      });
  }

  if(command === 'xqcow1') {
    client.say(channel, `${user} --> https://i.imgur.com/OGFxdzB.png`);
  }

  if(command === 'xqcow2') {
    client.say(channel, `${user} --> https://i.imgur.com/d8KqqiD.png`);
  }

  if(command === 'yag') {
    client.say(channel, `${user} --> idk this yagnesh person, but they are making a shit first impression to me xqcMood TeaTime so cringe wtf`);
  }

  if(command === 'ym') {
    db.get("yagmoments").then(function(value) {
      let origym = `${value}`
      let plusoneym = +origym + +1
      db.set("yagmoments", `${plusoneym}`);
      client.say(channel, (`${user} --> There has been ${plusoneym} yag moments peepoChat`)
      )
    })
  }

  if(command === 'zamn') {
    client.say(channel, `${user} --> https://files.darkvypr.com/backups/zamn.txt ZAMN`);
  }

  if(command === 'zhandy') {
    client.say(channel, `${user} --> https://i.imgur.com/gFaJUwS.png`);
  }

  // Loyalty System

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  if(command === 'cdreset') {
    if(cdrcooldown.has(`${userlow}`)) {
      client.say(channel, (`${user} --> Your cdr is on cooldown. Wait 2 hours in between each cdr. GearScare ⛔`))
    }
    else {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
        if(+nammers < 20) {
          client.say(channel, (`${user} --> GearScare ⛔ You don't have enough nammers for a reset! You have ${nammers} nammers, and need at least 20! Use "!hunt" to get more.`))
        }
        else {
          talkedRecently.delete(`${user}`)
          cdrcooldown.add(`${user}`);
          setTimeout(() => {
            cdrcooldown.delete(`${user}`);
          }, 7200000);

          let nammerscdr = +nammers - 20
          db.set(`${userlow}nammers`, nammerscdr)

          client.say(channel, (`${user} --> Your cooldown has been reset! (-20 nammers) Good luck! NekoPray (2 hr cooldown)`))
        }
      })
    }
  }

  if(command === 'hunt') {
    if(talkedRecently.has(`${user}`)) {
      client.say(channel, (`${user} --> Wait 1 hour in between hunting! GearScare ⛔`))
    }

    else {
      db.get(`${userlow}nammers`).then(function(value) {
			  let nammers = `${value}`
          if(nammers === 'null' || nammers === 'NaN') {
            let nammeramount = Math.round(getRandomInt(30) + 20)
            db.set(`${userlow}nammers`, nammeramount)
            (client.say(channel, (`${user} --> KKona 👋 You caught ${nammeramount} nammers, and have a balance of: ${nammeramount} nammers. Since this is your first time hunting, you get 20 extra. GearSmile Stab`)))

            talkedRecently.add(`${user}`);
            setTimeout(() => {
              talkedRecently.delete(`${user}`);
            }, 3600000);
		      }
          else { 
            let nammeramount = getRandomInt(60)
            if(`${userlow}` === 'darkvypr') {
              console.log(nammeramount)
              let totalnammers = Math.round(+nammers + nammeramount * 1.3)
              db.set(`${userlow}nammers`, totalnammers)
              client.say(channel, (`${user} --> GearSmile ⛓ You caught ${Math.round(nammeramount * 1.3)} (+${Math.round((nammeramount * 1.3) - nammeramount)} EleGiggle ) nammers, and have a total of ${totalnammers} nammers! (30 min cooldown)`))
              
              talkedRecently.add(`${user}`);
              setTimeout(() => {
                talkedRecently.delete(`${user}`);
              }, 1800000);
            }
            else {
              let totalnammers = +nammers + nammeramount
              db.set(`${userlow}nammers`, totalnammers)
              client.say(channel, (`${user} --> GearSmile ⛓ You caught ${nammeramount} nammers, and have a total of ${totalnammers} nammers! (1 hr cooldown)`))
              
              talkedRecently.add(`${user}`);
              setTimeout(() => {
                talkedRecently.delete(`${user}`);
              }, 3600000);
            }
          }
      })
    }
  }

  if(command === 'kill') {
		db.get(`${userlow}nammers`).then(function(value) {
			let nammers = `${value}`
        if(nammers === 'null' || +nammers === 0) {
          client.say(channel, (`${user} --> GearScare ⛔ You don't have any nammers to kill! Use "!hunt" to get more.`))
		    }
        else {
          if(+`${args[0]}` > +`${nammers}`) {
            client.say(channel, (`${user} --> MenheraCry You try to kill ${args[0]} nammers, but realize that you only have ${nammers} nammers, and give up.`))
          }
          else {
            let killamount = `${args[0]}`
            const regex = new RegExp('^([1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])$');
            testForNumber = `${regex.test(killamount)}`

            if(testForNumber === 'true') {
              let afterkill = +nammers - +killamount
              db.set(`${userlow}nammers`, afterkill)
              client.say(channel, (`${user} --> NekoProud 🔪 You brutally execute ${killamount} nammers, and are left with ${afterkill} nammers.`))
            }
            else if(`${args[0]}` === 'all') {
              db.set(`${userlow}nammers`, 0)
              client.say(channel, (`${user} --> GearScare 🔪 You graciously mutilate all of your nammers (${nammers}), and are left with nothing.`))
            }
            else {
              client.say(channel, (`${user} --> Please enter a valid amount of nammers to kill KannaSip`))
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
            client.say(channel, (`${user} --> GearScare ⛔ You don't have any nammers! Get some by typing "!hunt", and kill some by typing "!kill {amount}"!`))
          }
          else {
            client.say(channel, (`${user} --> NOTED You have ${nammers} nammers. Get some by typing "!hunt", and kill some by typing "!kill {amount}".`))
          }
      })
    }
    else {
      let checkuser = `${args[0]}`.toLowerCase()
      db.get(`${checkuser}nammers`).then(function(value) {
        let nammers = `${value}`
          if(nammers === 'null') {
            client.say(channel, (`${user} --> GearScare ⛔ That user dosent exist!`))
          }
          else {
            client.say(channel, (`${user} --> NOTED ${args[0]} has ${nammers} nammers.`))
          }
      })
    }
  }

  if(command === 'give') {
    let giveamount = `${args[1]}`
    const regex = new RegExp('^([1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])$');
    testForNumber = `${regex.test(giveamount)}`

    let recipientup = `${args[0]}`
    let recipient = recipientup.toLowerCase()

    if(`${recipient}` === `${user}`) {
      client.say(channel, (`${user} --> Why are you trying to give nammers to urself NekoStare`))
    }

    else if(`${testForNumber}` === 'true') {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
        if(nammers === 'null' || +nammers === 0) {
          client.say(channel, (`${user} --> GearScare ⛔ It looks like you dont have any nammers to give away! Use "!hunt" to get more. ppOverheat`))
        }
        else if(+`${giveamount}` > +`${nammers}`) {
          client.say(channel, (`${user} --> GearScare ⛔ You tried to give away ${giveamount} nammers, but you only have ${nammers} nammers. You keep all of your nammers for a rainy day.`))
        }
        else {
          db.get(`${recipient}nammers`).then(function(valuerecipient) {
            let recipientnammers = `${valuerecipient}`
            if(`${recipientnammers}` === 'null') {
              client.say(channel, `${user} --> That user dosen't exist in the database!`)
            }
            else {
              let aftergive = +nammers - +giveamount
              db.set(`${userlow}nammers`, aftergive)
              let recipientaddednammers = +recipientnammers + +giveamount

              db.set(`${recipient}nammers`, recipientaddednammers)
              client.say(channel, `${user} --> GearSmile 👉 🚢 Successfully shipped ${giveamount} nammers to ${recipient}! Your new balance is: ${aftergive} nammers, and ${recipient}'s new balance is: ${recipientaddednammers} nammers!`)
            }
          })
        }
      })
    }
    else if(giveamount === 'all') {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
        if(nammers === 'null' || +nammers === 0) {
          client.say(channel, (`${user} --> GearScare ⛔ It looks like you dont have any nammers to give away! Use "!hunt" to get more. ppOverheat`))
        }
        else if(+`${giveamount}` > +`${nammers}`) {
          client.say(channel, (`${user} --> GearScare ⛔ You tried to give away ${giveamount} nammers, but you only have ${nammers} nammers. You keep all of your nammers for a rainy day.`))
        }
        else {
          db.get(`${recipient}nammers`).then(function(valuerecipient) {
            let recipientnammers = `${valuerecipient}`
            if(`${recipientnammers}` === 'null') {
              client.say(channel, `${user} --> That user dosen't exist in the database!`)
            }
            else {
              let giveamount = nammers
              db.set(`${userlow}nammers`, 0)
              let recipientaddednammers = +recipientnammers + +giveamount

              db.set(`${recipient}nammers`, recipientaddednammers)
              client.say(channel, `${user} --> GearSmile 👉 🚢 Successfully shipped all of your nammers (${giveamount}) to ${recipient}! ${recipient}'s new balance is: ${recipientaddednammers} nammers!`)
            }
          })
        }
      })
    }
    else {
      client.say(channel, (`${user} --> Please enter a valid amount of nammers to give away!`))
    }
  }

  if(command === 'gamble') {
    if(`${args[0]}` === 'undefined') {
      client.say(channel, (`${user} --> PANIC Please enter an amount of nammers to gamble with!`))
    }
    else {
      db.get(`${userlow}nammers`).then(function(value) {
        let nammers = `${value}`
          if(nammers === 'null' || +nammers === 0) {
            client.say(channel, (`${user} --> You dont have any nammers to gamble with! Type !hunt to get more.`))
          }
          else {
            let gambleamount = `${args[0]}`
            const regex = new RegExp('^([1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])$');
            testForNumber = `${regex.test(gambleamount)}`

            if(testForNumber === 'true') {
              if(+nammers < +gambleamount) {
                client.say(channel, (`${user} --> PANIC You don't have enough nammers! Get more by using !hunt.`))
              }
              else {
                let winloss = getRandomInt(2)
                if(winloss === 1) {
                  let gamblewin = Math.round(+nammers + +gambleamount)
                  db.set(`${userlow}nammers`, `${gamblewin}`)
                  client.say(channel, (`${user} --> You bet ${gambleamount} nammers and won! You now have ${gamblewin} nammers! PagMan 💰`))
                }
                else {
                  let gambleloss = Math.round(+nammers - +gambleamount)
                  db.set(`${userlow}nammers`, `${gambleloss}`)
                  client.say(channel, (`${user} --> You bet ${gambleamount} nammers and lost! You now have ${gambleloss} nammers! SadCat`))
                }
              }
            }
            else if(`${args[0]}` === 'all') {
              let winloss = getRandomInt(2)
              if(winloss === 1) {
                let gamblewin = Math.round(+nammers * 2)
                db.set(`${userlow}nammers`, `${gamblewin}`)
                client.say(channel, (`${user} --> You went all in and won! You now have ${gamblewin} nammers! EZ 💰`))
              }
              else {
                db.set(`${userlow}nammers`, '0')
                client.say(channel, (`${user} --> You went all in and lost! You have 0 nammers now! Next time I guess Copium`))
              }
            }
            else {
              client.say(channel, (`${user} --> NOIDONTTHINKSO Thats not a valid number!`))
            }
          }
      })
    }
  }
})