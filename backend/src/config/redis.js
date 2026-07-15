const { createClient } = require('redis');

const rclient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port: 10290
    }
});

module.exports = rclient;


