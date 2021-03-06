// Import any spotify requests we write
const {
  getUser,
  addSinglePlaylist,
  getSinglePlaylist,
  getAllPlaylists,
} = require("../users");
const {
  getRoom
} = require("../rooms")
const {
  requestPlaylists,
  requestTracks,
  requestSearch,
  pauseDevice,
  assignDevice,
  requestDevices,
} = require("../requests");

module.exports = (app) => {
  // Endpoints here

  app.get("/playlists", function (req, res) {
    let userID = req.query.userID;
    requestPlaylists(getUser(userID))
      .then((data) => {
        // Items is an array of "playlist objects"
        let playlists = data.items;

        // Get rid of unnecessary info for each playlist
        playlists.forEach((playlist) => {
          let simplifiedPlaylist = {
            name: playlist.name,
            id: playlist.id,
            owner: playlist.owner.display_name,
            numTracks: playlist.tracks.total,
            tracks: null,
          };
          addSinglePlaylist(userID, simplifiedPlaylist);
        });
        res.json(getUser(userID).clientInfo());
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Some Errors Occured");
      });
  });

  app.get("/allTracks", function (req, res) {
    let userID = req.query.userID;
    let playlistID = req.query.playlistID;
    // let playlistName = "home🏠";
    let playlist = getSinglePlaylist(userID, playlistID);
    let tracks = [];

    // Get all the tracks in this playlist from Spotify
    requestTracks(getUser(userID), playlist.id)
      .then((pages) => {
        //  CAUTION: NOT CONSIDERING MULTIPLE PAGE OF TRACKS DATA
        //  Response come back in page objects, which contains an array of
        //  playlist track object that has: added_at, added_by, is_local, and the actual track object
        pages.items.forEach((playlistTrackObj) => {
          tracks.push(simplifyTrack(playlistTrackObj.track));
        });
        //  Update the selected playlist
        playlist.tracks = tracks;
        res.json(playlist);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Some Errors Occured");
      });
  });

  //! This should be a post in the future
  app.get("/search", function (req, res) {
    let searchResult = [];
    let userID = req.query.userID;
    let itemName = req.query.searchWord;
    let searchType = "track"; //  Options: album,artist,playlist,show,episode
    let pageLimit = 5;
    let user = getUser(userID)
    //! Also, where does the response end other than error?
    requestSearch(user.isGuest() ? getRoom(user.room).host:user, encodeURIComponent(itemName), searchType)
      .then((pages) => {
        getNextPage(user.isGuest() ? getRoom(user.room).host:user, pages, pageLimit, searchResult);
      })
      .then(() => {
        res.json(searchResult);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Some Errors Occured");
      });
  });

  // Sets the user's playback device
  app.post("/setDevice", (req, res) => {
    const user = getUser(req.query.userID);
    const { device_id } = req.body;
    // Pause the device we're going to play music off of
    pauseDevice(user)
      .then((data) => assignDevice(user, device_id)) // Set the device
      .then((data) => {
        if(data.error && data.error.reason === "UNKNOWN") {
          res.status(400).send("There was an error setting your device. It's likely asleep, please restart spotify on said device")
          return;
        }
        // Update the user's device information without doing another request
        let devices = user.playback_devices;
        let oldDevice = devices.find((device) => device.is_active)
        if(oldDevice !== undefined) {
          oldDevice.is_active = false;
        }
        let newDevice = devices.find((device) => device.id === device_id)
        if( data.error && data.error.status === 404 ) {
          res.status(400).send("Your device has been disconnected from Spotify. Ensure the device is connected to the internet with Spotify open")
          return;
        }
        newDevice.is_active = true;
        user.setDevices(devices);
        // Send the client info
        res.json(user.clientInfo());
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Some errors occurred");
      });
  });

  // Refreshes the user's playback devices
  app.get("/refreshDevices", (req, res) => {
    let user = getUser(req.query.userID);
    requestDevices(user)
      .then((data) => {
        user.setDevices(data.devices);
        res.json(user.clientInfo()); // Send the updated user back
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Some errors occurred");
      });
  });
};

//? You'll have to walk me through what this does
const getNextPage = (user, pages, pageLimit, searchResult) => {
  //  Possible Keys: track, album, artist, playlist, show, episode
  //  Value will always be a page object
  if (pages.error != undefined) {
    throw pages.error.status;
  }
  Object.entries(pages).forEach(([key, value]) => {
    value.items.forEach((trackObj) => {
      track = simplifyTrack(trackObj);
      searchResult.push(track);
    });
    //  Recursively invoke getNextPage to get all the search results
    if (value.next != null && pageLimit > 0) {
      pageLimit--;
      //  Parsed next page's url and call getNextPage recursively
      let nextItemName = value.next.split("query=")[1].split("&")[0];
      let nextItemType = value.next.split("type=")[1];
      requestSearch(user, nextItemName, nextItemType).then((pages) =>
        getNextPage(user, pages, pageLimit, searchResult)
      );
    }
    return searchResult;
  });
};

const simplifyTrack = (rawTrack) => ({
  albumName: rawTrack.album.name,
  // Map the artist names
  //  If there's multiple artists, put them in an array beforehand
  artists: rawTrack.artists.map((artist) => " " + artist.name).toString().slice(1),
  explicit: rawTrack.explicit,
  duration_ms: rawTrack.duration_ms,
  uri: rawTrack.uri,
  id: rawTrack.id,
  name: rawTrack.name,
});

// 4xMXgzU2ZyZJ92iCH5HCJg
