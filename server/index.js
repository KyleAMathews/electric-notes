import { createWebSocketServer } from './websocket.js';

const WS_PORT = 1234;
createWebSocketServer(WS_PORT);