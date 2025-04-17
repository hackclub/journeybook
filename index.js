require("dotenv").config();
const { App } = require("@slack/bolt");
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT,
});

app.message(/.*/gim, async ({ message }) => {
  if (!["C08MTLF071T", "C08NHQNG2TS"].includes(message.channel)) return;
  if (message.thread_ts) return;
  await app.client.reactions.add({
    channel: message.channel,
    name: "lollipopload",
    timestamp: message.ts,
  });
  const response = await (
    await fetch(
      `https://journey.hackclub.com/api/check_user?` +
        new URLSearchParams({
          slack_id: message.user,
        }),
      {
        headers: {
          Authorization: process.env.API_KEY,
        },
      }
    )
  ).json();

  if (!response.exists) {
    await app.client.reactions.remove({
      channel: message.channel,
      name: "lollipopload",
      timestamp: message.ts,
    });
    await app.client.reactions.add({
      channel: message.channel,
      name: "ember-sad",
      timestamp: message.ts,
    });
    await app.client.reactions.add({
      channel: message.channel,
      name: "exclamation",
      timestamp: message.ts,
    });
    return await app.client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: "You don't seem to have an account on journey. Make an account at https://journey.hackclub.com, then repost this update.",
    });
  }

  if (!response.has_project) {
    await app.client.reactions.remove({
      channel: message.channel,
      name: "lollipopload",
      timestamp: message.ts,
    });
    await app.client.reactions.add({
      channel: message.channel,
      name: "ember-sad",
      timestamp: message.ts,
    });
    await app.client.reactions.add({
      channel: message.channel,
      name: "exclamation",
      timestamp: message.ts,
    });
    return await app.client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: "You don't seem to have a project on journey. Go make a new one, then repost this update.",
    });
  }
  if (!message.text) {
    await app.client.reactions.remove({
      channel: message.channel,
      name: "lollipopload",
      timestamp: message.ts,
    });
    await app.client.reactions.add({
      channel: message.channel,
      name: "ember-sad",
      timestamp: message.ts,
    });
    await app.client.reactions.add({
      channel: message.channel,
      name: "exclamation",
      timestamp: message.ts,
    });
    return await app.client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: "You must have text attached.",
    });
  }
  var attachment = undefined;
  if (message.files && message.files?.length != 0) {
    if (message.files.length > 1) {
      await app.client.reactions.remove({
        channel: message.channel,
        name: "lollipopload",
        timestamp: message.ts,
      });
      await app.client.reactions.add({
        channel: message.channel,
        name: "ember-sad",
        timestamp: message.ts,
      });
      await app.client.reactions.add({
        channel: message.channel,
        name: "exclamation",
        timestamp: message.ts,
      });
      return await app.client.chat.postEphemeral({
        channel: message.channel,
        user: message.user,
        text: "You can only have one attachment.",
      });
    }
    const fileres = await app.client.files.sharedPublicURL({
      file: message.files[0].id,
      token: process.env.SLACK_USER_TOKEN,
    });
    const url = (
      await (await fetch(fileres.file?.permalink_public)).text()
    ).match(/src="([^"]*\.(mp4|jpg|jpeg|png|gif)[^"]*)"/)?.[1];
    attachment = url;
  }
  const response2 = await fetch(`https://journey.hackclub.com/api/updates`, {
    headers: {
      Authorization: process.env.API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      slack_id: message.user,
      project_id: response.project.id,
      update: {
        text: message.text,
        attachment,
      },
    }),
  });
  const responseText = await response2.json(); // will crash if it didn't upload
  await app.client.reactions.remove({
    channel: message.channel,
    name: "lollipopload",
    timestamp: message.ts,
  });
  await app.client.reactions.add({
    channel: message.channel,
    name: "ember-trianglehappy",
    timestamp: message.ts,
  });
  if (attachment)
    await app.client.reactions.add({
      channel: message.channel,
      name: "tw_frame_with_picture",
      timestamp: message.ts,
    });
  for (const [emoji_key, emoji] of Object.entries(require("./emojis"))) {
    if (!message.text.toLowerCase().includes(emoji_key)) continue;
    await app.client.reactions.add({
      channel: message.channel,
      name: emoji,
      timestamp: message.ts,
    });
  }
  await app.client.chat.postEphemeral({
    channel: message.channel,
    user: message.user,
    text: "Got your update!",
  });
});

app.start(process.env.PORT);
