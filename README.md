node-gamesync
=============

Generic lag compensation and client-side prediction engine for multiplayer javascript games.

Quick and dirty demo:
```sh
git clone https://github.com/jaburns/node-gamesync
cd node-gamesync
npm install
node example/app 200 &  # Simulate 200 ms latency on messages returning from server.
open localhost:1234
!!
```
