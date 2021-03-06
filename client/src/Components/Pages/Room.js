import React, { useRef } from 'react';
import { connect } from 'react-redux'
import './Room.css'
import Typography from '../Typography/Typography'

import {
  CREATE,
  JOIN,
} from "helpers/socket_events.js";

const Room = (props) => {
  // We can use useCallback for optimization in the future
  const joinRef = useRef();
  // Sends CREATE event
  const createRoom = () => props.socket.emit(CREATE);

  // Sends JOIN event
  const joinRoom = () => props.socket.emit(JOIN, joinRef.current.value.trim());
  return (
    <div id="room-container">
      <Typography fontSize="20px" color="#eee" margin="10px 0" align="center">Make sure you have an active device connected to the internet</Typography>
      <div id="room-container-buttons">
        {props.guest ? null : <button onClick={createRoom}>Create room</button>}
        <div className="room-join">
          <input type="text" placeholder="Enter Room Code" ref={joinRef} />
          <button className="input-button" onClick={joinRoom}> Join room</button>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    socket: state.userReducer.socket,
    guest: state.userReducer.guest
  }
}

export default connect(mapStateToProps, null)(Room)