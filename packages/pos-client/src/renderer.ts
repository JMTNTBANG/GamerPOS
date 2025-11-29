type StationStatus = "vacant" | "occupied" | "cleaning"
class Station {
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
let hostname: string | null = null;

let getStationForDurationDefinition = (callback: Function) => {}

// @ts-ignore
window.electronAPI.onServerInfo((value) => {
    connectToServer(value!.ip);
    hostname = value!.hostname;
})

function calcSaleTotal() {
    let total = 0
    const posTable = document.querySelector("#POSTab > div:nth-child(1) > table") as HTMLTableElement
    for (let i = 0; i < posTable.rows.length; i++) {
        let row = posTable.rows.item(i) as HTMLTableRowElement
        let qty = parseFloat(row.cells.item(2)!.querySelector('input')!.value)
        let price =  parseFloat(row.cells.item(3)!.querySelector('input')!.value)
        if (qty && price) total += qty * price
    }
    const totalLabel = document.querySelector("#POSTab > div:nth-child(2) > div:nth-child(2) > span") as HTMLSpanElement
    totalLabel.innerText = `Sale Total: $${total.toFixed(2)}`
}

async function showModal(modal: string, data: any = "") {
    return new Promise<any>(resolve => {
        document.getElementById("loadScreen")!.style.display = 'flex';
        // @ts-ignore
        window.electronAPI.showModal(modal, data)
        // @ts-ignore
        window.electronAPI.modalCallback(modal, (data: any) => {
            document.getElementById("loadScreen")!.style.display = 'none';
            resolve(data)
        })
    })
}

let activeEmployee: Object | string | null
let transactionCustomer
const currentTransaction = new Map<number, {sku: string, qty: number, price: number}>();

const products = new Map<string, {Description: string, Price: number}>
// @ts-ignore
const customers = new Map<number, {FirstName: string, LastName: string, Phone: number, Email: string, BillingAddress: string}>

window.onload = async () => {
    const tabButtons = document.getElementsByClassName('tabButton') as HTMLCollectionOf<HTMLButtonElement>
    const tabs = document.getElementsByClassName('tab') as HTMLCollectionOf<HTMLDivElement>
    function enableAllButtons () {
        for (let i = 0; i < tabButtons.length; i++) {
            tabButtons.item(i)!.classList.remove('active');
            tabButtons.item(i)!.disabled = false;
        }
    }
    function hideAllTabs() {
        for (let i = 0; i < tabs.length; i++) {
            tabs.item(i)!.style.display = 'none';
        }
    }
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener('click', (e) => {
            e.preventDefault();
            enableAllButtons();
            tabButtons.item(i)!.classList.add('active');
            tabButtons.item(i)!.disabled = true;
            hideAllTabs();
            const tab = document.getElementById(tabButtons.item(i)!.id.slice(0, -6) + "Tab")
            tab!.style.display = 'flex';
        })
    }
}

const attentionClock = setInterval(() => {
    const attention = document.getElementsByClassName("attention")
    for (let i = 0; i < attention.length; i++) {
        const element = attention[i] as HTMLButtonElement;
        // @ts-ignore
        window.electronAPI.beep()
        element.classList.toggle("attention")
        setTimeout(() => {
            element.classList.toggle("attention")
        }, 500)
    }
},1000)

let onAuthReturn: Function = (data: any) => {}
let onGetCustomersReturn: Function = (data: any) => {}
let onGetProductsReturn: Function = (data: any) => {}

