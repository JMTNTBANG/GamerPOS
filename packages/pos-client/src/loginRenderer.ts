window.onload = () => {
    const usernameBox = document.getElementById("username") as HTMLInputElement;
    const passwordBox = document.getElementById('password') as HTMLInputElement;
    passwordBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // @ts-ignore
            window.electronAPI.modalData("login", {username: usernameBox.value, password: passwordBox.value});
            window.close()
        }
    })
}