// @ts-ignore
const testCustomers = new Map<string, {firstName: string, lastName: string, phone: number, email: string, billingAddr: string}>
testCustomers.set("0", {firstName: "Matt", lastName: "Abney", phone: 7014159467, email: "example@example.com", billingAddr: "555 S 5th Street, Five, FI 55555"})
testCustomers.set("1", {firstName: "James", lastName: "Miller", phone: 7018640465, email: "jmtntbang@proton.me", billingAddr: "2498 30th Ave S Apt 119, Grand Forks, ND 58201"})
testCustomers.set("2", {firstName: "Jenny", lastName: "Kuhns", phone: 7017756327, email: "jennylkuhns2012@yahoo.com", billingAddr: "5198 W Maple Ave, Grand Forks, ND 58203"})
testCustomers.set("3", {firstName: "Dean", lastName: "Kuhns", phone: 3033493620, email: "deancubed@aol.com", billingAddr: "5198 W Maple Ave, Grand Forks, ND 58203"})
testCustomers.set("4", {firstName: "John", lastName: "Doe", phone: 5555555555, email: "example@example.com", billingAddr: "555 S 5th Street, Five, FI 55555"})
testCustomers.set("5", {firstName: "Jane", lastName: "Doe", phone: 5555555555, email: "example@example.com", billingAddr: "555 S 5th Street, Five, FI 55555"})


window.onload = () => {
    const searchQuery = document.getElementById("search") as HTMLInputElement
    searchQuery?.addEventListener("keydown", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const customerList = document.getElementById("resultList") as HTMLDivElement;
            customerList.innerHTML = ""
            testCustomers.forEach((customer, key) => {
                if (!customer.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
                    !customer.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
                    !customer.email.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
                    !customer.phone.toString().toLowerCase().includes(searchQuery.value.toLowerCase()) &&
                    !`${customer.lastName.toLowerCase()}, ${customer.firstName.toLowerCase()}`.includes(searchQuery.value.toLowerCase())) return;
                const customerElement = document.createElement("div");
                customerElement.className = "customerDetails";
                const customerInfo = document.createElement("span")
                customerInfo.className = "customerInfo"
                customerInfo.innerText = `${customer.lastName}, ${customer.firstName}\n${customer.phone}\n${customer.email}`;
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