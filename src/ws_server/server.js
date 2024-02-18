import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
export const wsServer = new WebSocketServer({ port: 3000 });

/*user-> pass, login, connection, id??, room??, wins?? */

let users = [];
let rooms = [];

wsServer.on("connection", (connection) => {
    const id = randomUUID();
    connection.on("message", (msg) => {
        const parsedMsg = JSON.parse(msg);
        const parsedData = JSON.parse(parsedMsg.data);
        console.log(parsedData);
        const user = {name: parsedData.name, password: parsedData.password, connection: connection, connectionId: id};
        users.push(user);
        console.log(users);
    })
});
