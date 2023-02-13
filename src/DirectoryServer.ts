import Debug from './Debug';
const log = Debug('DS');

import EventEmitter from 'node:events';
import matrix from 'matrix-js-sdk';

export default class DirectoryServer extends EventEmitter {
  private client: matrix.MatrixClient;
  userId = '';
  channels: { id: string; name: string; memberCount: number; topic: string }[] = [];

  constructor(username: string, password: string) {
    super();
    log('Server Init');
    this.client = matrix.createClient({ baseUrl: 'https://matrix.msnld.com' });
    this.login(username, password);
  }

  private async login(username: string, password: string) {
    let response;
    try {
      response = await this.client.login('m.login.password', { user: username, password: password });
    } catch (e) {
      console.error(e);
    }
    const { user_id } = response || {};

    if (typeof user_id !== 'string') {
      log('Error: Unable to sign in to Matrix server.');
      process.exit(1);
    }

    log('Signed in as %s', user_id);
    this.userId = user_id;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.client.once('sync', async (state: string) => {
      if (state !== 'PREPARED') {
        log('Error: Unable to synchronize due to unknown state: %s', state);
        process.exit(1);
      }
      log('Synchronization complete.');

      this.emit('sync');

      this.UpdateRooms();
      setInterval(this.UpdateRooms.bind(this), 5 * 60 * 1000); // Re-check every 5 minutes
    });

    this.client.startClient();
  }

  private async UpdateRooms() {
    log('Getting channel list...');
    const publicRooms = await this.client.publicRooms();
    this.channels = [];
    publicRooms?.chunk?.forEach((value) => {
      this.channels.push({
        id: value.room_id,
        name: value.canonical_alias || '',
        memberCount: value.num_joined_members,
        topic: value.topic || '',
      });
    });
    this.emit('update', this.channels);
    log(`${publicRooms?.chunk.length} channels found.`);
  }
}
