import express from 'express'
import * as http from "node:http";
import {WebSocketServer} from "ws";
import {Employee, POS, Station} from "../../shared/src/types";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt"
import * as fs from "node:fs";
import * as types from "../../shared/src/types"

// Initialize Server
const app = express()
app.use(express.json())
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// Database
const poss = new Map<string, POS>
const stations = new Map<string, Station>
let init = !fs.existsSync('./src/database.sqlite')
const db = new sqlite3.Database('./src/database.sqlite')
if (init) {
    console.log("Initiating Database")
    fs.readdirSync('./database/schema/tables/HR').filter(file => file.endsWith('.sql')).sort().forEach(async file => {
        const sql = fs.readFileSync(`./database/schema/tables/HR/${file}`, 'utf8')
        await new Promise((resolve, reject) => {
            db.exec(sql, (err) => {
                if (err) {
                    reject(err)
                    console.error(`Failed to Initiate ${file}`)
                } else {
                    resolve(true)
                    console.log(`Initiated ${file}`)
                }
            })
        })
    })
    fs.readdirSync('./database/schema/tables/Logs').filter(file => file.endsWith('.sql')).sort().forEach(async file => {
        const sql = fs.readFileSync(`./database/schema/tables/Logs/${file}`, 'utf8')
        await new Promise((resolve, reject) => {
            db.exec(sql, (err) => {
                if (err) {
                    reject(err)
                    console.error(`Failed to Initiate ${file}`)
                } else {
                    resolve(true)
                    console.log(`Initiated ${file}`)
                }
            })
        })
    })
    fs.readdirSync('./database/schema/tables/POS').filter(file => file.endsWith('.sql')).sort().forEach(async file => {
        const sql = fs.readFileSync(`./database/schema/tables/POS/${file}`, 'utf8')
        await new Promise((resolve, reject) => {
            db.exec(sql, (err) => {
                if (err) {
                    reject(err)
                    console.error(`Failed to Initiate ${file}`)
                } else {
                    resolve(true)
                    console.log(`Initiated ${file}`)
                }
            })
        })
    })
}

function updatePOSs() {
    poss.forEach((pos) => {
        pos.socket.send(JSON.stringify({ type: "station-info", stations: Object.fromEntries(stations) }))
    })
}

// PC Client Communication
wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        try {
            if (typeof message.toString() == "string") {
                const data = JSON.parse(message.toString());
                let station: Station | undefined
                let pos: POS | undefined
                switch (data.type) {
                    case "identify-pc":
                        stations.set(data.hostname, new Station(data.hostname, ws, "vacant"))
                        console.log("Station", `"${data.hostname}"`, "Connected")
                        updatePOSs()
                        ws.on('close', () => {
                            stations.delete(data.hostname)
                            console.log('Station', `"${data.hostname}"`, "Disconnected");
                            updatePOSs()
                        })
                        break;
                    case "identify-pos":
                        poss.set(data.hostname, new POS(data.hostname, ws))
                        console.log("POS", `"${data.hostname}"`, "Connected")
                        updatePOSs()
                        ws.on('close', () => {
                            poss.delete(data.hostname)
                            console.log('POS', `"${data.hostname}"`, "Disconnected")
                            updatePOSs()
                        })
                        break;
                    case "assistance":
                        console.log("Station", `"${data.hostname}"`, "Needs Assistance")
                        station = stations.get(data.hostname)
                        station!.needsAttention = true
                        stations.set(data.hostname, station!)
                        updatePOSs()
                        break;
                    case "status-update":
                        station = stations.get(data.hostname)
                        if (station?.needsAttention) {
                            station!.needsAttention = false
                            stations.set(data.hostname, station!)
                        } else {
                            switch (station?.status) {
                                case "vacant":
                                    station.socket.send(JSON.stringify({ type: "unlock", duration: data.duration}));
                                    station.session = data.duration;
                                    station.status = "occupied"
                                    if (data.duration > 0) {
                                        setTimeout(() => {
                                            if (station) {
                                                station.socket.send(JSON.stringify({type: "lock"}))
                                                station.session = null
                                                station.status = "cleaning"
                                                stations.set(station.hostname, station);
                                                updatePOSs()
                                            }
                                        }, data.duration);
                                    }
                                    stations.set(station.hostname, station);
                                    break;
                                case "occupied":
                                    station.socket.send(JSON.stringify({ type: "lock" }))
                                    station.session = null
                                    station.status = "cleaning"
                                    stations.set(station.hostname, station);
                                    break;
                                case "cleaning":
                                    station!.status = "vacant"
                                    break;
                            }
                        }
                        updatePOSs()
                        break;
                    case 'query-database':
                        switch (data.queryType) {
                            case "auth": {
                                pos = poss.get(data.hostname);
                                const {username, password} = data
                                const userData = await new Promise<types.Employee | undefined>((resolve, reject) => {
                                    try {
                                        db.get('SELECT * FROM Employees WHERE Username = ?', [username], (err, employee: types.Employee) => {
                                            if (err) reject(err);
                                            resolve(employee)
                                        })
                                    } catch (e) {
                                        reject(e)
                                    }
                                })
                                if (userData) {
                                    if (await bcrypt.compare(password, userData.Password)) {
                                        userData.Password = ""
                                        userData.Role = await new Promise<types.Role>((resolve, reject) => {
                                            try {
                                                db.get('SELECT * FROM Roles WHERE ROWID = ?', [userData.Role], (err, role: types.Role) => {
                                                    if (err) reject(err);
                                                    resolve(role)
                                                })
                                            } catch (e) {
                                                reject(e)
                                            }
                                        })
                                        pos?.socket.send(JSON.stringify({type: "auth-response", user: userData}))
                                    } else {
                                        pos?.socket.send(JSON.stringify({type: "auth-response", error: "invalidPassword"}))
                                    }
                                } else {
                                    pos?.socket.send(JSON.stringify({type: "auth-response", error: "invalidUser"}))
                                }
                            }
                        }
                }
            } else {
                console.error("Not a JSON received.")
            }
        } catch (e) {
            console.error(e)
        }

    })
})

server.listen(49152);