function connectToServer(ip: string) {
    const ws = new WebSocket(`ws://${ip}:49152`);
    ws.onopen = async () => {
        console.log('Connected to server')
        ws.send(JSON.stringify({type: "identify-pos", hostname: hostname}))
        const login = await showModal('login')
        document.getElementById("loadScreen")!.style.display = 'flex';
        if (login.username && login.password) {
            ws.send(JSON.stringify({type: "query-database", hostname: hostname, queryType: "auth", username: login.username, password: login.password}))
            onAuthReturn = (data: any) => {
                if (data.error && !data.user) {
                    switch (data.error) {
                        case "invalidUser":
                            // @ts-ignore
                            window.electronAPI.showErrorBox({title: "User not Found", message: ""})
                            break;
                        case "invalidPassword":
                            // @ts-ignore
                            window.electronAPI.showErrorBox({title: "Password is Incorrect", message: ""})
                            break;
                    }
                    window.location.reload()
                    return;
                } else {
                    activeEmployee = data
                    document.getElementById("employeeLabel")!.innerText = `Active Employee: ${data.user.FirstName} ${data.user.LastName} | ${data.user.Role.Description}`
                    document.getElementById("loadScreen")!.style.display = 'none';
                    onAuthReturn = (data: any) => {}
                }
            }
        } else {
            // @ts-ignore
            window.electronAPI.showErrorBox({title: "Invalid Credentials", message: ""})
            window.location.reload()
            return;
        }
        ws.send(JSON.stringify({type: "query-database", hostname: hostname, queryType: "get-customers"}))
        onGetCustomersReturn = (data: Array<any>) => {
            let i = 0
            customers.clear()
            data.forEach((item) => {
                customers.set(i, item)
                i++
            })
            document.getElementById("setCustomer")?.addEventListener("click", async (e) => {
                const customer = await showModal("customerSelect", customers)
                if (customer.key !== undefined) {
                    transactionCustomer = customers.get(customer.key)
                    if (!transactionCustomer) return;
                    document.querySelector("#name")!.innerHTML = `${transactionCustomer.FirstName} ${transactionCustomer.LastName}`
                    document.querySelector("#phoneNumber")!.innerHTML = transactionCustomer.Phone.toString()
                    document.querySelector("#email")!.innerHTML = transactionCustomer.Email
                    document.querySelector("#address")!.innerHTML = transactionCustomer.BillingAddress.split(", ")[0]
                    document.querySelector("#city")!.innerHTML = `${transactionCustomer.BillingAddress.split(", ")[1]}, ${transactionCustomer.BillingAddress.split(", ")[2]}`
                }
            })

        }
        ws.send(JSON.stringify({type: "query-database", hostname: hostname, queryType: "get-products"}))
        onGetProductsReturn = (data: Array<any>) => {
            products.clear()
            data.forEach((item) => {
                products.set(item.SKU, item)
            })
            const skuBox = document.querySelector("#skuBox") as HTMLInputElement
            skuBox.addEventListener("keydown", async (e) => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    addItem(skuBox.value.toLowerCase())
                    skuBox.value = ""
                }
            })
        }
    }
    ws.onmessage = (e) => {
        const message = JSON.parse(e.data);
        switch (message.type) {
            case "station-info":
                let stations = new Map<string, Station>(Object.entries(message.stations))
                stations = new Map<string, Station>(Array.from(stations.entries()).sort((a, b) => a[0].localeCompare(b[0])))
                const stationsTab = document.getElementById("stationsTab") as HTMLDivElement;
                const availableStationsModal = document.getElementById("availableStationsModal") as HTMLDivElement;
                stationsTab.innerHTML = ""
                availableStationsModal.innerHTML = ""
                const availableStationsModalBox = document.createElement('div')
                const availableStationsModalHeader = document.createElement('h3')
                availableStationsModalHeader.innerText = "Available Stations"
                availableStationsModalBox.classList.add('modalBox');
                availableStationsModalBox.appendChild(availableStationsModalHeader);
                availableStationsModal.appendChild(availableStationsModalBox);
                stations.forEach((station: Station) => {
                    const button = document.createElement("button");
                    button.classList.add('stationButton', station.status);
                    if (station.needsAttention) button.classList.add('attention');
                    button.addEventListener("click", async (e) => {
                        if (station.status === "vacant") {
                            e.preventDefault()
                            const modalResult = await showModal('sessionDuration')
                            if (typeof modalResult.duration !== 'undefined')
                            ws.send(JSON.stringify({type: "status-update", hostname: station.hostname, duration: modalResult.duration * 60000}))
                        } else {
                            ws.send(JSON.stringify({type: "status-update", hostname: station.hostname}))
                        }

                    })
                    button.id = station.hostname
                    button.innerText = station.hostname;
                    stationsTab.appendChild(button);
                })
                break;
            case 'auth-response':
                onAuthReturn(message)
                break;
            case 'get-customers-response':
                onGetCustomersReturn(message.data)
                break;
            case 'get-products-response':
                onGetProductsReturn(message.data)
                break;
        }
    }
    ws.onclose = (e) => {
        console.log("Disconnected from server");
        setTimeout(() => connectToServer(ip), 1000)
        document.getElementById("loadScreen")!.style.display = 'flex';
    }
    ws.onerror = (error) => {
        console.error(error)
    }
}

