export const WS_PORT = 1234;
export const getWebSocketUrl = () => `ws://${window.location.hostname}:${WS_PORT}`;