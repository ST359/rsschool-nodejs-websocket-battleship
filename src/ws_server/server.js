import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
export const wsServer = new WebSocketServer({ port: 3000 });

/*user-> pass, login, connection, id??, room??, wins?? */

let users = [];
let availableRooms = [];
let fullRooms = [];
let currentGames = [];

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
    let senderUser = {};
    senderUser = users.find((user) => user.userId === connection.connectionId);
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
            if (isUserInRoom(senderUser) === false) {
                createRoom(senderUser);
            }
            updateRoom();
            break;
        case "add_user_to_room":
            addUserToRoom(senderUser, parsedData.indexRoom);
            updateRoom();
            break;
        case "add_ships":
            addShips(senderUser, parsedData.ships);
            let room = findRoom(senderUser);
            console.log(senderUser);
            console.log(room);
            if (areBoardsSet(room)) {
                startGame(senderUser);
            }
            break;
        default:
            return 0;
    }
};

const startGame = (user) => {
    user.connection.send(
        JSON.stringify({
            type: "start_game",
            data: JSON.stringify({
                ships: user.ships,
                currentPlayerIndex: user.userId,
            }),
            id: 0,
        })
    );
};

const addShips = (user, ships) => {
    user.ships = ships;
    user.boardSet = true;
};
const areBoardsSet = (room) => {
    let count = 0;
    room.roomUsers.forEach((roomUser) => {
        if (users.find((user) => user.userId === roomUser.index).boardSet) {
            count++;
        }
    });
    if (count === 2) {
        return true;
    }
};

const findRoom = (user) => {
    console.log(fullRooms);
    fullRooms.forEach((room) => {
        room.roomUsers.forEach((roomUser) => {
            if (user.userId === roomUser.index) {
                return room;
            }
        });
    });
};
const addUserToRoom = (user, roomIndex) => {
    availableRooms.forEach((room) => {
        if (room.roomId === roomIndex) {
            room.roomUsers.push({ name: user.name, index: user.userId });
            fullRooms.push(room);
            createGame(room);
            const index = availableRooms.indexOf(room);
            availableRooms.splice(index, 1);
            return 1;
        }
    });
};
const createGame = (room) => {
    room.roomUsers.forEach((roomUser) =>
        users
            .find((user) => user.userId === roomUser.index)
            .connection.send(
                JSON.stringify({
                    type: "create_game",
                    data: JSON.stringify({
                        idGame: room.roomId,
                        idPlayer: roomUser.index,
                    }),
                    id: 0,
                })
            )
    );
};
const createRoom = (senderUser) => {
    const roomId = randomUUID();
    const room = {
        roomId: roomId,
        roomUsers: [{ name: senderUser.name, index: senderUser.userId }],
    };
    availableRooms.push(room);
};

const updateRoom = () => {
    const roomUpdateMsg = {
        type: "update_room",
        data: JSON.stringify(availableRooms),
        id: 0,
    };
    wsServer.clients.forEach((connection) => {
        connection.send(JSON.stringify(roomUpdateMsg));
    });
};
const isUserInRoom = (user) => {
    let flag = false;
    availableRooms.forEach((room) => {
        room.roomUsers.forEach((roomUser) => {
            if (roomUser.index.toString() === user.userId.toString()) {
                flag = true;
            }
        });
    });
    return flag;
};
const createUser = (name, password, connection, connectionId) => {
    users.forEach((user) => {
        if (user.name === name && user.password === password) {
            return user;
        }
    });
    const newUser = {
        name: name,
        password: password,
        userId: connectionId,
        connection: connection,
        boardSet: false,
        ships: [],
    };
    return newUser;
};
