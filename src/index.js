const noblox = require("noblox.js");
const express = require("express");
const spotify = require("spotify-web-api-node");

let initialstatus;

const scopes = [
    "user-read-private",
    "user-read-email",
    "user-read-currently-playing",
  ],
  redirectUri = "http://localhost:3000/callback",
  clientId = "";

const spotifyApi = new spotify({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: "",
});

const cookie =
  "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.";

const filterCookie =
  "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.";

const placeid = 14556725768

const app = express();

async function main() {
  await noblox.setCookie(cookie);
  const currentSong = await spotifyApi.getMyCurrentPlayingTrack();
  if (currentSong.body.item) {
    const filtername = currentSong.body.item.name
    const filterartist = currentSong.body.item.artists[0].name
    await setAboutMe(
      initialstatus +
        "\n\ncurrently listening to on spotify: \n" +
        filtername +
        " - " +
        filterartist
    );
  } else {
    setAboutMe(initialstatus);
  }
}

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/");

  const data = await spotifyApi.authorizationCodeGrant(code);
  spotifyApi.setAccessToken(data.body["access_token"]);
  spotifyApi.setRefreshToken(data.body["refresh_token"]);

  const me = await spotifyApi.getMe();
  const name = me.body.display_name;

  await noblox.setCookie(cookie);
  const user = await noblox.getCurrentUser();

  const currentBlurb = await noblox.getBlurb({ userId: user.UserID });
  initialstatus = currentBlurb;

  setInterval(main, 10000);

  res.send("Done, welcome " + name + "!");
});

app.get("/", async (req, res) => {
  const authorizeURL = await spotifyApi.createAuthorizeURL(scopes);
  res.redirect(authorizeURL);
});

app.listen(3000, () => {
  console.log("Server started");
});

async function appendAboutMe(text) {
  await noblox.setCookie(cookie);
  const csrf = await noblox.getGeneralToken();

  const user = await noblox.getCurrentUser();

  const currentBlurb = await noblox.getBlurb({ userId: user.UserID });

  const raw = await fetch(
    "https://accountinformation.roblox.com/v1/description",
    {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": csrf,
        Cookie: `.ROBLOSECURITY=${cookie}`,
      },
      body: JSON.stringify({
        description: currentBlurb + "\n\n" + text,
      }),
    }
  );
}

async function setAboutMe(text) {
  await noblox.setCookie(cookie);
  const csrf = await noblox.getGeneralToken();

  const user = await noblox.getCurrentUser();

  const raw = await fetch(
    "https://accountinformation.roblox.com/v1/description",
    {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": csrf,
        Cookie: `.ROBLOSECURITY=${cookie}`,
      },
      body: JSON.stringify({
        description: text,
      }),
    }
  );
}

function refreshToken() {
  spotifyApi.refreshAccessToken().then(
    function (data) {
      console.log("The access token has been refreshed!");

      spotifyApi.setAccessToken(data.body["access_token"]);
    },
    function (err) {
      console.log("No refresh token found");
    }
  );
}

async function filterText(text) {
  await noblox.setCookie(filterCookie);
    const csrf = await noblox.getGeneralToken();

    const user = await noblox.getCurrentUser();
    const patch = await fetch("https://develop.roblox.com/v2/places/" + placeid, {
        method: "PATCH",
        headers: {
            "X-CSRF-TOKEN": csrf,
            Cookie: `.ROBLOSECURITY=${filterCookie}`,
        },
        body: JSON.stringify({
            description: text
        })
    })

    const description = await patch.json()
    return description.description
}

setInterval(refreshToken, 3500 * 1000);
