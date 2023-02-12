# Usage instructions

Do a `npm install`
Create `index.js` or something similar with the below code

```js

import matrixClient from "./matrixClient.js";

(async function run() {
    console.log('Running...');
    
    const baseUrl = "https://matrix.msnld.com";
    const username = 'username';
    const password = `password`;
    
    const client = new matrixClient({ baseUrl: baseUrl, username: username, password: password });
    
    await client.connect();
})();

```