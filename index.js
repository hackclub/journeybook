require("dotenv").config();
const { App } = require("@slack/bolt");
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT
});

app.message(/.*/gim, async ({ message }) => {
  if (!["C08MTLF071T", "C08NHQNG2TS"].includes(message.channel)) return
  if (message.thread_ts) return;
  await app.client.reactions.add({
    channel: message.channel,
    name: "spin-loading",
    timestamp: message.ts
  })
  const response = await (await fetch(`https://journey.hackclub.com/api/check_user?` + new URLSearchParams({
    slack_id: message.user
  }), {
    headers: {
      Authorization: process.env.API_KEY
    }
  })).json()


  if (!response.exists) {
    await app.client.reactions.remove({
      channel: message.channel,
      name: "spin-loading",
      timestamp: message.ts
    })
    await app.client.reactions.add({
      channel: message.channel,
      name: "ember-sad",
      timestamp: message.ts
    })
    await app.client.reactions.add({
      channel: message.channel,
      name: "exclamation",
      timestamp: message.ts
    })
    return await app.client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: "You don't seem to have an account on journey. Make an account at (insert url), then repost this update."
    })
  }

  if (!response.has_project) {
    await app.client.reactions.remove({
      channel: message.channel,
      name: "spin-loading",
      timestamp: message.ts
    })
    await app.client.reactions.add({
      channel: message.channel,
      name: "ember-sad",
      timestamp: message.ts
    })
    await app.client.reactions.add({
      channel: message.channel,
      name: "exclamation",
      timestamp: message.ts
    })
    return await app.client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: "You don't seem to have a project on journey. Go make a new one, then repost this update."
    })
  }
  if (!message.text) {
    await app.client.reactions.remove({
      channel: message.channel,
      name: "spin-loading",
      timestamp: message.ts
    })
    await app.client.reactions.add({
      channel: message.channel,
      name: "ember-sad",
      timestamp: message.ts
    })
    await app.client.reactions.add({
      channel: message.channel,
      name: "exclamation",
      timestamp: message.ts
    })
    return await app.client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: "You must have text attached"
    })
  }
  var attachment = undefined
  if (message.files && message.files?.length != 0) {
    const privateUrl = message.files[0].permalink_public;
    const mediaUrl = (await (await fetch(privateUrl, {
      headers: {
        "Authorization": `Bearer ${process.env.SLACK_USER_TOKEN}`
      }
    })).text()).match(/src="([^"]*\.(mp4|jpg|jpeg|png|gif)[^"]*)"/)?.[1];
    return mediaUrl;
    const fileId = privateUrl.match(/T0266FRGM-(\w+)-/)[1];
    const pubkey = privateUrl.match(/-(\w+)$/)[1];
    const filename = message.files[0].name;

    const publicUrl = `https://files.slack.com/files-pri/T0266FRGM-${fileId}/${filename}?pub_secret=${pubkey}`;
    const cdnResponse = await (await fetch("https://cdn.hackclub.com/api/v1/new", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer beans',
        'X-Download-Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify([
        publicUrl
      ])
    })).json()
    attachment = cdnResponse[0]
  }
  const response2 = await fetch(`https://journey.hackclub.com/api/updates`, {
    headers: {
      Authorization: process.env.API_KEY,
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({
      slack_id: message.user,
      project_id: response.project.id,
      update: {
        text: message.text,
        attachment
      }
    })
  });
  const responseText = await response2.json(); // will crash if it didn't upload
  await app.client.reactions.remove({
    channel: message.channel,
    name: "spin-loading",
    timestamp: message.ts
  })
  await app.client.reactions.add({
    channel: message.channel,
    name: "ember-trianglehappy",
    timestamp: message.ts
  })
  if (attachment) await app.client.reactions.add({
    channel: message.channel,
    name: "tw_frame_with_picture",
    timestamp: message.ts
  })

  await app.client.chat.postEphemeral({
    channel: message.channel,
    user: message.user,
    text: "Got your update!"
  })

})

app.start(process.env.PORT)
