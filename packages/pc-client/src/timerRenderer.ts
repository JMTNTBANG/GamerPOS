// @ts-ignore
window.electronAPI.onSetTime((timeString) => {
    const timerElement = document.getElementById('timer') as HTMLDivElement;
    timerElement.innerText = timeString;
});