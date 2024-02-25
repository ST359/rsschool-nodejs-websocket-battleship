import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
export const wsServer = new WebSocketServer({ port: 3000 });

/*user-> pass, login, connection, id??, room??, wins?? */

let users = [];
let rooms = [];

wsServer.on("connection", (connection) => {
    connection.on("message", (msg) => {
        const parsedMsg = JSON.parse(msg);
        const msgType = parsedMsg.type;
        const parsedData = parsedMsg.data ? JSON.parse(parsedMsg.data) : "";
        const response = handleMessage(msgType, parsedData, connection);
        console.log(response);
        connection.send(JSON.stringify(response));
    });
});

const handleMessage = (msgType, parsedData, connection) => {
    switch (msgType) {
        case "reg":
            const newUser = createUser(
                parsedData.name,
                parsedData.password,
                connection
            );
            users.push(newUser);
            let response = {
                type: msgType,
                data: JSON.stringify({
                    name: newUser.name,
                    index: newUser.userId,
                    error: false,
                    errorText: "",
                }),
                id: 0,
            };
            return response;
        default:
            return 0;
    }
};

const createUser = (name, password, connection) => {
    let userId = randomUUID();
    const newUser = {
        name: name,
        password: password,
        userId: userId,
        connection: connection,
    };
    return newUser;
};
