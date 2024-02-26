import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
export const wsServer = new WebSocketServer({ port: 3000 });

/*user-> pass, login, connection, id??, room??, wins?? */

const users = [];
const availableRooms = [];
const fullRooms = [];

wsServer.on("connection", (connection) => {
    connection.connectionId = randomUUID();
    connection.on("message", (msg) => {
        const parsedMsg = JSON.parse(msg);
        const msgType = parsedMsg.type;
        const parsedData = parsedMsg.data ? JSON.parse(parsedMsg.data) : "";
        handleMessage(msgType, parsedData, connection);
    });
});

const handleMessage = (msgType, parsedData, connection) => {
    let senderUser = {}
    senderUser = users.find((user)=>user.userId === connection.connectionId);
    let response = {};
    switch (msgType) {
        case "reg":
            const newUser = createUser(
                parsedData.name,
                parsedData.password,
                connection,
                connection.connectionId
            );
            users.push(newUser);
            response = {
                type: msgType,
                data: JSON.stringify({
                    name: newUser.name,
                    index: newUser.userId,
                    error: false,
                    errorText: "",
                }),
                id: 0,
            };
            updateRoom();
            connection.send(JSON.stringify(response));
            break;
        case "create_room":
            if(isUserInRoom(senderUser) === false){
                createRoom(senderUser);
            }
            updateRoom();
            break;
        default:
            return 0;
    }
};

const createRoom = (senderUser) =>{
    const roomId = randomUUID();
    const room = {roomId: roomId, roomUsers:[{name: senderUser.name, index: senderUser.userId}]};
    availableRooms.push(room);
}

const updateRoom = ()=>{
    const roomUpdateMsg = {
        type: "update_room",
        //maybe JSON.stringify will be needed
        data: JSON.stringify(availableRooms),
        id: 0,
    }
    wsServer.clients.forEach((connection) => {connection.send(JSON.stringify(roomUpdateMsg))})
}
const isUserInRoom = (user) =>{
    let flag = false;
    availableRooms.forEach((room) =>{
        room.roomUsers.forEach((roomUser)=>{
            if(roomUser.index.toString() === user.userId.toString()){
                flag = true;
            }
        })
    });
    return flag;
}
const createUser = (name, password, connection, connectionId) => {
    users.forEach((user) => {
        if (
            user.name === name &&
            user.password === password
        ) {
            return user;
        }
    });
    const newUser = {
        name: name,
        password: password,
        userId: connectionId,
        connection: connection,
    };
    return newUser;
};
