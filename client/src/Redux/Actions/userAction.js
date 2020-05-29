import {AUTHENTICATE_USER, CREATE_ROOM, CONNECT, JOIN_ROOM, LEAVE_ROOM, DESTROYED_ROOM, DESTROY_ROOM, MODIFY_USER} from './action_types'

export const connectUser = (socket) => {
  return {
    type: CONNECT,
    payload: socket
  }
}

export const authenticateUser = (code, userID) => (dispatch, getState, api) => {
  return api.get(`/authSuccess`, {userID, code}, (data) => {
    dispatch(completeAuthenticateUser(data))
  })
}

export const setDevice = (deviceID, userID) => (dispatch, getState, api) => {
  return api.post('/setDevice', {userID}, {device_id: deviceID}, data => {
    dispatch(modifyUser(data));
  })
}

export const refreshDevices = (userID) => (dispatch, getState, api) => {
  return api.get('/refreshDevices', {userID}, data => {
    dispatch(modifyUser(data));
  })
}

export const joinRoom = () => {
  return {
    type: JOIN_ROOM,
    payload: null
  }
}
export const leaveRoom = () => {
  return {
    type: LEAVE_ROOM,
    payload: null
  }
}
export const destroyRoom = () => {
  return {
    type: DESTROY_ROOM,
    payload: null
  }
}
export const destroyedRoom = () => {
  return {
    type: DESTROYED_ROOM,
    payload: null
  }
}

const completeAuthenticateUser = user => {
  return {
    type: AUTHENTICATE_USER,
    payload: user
  }
}

export const createRoomUserSuccess = (roomID) => {
  return {
    type: CREATE_ROOM,
    payload: roomID
  }
}

export const modifyUser = user => {
  return {
    type: MODIFY_USER,
    payload: user
  }
}

