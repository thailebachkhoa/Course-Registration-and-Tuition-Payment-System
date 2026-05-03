// location: backend/src/server.js

const app = require('./app');
const env = require('./configs/env');

app.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`);
  console.log(`Swagger docs on http://localhost:${env.port}/api/docs`);
});