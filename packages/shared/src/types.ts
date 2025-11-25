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

// Based on employees.sql
export interface Employee {
    rowid?: number; // Implicit SQLite ID, referenced by other tables
    FirstName: string;
    MiddleName: string;
    LastName: string;
    Password: string;
    DOB: string; // SQL DATE returns as string
    Sex: string;
    Email: string;
    Phone: string;
    PayRate: number;
    Role: number; // FK to Roles table
    Username: string;
    DateCreated: string;
    Author: number; // FK to Employees
}

// Based on products.sql
export interface Product {
    SKU: string; // Acts as Primary Key
    Description: string;
    Price: number;
    DateCreated: string;
    Author: number; // FK to Employees
}

// Based on customers.sql
export interface Customer {
    rowid?: number; // Implicit SQLite ID, referenced by Transactions
    FirstName: string;
    LastName: string;
    Phone: string;
    Email: string;
    BillingAddress: string;
    DateCreated: string;
    Author: number; // FK to Employees
}

// Based on transactions.sql
export interface Transaction {
    rowid?: number; // Implicit SQLite ID, referenced by TransactionLineItems
    Customer: number; // FK to Customers
    POS: string;
    Station: string;
    DateCreated: string;
    Author: number; // FK to Employees
}

// Based on transactionLineItems.sql
export interface TransactionLineItem {
    SKU: string; // FK to Products
    Qty: number;
    Price: number;
    DateCreated: string;
    Author: number; // FK to Employees
    TransactionID: number; // FK to Transactions
}

// Based on attendance.sql
export interface Attendance {
    Employee: number; // FK to Employees
    PunchTime: string;
}

// Based on clientTraffic.sql
export interface ClientTraffic {
    Hostname: string;
    ClientType: number;
    TrafficType: number;
    DateLogged: string;
}

// --- Audit / Log Tables ---

// Based on drops.sql
export interface Drop {
    Source: string;
    ID: number;
    OldData: string; // SQL JSON column returns as string. Needs JSON.parse()
    Author: number; // FK to Employees
    DateDropped: string;
}

// Based on inserts.sql
export interface Insert {
    Source: string;
    ID: number;
    NewData: string; // SQL JSON column returns as string
    Author: number; // FK to Employees
    DateInserted: string;
}

// Based on changes.sql
export interface Change {
    Source: string;
    ID: number;
    OldData: string; // SQL JSON column returns as string
    NewData: string; // SQL JSON column returns as string
    Author: number; // FK to Employees
    DateChanged: string;
}

// Based on roles.sql
export interface Role {
    rowid?: number; // Implicit SQLite ID, referenced by Employees table
    Description: string;
    ClearanceLevel: number;
}