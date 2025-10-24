import {WebSocket} from "ws";

export class POS {
    hostname: string;
    socket: WebSocket;
    constructor(hostname: string, socket: WebSocket) {
        this.hostname = hostname;
        this.socket = socket;
    }
}

export type StationStatus = "vacant" | "occupied" | "cleaning"

export class Station {
    hostname: string;
    needsAttention: boolean = false
    session: number | null = null;
    socket: WebSocket;
    status: StationStatus;
    constructor(hostname: string, socket: WebSocket, stationStatus: StationStatus) {
        this.hostname = hostname;
        this.socket = socket;
        this.status = stationStatus;
    }
}