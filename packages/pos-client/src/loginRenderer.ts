window.onload = () => {
    const passwordBox = document.getElementById('password') as HTMLInputElement;
    passwordBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (passwordBox.value === 'password') {
                // @ts-ignore
                window.electronAPI.modalData("login", {auth: true})
                window.close()
            }
        }
    })
}