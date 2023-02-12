import { EventEmitter } from 'node:events';
import sdk from 'matrix-js-sdk';

class MatrixClientEmitter extends EventEmitter {}

class matrixClient {
    // Private variables
    #_baseUrl;
    #_username;
    #_password;
    #_client;
    #_accessToken;
    #_rooms = [];

    // Public
    matrixClientEvents = new MatrixClientEmitter();
    
    constructor({ baseUrl, username, password }) {
        this.#_baseUrl = baseUrl;
        this.#_username = username;
        this.#_password = password;

        this.#_client = sdk.createClient({ baseUrl: this.#_baseUrl });

        this.onSync = this.onSync.bind(this);
        this.onRoomTimeline = this.onRoomTimeline.bind(this);
        this.getRooms = this.getRooms.bind(this);
        this.getRoomId = this.getRoomId.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }

    // TODO: Retry on failure
    async #getAccessToken() {
        console.log(`Logging in as ${this.#_username}`);

        try {
            const response = await Promise.resolve(this.#_client.login("m.login.password", {"user": this.#_username, "password": this.#_password}));
            if (!response.access_token) {
                console.error(`getAccessToken: Could not find access_token. JSON = ${JSON.stringify(response)}`);
                return null;
            }
            console.log(`Access Token: ${response.access_token}`);
            return response.access_token;
        }
        catch (e) {
            console.error(`getAccessToken: ${e}`);
            return null;
        }
    }
    
    

    getRooms() {
        console.log('getRooms');
        let rooms = this.#_client.getRooms();
        this.#_rooms = rooms.map( room => ({ id: room.roomId, name: room.normalizedName }));
        this.#_rooms.forEach(room => {
            console.log(`${room.name} = ${room.id}`);
        });
    }
    
    getRoomId(name) {
        return (this.#_rooms.find(room => room.name === name) || {}).id;
    }
    
    onSync(state, prevState, res) {
        console.log(`Client State ${state}`); // state will be 'PREPARED' when the client is ready to use
        if (state === 'PREPARED') {
            console.log('Calling getRooms');
            this.getRooms();
        }
    }
    
    onRoomTimeline(event, room, toStartOfTimeline) {
        if (event.getType() !== 'm.room.message') {
            return;
        }
        
        console.log(event.event);
        const messageEvent = event.event;
        const content = (messageEvent.content || {}).body || `complex type: ${content.msgtype}`;
        const roomName = room.normalizedName;

        const message = {
          sender: messageEvent.sender,
            room: roomName,
            room_id: messageEvent.room_id,
            message: content,
            timestamp: new Date(messageEvent.origin_server_ts) // UTC
        };

        this.matrixClientEvents.emit('onMessageRecv', message);
    }
    
    sendMessage(room, message) {
        this.#_client.sendEvent(room, 'm.room.message', {
            body: message,
            msgtype: 'm.text'
        }, '').catch(err => console.log(err));
    }

    async connect() {
        this.#_accessToken = await this.#getAccessToken();
        if (this.#_accessToken) {
            this.#_client.startClient();
            this.#_client.once('sync', this.onSync);
            this.#_client.on('Room.timeline', this.onRoomTimeline);
        }
    }
}

export default matrixClient;