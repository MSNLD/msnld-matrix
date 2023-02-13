import matrixClient from './matrixClient';

(async () => {
  console.log('Running...');

  const baseUrl = 'https://matrix.msnld.com';
  const username = 'testuser';
  const password = 'CSsuQkT2LqFaeX8';

  const client = new matrixClient({ baseUrl: baseUrl, username: username, password: password });

  client.on('onMessageRecv', (recvData) => {
    console.log(recvData);
    if (recvData.message.indexOf('hello') !== -1) {
      const room_id = client.getRoomId(recvData.room);
      if (room_id) {
        client.sendMessage(room_id, 'Howdy!');
      }
    }
  });

  await client.connect();
})();
