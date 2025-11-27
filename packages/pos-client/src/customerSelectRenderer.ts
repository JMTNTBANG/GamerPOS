// @ts-ignore
let customers = new Map<number, {FirstName: string, LastName: string, Phone: number, Email: string, BillingAddress: string}>
// @ts-ignore
window.onload = async () => {
    await new Promise<void>(resolve => {
        // @ts-ignore
        window.electronAPI.modalPreloadData((data) => {
            customers = data
            resolve()
        })
    })
    const searchQuery = document.getElementById("search") as HTMLInputElement
    searchQuery?.addEventListener("keydown", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const customerList = document.getElementById("resultList") as HTMLDivElement;
            customerList.innerHTML = ""
            customers.forEach((customer, key) => {
                if (!customer.LastName.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
                    !customer.FirstName.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
                    !customer.Email.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
                    !customer.Phone.toString().toLowerCase().includes(searchQuery.value.toLowerCase()) &&
                    !`${customer.LastName.toLowerCase()}, ${customer.FirstName.toLowerCase()}`.includes(searchQuery.value.toLowerCase())) return;
                const customerElement = document.createElement("div");
                customerElement.className = "customerDetails";
                const customerInfo = document.createElement("span")
                customerInfo.className = "customerInfo"
                customerInfo.innerText = `${customer.LastName}, ${customer.FirstName}\n${customer.Phone}\n${customer.Email}`;
                customerElement.appendChild(customerInfo);
                customerList.appendChild(customerElement);
                customerElement.addEventListener("click", () => {
                    // @ts-ignore
                    window.electronAPI.modalData("customerSelect", {key: key});
                    window.close()
                })
            })
        }
    })
}

window.onbeforeunload = () => {
    // @ts-ignore
    window.electronAPI.modalData("customerSelect", {userClose: true})
}