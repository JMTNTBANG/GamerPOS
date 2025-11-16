window.onload = () => {
    const duration = document.getElementById("sessionDuration") as HTMLInputElement
    duration?.addEventListener("keydown", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // @ts-ignore
            window.electronAPI.modalData("sessionDuration", {duration: parseInt(duration.value)});
            window.close()
        }
    })
}

window.onbeforeunload = () => {
    // @ts-ignore
    window.electronAPI.modalData("sessionDuration", {userClose: true})
}