node-lag-comp
=============

Generic lag compensation system for multiplayer javascript games.

Quick and dirty demo:
```sh
git clone https://github.com/jaburns/node-lag-comp
cd node-lag-comp
npm install
node ./server.js 200 &  # Simulate 200 ms latency on messages returning from server.
open localhost:1234
open localhost:1234
```
