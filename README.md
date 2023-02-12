# Usage instructions

Do a `npm install`
Create `index.js` or something similar with the below code

```js

import matrixClient from './matrixClient.js';

(async function run() {
    console.log('Running...');
    
    const baseUrl = 'https://matrix.msnld.com';
    const username = 'username';
    const password = 'password';
    
    const client = new matrixClient({ baseUrl: baseUrl, username: username, password: password });

    client.matrixClientEvents.on('onMessageRecv', recvData => {
        console.log(recvData);
        if (recvData.message.contains('hello')) {
            const room_id = client.getRoomId(recvData.room);

            client.sendMessage(room_id, 'Howdy!');
        }
    });
    
    await client.connect();
})();

```