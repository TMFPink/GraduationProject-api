const app = require('./src/app');

// const PORT = process.env.SERVER_PORT || 3000

const PORT = 3000;

const server = app.listen(PORT, () => {
  console.log(`=============Connected: ${PORT}=============`);
  console.log(
    `API docs: \nMobileApp: http://localhost:${PORT}/v1/api-docs \nAdmin: http://localhost:${PORT}/v1/admin/api-docs \n`
  );
  console.log(`===========================================`);
});

process.on('SIGINT', () => {
  server.close(() => console.log(`Exit!`));
});
