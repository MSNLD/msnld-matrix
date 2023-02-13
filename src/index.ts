import matrixClient from './matrixClient';

(async () => {
  console.log('Running...');

  const baseUrl = 'https://matrix.msnld.com';
  const username = 'testuser';
  const password = 'CSsuQkT2LqFaeX8';

  const client = new matrixClient({ baseUrl: baseUrl, username: username, password: password });

  client.on('onMessageRecv', async (recvData) => {
    console.log(recvData);
    if (recvData.message.indexOf('hello') !== -1) {
      const room_id = recvData.room_id;
      if (room_id) {
        client.sendMessage(room_id, 'Howdy!');
      }
    }
  });
  client.once('syncComplete', async () => {
    const room_id = await client.findRoomId('#TheLobby:msnld.com') || '';
    if (room_id) {
      await client.join(room_id);
    }
  });

  await client.connect();
})();