let transactionItemIDIndex = 0

function calcTransactionTotal() {
    const totalLabel = document.querySelector("#POSTab > div:nth-child(2) > div:nth-child(2) > span") as HTMLSpanElement
    let totalPrice = 0
    currentTransaction.forEach((item) => {
        totalPrice += item.qty * item.price
    })
    totalLabel.innerText = `Sale Total: $${totalPrice.toFixed(2)}`
}

function addItem(SKU: string) {
    const transactionItemID = transactionItemIDIndex
    const product = products.get(SKU)
    if (product) {
        const transactionDetails = document.createElement('div')
        const itemDelete = document.createElement('button')
        const itemDetails = document.createElement('span')
        const itemQty = document.createElement('input')
        const itemPrice = document.createElement('input')
        itemQty.type = 'number'
        itemPrice.type = 'number'
        itemQty.step = "0.5"
        itemPrice.step = "0.01"
        transactionDetails.classList.add('transactionDetails')
        itemDelete.classList.add('itemDelete')
        itemDetails.classList.add('itemDetails')
        itemQty.classList.add('itemQty')
        itemPrice.classList.add('itemPrice')
        itemDelete.innerHTML = '&#11199;'
        itemDetails.innerText = product.Description
        itemQty.value = "1"
        itemPrice.value = product.Price.toString()
        transactionDetails.appendChild(itemDelete)
        transactionDetails.appendChild(itemDetails)
        transactionDetails.appendChild(itemQty)
        transactionDetails.appendChild(itemPrice)
        document.querySelector("#POSTab > div:nth-child(2) > div:nth-child(1)")?.appendChild(transactionDetails)
        currentTransaction.set(transactionItemID, {sku: SKU, qty: parseFloat(itemQty.value), price: parseFloat(itemPrice.value)})
        calcTransactionTotal()
        
        itemDelete.addEventListener('click', () => {
            transactionDetails.remove()
            currentTransaction.delete(transactionItemID)
            calcTransactionTotal()
        })
        itemQty.addEventListener('change', (e) => {
            currentTransaction.set(transactionItemID, {sku: SKU, qty: parseFloat(itemQty.value), price: parseFloat(itemPrice.value)})
            calcTransactionTotal()
        })
        itemPrice.addEventListener('change', (e) => {
            currentTransaction.set(transactionItemID, {sku: SKU, qty: parseFloat(itemQty.value), price: parseFloat(itemPrice.value)})
            calcTransactionTotal()
        })

        transactionItemIDIndex ++
    } else {
        // @ts-ignore
        window.electronAPI.showErrorBox({title: "Invalid SKU", message: "The SKU you provided is Invalid"})
    }
}

function clearCustomer (){
    transactionCustomer = undefined
    document.querySelector("#name")!.innerHTML = ``
    document.querySelector("#phoneNumber")!.innerHTML = ``
    document.querySelector("#email")!.innerHTML = ``
    document.querySelector("#address")!.innerHTML = ``
    document.querySelector("#city")!.innerHTML = ``
}