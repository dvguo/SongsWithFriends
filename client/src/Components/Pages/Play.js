import React, { useState, useEffect } from "react";
import { connect } from 'react-redux'
import "./Play.css";

import { get } from '../../Fetch'

import Playlist from "../Playlist/Playlist.jsx";
import UserLibrary from "../Playlist/UserLibrary.jsx";
import PlayerBar from "../PlayerBar/PlayerBar.jsx";
import SearchOverlay from '../SearchOverlay/SearchOverlay'

import PlaylistAddRoundedIcon from '@material-ui/icons/PlaylistAddRounded';

const Play = (props) => {
  const [tracks, setTracks] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const handleLibrary = () => {
    // Always hide the playlist when the button is clicked
    // But only hide/show the library if the playlist is not showing
    // so that the library and selected playlist never show up at the same time
    if (!showPlaylist) setShowLibrary(!showLibrary);
    setShowPlaylist(false)
  };

  useEffect(() => {
    if (!props.guest) {
      let playlistID = props.user.playlists[selectedPlaylist].id;
      get("/allTracks", { userID: props.user.id, playlistID }, playlist => {
        setTracks(playlist.tracks);
      })
    }
    //eslint-disable-next-line
  }, [selectedPlaylist, props.guest]);

  return (
    <div>
      <div className="container-top">
        {props.playback.playlist ? <Playlist
          user={props.user}
          tracks={props.playback.playlist.tracks.items}
          playlistName={props.playback.playlist.name}
          queue={true}
          addSong={props.addSong}
          removeSong={props.removeSong}
        /> : null}
        {showPlaylist && !props.guest && tracks.length !== 0 ? <Playlist
          user={props.user}
          tracks={tracks}
          playlistName={props.user.playlists[selectedPlaylist].name}
          queue={false}
          setShowLibrary={setShowLibrary}
          setShowPlaylist={setShowPlaylist}
          addSong={props.addSong}
          removeSong={props.removeSong}
        /> : null}

        {showLibrary ? <UserLibrary userName={props.user.name} playlists={props.user.playlists} setSelectedPlaylist={setSelectedPlaylist} setShowLibrary={setShowLibrary} setShowPlaylist={setShowPlaylist} /> : null}
        <button id="libraryBtn" onClick={handleLibrary}>Library</button>
        <SearchOverlay user={props.user} open={searchOpen} handleClose={() => setSearchOpen(false)} />
      </div>

      <PlaylistAddRoundedIcon id="searchBtn" onClick={() => setSearchOpen(true)}>+</PlaylistAddRoundedIcon>

      <PlayerBar
        track="Attention"
        artist="Charlie Puth · Voicenotes"
        duration="3:31"
      />
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    user: state.userReducer.user,
    playback: state.playbackReducer.playback,
    guest: state.userReducer.guest,
    host: state.userReducer.host,
    member: state.userReducer.member,
    userID: state.userReducer.userID,
  }
}

export default connect(mapStateToProps, null)(Play);