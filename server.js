const app = require("./src/app");  

// const PORT = process.env.SERVER_PORT || 3000

const PORT = 3000;

const server = app.listen( PORT, () => {
    
    console.log(`Connected: ${PORT}`)
    console.log(`API docs: http://localhost:${PORT}/v1/api-docs`)
})

process.on('SIGINT', () => {
    server.close( () => console.log(`Exit!`))
})