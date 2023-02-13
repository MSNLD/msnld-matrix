import { EventEmitter } from 'node:events';
import sdk from 'matrix-js-sdk';

class matrixClient extends EventEmitter {
  // Private variables
  private _baseUrl;
  private _username;
  private _password;
  private _client;
  private _accessToken;
  private _rooms: { id: string; name: string }[];

  // Public
  constructor({ baseUrl, username, password }: { baseUrl: string; username: string; password: string }) {
    super();
    this._baseUrl = baseUrl;
    this._username = username;
    this._password = password;

    this._client = sdk.createClient({ baseUrl: this._baseUrl });
    this._rooms = [];
    this._accessToken = '';
  }

  // TODO: Retry on failure
  async #getAccessToken() {
    console.log(`Logging in as ${this._username}`);

    try {
      const response = await Promise.resolve(
        this._client.login('m.login.password', { user: this._username, password: this._password }),
      );
      if (!response.access_token) {
        console.error(`getAccessToken: Could not find access_token. JSON = ${JSON.stringify(response)}`);
        return null;
      }
      console.log(`Access Token: ${response.access_token}`);
      return response.access_token;
    } catch (e) {
      console.error(`getAccessToken: ${e}`);
      return null;
    }
  }

  getRooms() {
    console.log('getRooms');
    const rooms = this._client.getRooms();
    this._rooms = rooms.map((room) => ({ id: room.roomId, name: room.normalizedName }));
    this._rooms.forEach((room) => {
      console.log(`${room.name} = ${room.id}`);
    });
  }

  getRoomId(name: string) {
    return (this._rooms.find((room) => room.name === name) || {}).id;
  }

  private onSync(state: string, _prevState: string, _data: object) {
    console.log(`Client State ${state}`); // state will be 'PREPARED' when the client is ready to use
    if (state === 'PREPARED') {
      console.log('Calling getRooms');
      this.getRooms();
      this.emit('syncComplete');
    }
  }

  private onRoomTimeline(
    event: sdk.MatrixEvent,
    room: sdk.Room,
    _toStartOfTimeline: boolean,
    _removed: boolean,
    _data: object,
  ) {
    if (event.getType() !== 'm.room.message') {
      return;
    }

    console.log(event.event);
    const messageEvent = event.event;
    const content = (messageEvent.content || {}).body || `complex type: ${messageEvent.content?.msgtype}`;
    const roomName = room.normalizedName;

    const message = {
      sender: messageEvent.sender,
      room: roomName,
      room_id: messageEvent.room_id,
      message: content,
      timestamp: new Date(messageEvent.origin_server_ts || 0), // UTC
    };

    this.emit('onMessageRecv', message);
  }

  sendMessage(room: string, message: string) {
    this._client
      .sendEvent(
        room,
        'm.room.message',
        {
          body: message,
          msgtype: 'm.text',
        },
        '',
      )
      .catch((err) => console.log(err));
  }

  async connect() {
    this._accessToken = await this.#getAccessToken();
    if (this._accessToken) {
      await this._client.startClient();
      // @ts-ignore
      this._client.once('sync', this.onSync.bind(this));
      // @ts-ignore
      this._client.on('Room.timeline', this.onRoomTimeline.bind(this));
    }
  }
}

export default matrixClient;
