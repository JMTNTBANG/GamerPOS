import express from 'express'
import * as http from "node:http";
import {WebSocketServer, WebSocket} from "ws";

// Initialize Server
const app = express()
app.use(express.json())
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// Database
const sockets = new Map<string, WebSocket>();
const sessions = new Map<string, number>();
const statuses = new Map<string, StationStatus>();

// PC Client Communication
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            if (typeof message.toString() == "string") {
                const data = JSON.parse(message.toString());
                switch (data.type) {
                    case "identify":
                        sockets.set(data.StationID, ws)
                        statuses.set(data.StationID, "vacant")
                        console.log("Station", data.StationID, "Connected")
                        ws.on('close', () => {
                            sockets.delete(data.StationID)
                            statuses.delete(data.StationID)
                            sessions.delete(data.StationID)
                            console.log('Station', data.StationID, "Disconnected");
                        })
                        break;
                }
            } else {
                console.error("Not a JSON received.")
            }
        } catch (e) {
            console.error(e)
        }

    })
})

// POS Client Communication
app.post('/api/sessions/unlock', (req, res) => {
    const { StationID, duration } = req.body
    const station = sockets.get(StationID)
    // Check if Station Exists
    if (!station) {
        res.status(404).send("Station Not Found")
        return;
    }
    // Check if Station is already Unlocked
    if (!statuses.has(StationID) || statuses.get(StationID) !== "vacant") {
        res.status(423).send("Station Currently In Use");
        return;
    }
    station.send(JSON.stringify({ type: "unlock", duration: duration}));
    sessions.set(StationID, duration);
    statuses.set(StationID, "occupied")
    if (duration > 0) {
        setTimeout(() => {
            station.send(JSON.stringify({ type: "lock" }))
            sessions.delete(StationID)
            statuses.set(StationID, "cleaning")
        }, duration);
    }
    res.sendStatus(200)
})
app.post('/api/sessions/lock', (req, res) => {
    const { StationID } = req.body
    const station = sockets.get(StationID)
    // Check if Station Exists
    if (!station) {
        res.status(404).send("Station Not Found")
        return;
    }
    // Check if Station is already Locked
    if (!statuses.has(StationID) || statuses.get(StationID) === "vacant") {
        res.status(423).send("Station Currently Locked");
        return;
    }
    station.send(JSON.stringify({ type: "lock" }))
    sessions.delete(StationID)
    if (statuses.get(StationID) === "occupied") {
        statuses.set(StationID, "cleaning")
    } else {
        statuses.set(StationID, "vacant")
    }
    res.sendStatus(200)
})


server.listen(49152);