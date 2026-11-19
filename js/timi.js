const fireworkContainer = document.querySelector('.fireworks-container')
const daysSpan = document.querySelector('#days')
const hoursSpan = document.querySelector('#hours')
const minutesSpan = document.querySelector('#minutes')
const secondsSpan = document.querySelector('#seconds')
const newYear = document.querySelector('#new-year')
const statusText = document.querySelector('#time-status')
const popup = document.querySelector('#popup')
const popupBtn = document.querySelector('#popup-btn')
const popupYear = document.querySelector('#popup-year')
const bgMusic = document.querySelector('#bg-music')

const BD_OFFSET = 6 * 60 * 60 * 1000 // Bangladesh = UTC+6
let timeOffset = 0 // internet time ar PC time-er parthokko

// 5 second-er moddhe response na ashle bondho kore dibe
const fetchJson = async (url) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
        if (!res.ok) throw new Error('Bad response')
        return await res.json()
    } finally {
        clearTimeout(timer)
    }
}

// Internet time-er site gulo (ekta na choltle porer ta try hobe)
// Prottekta server-er UTC time (milliseconds) ferot dey
const timeSources = [
    async () => {
        const data = await fetchJson('https://worldtimeapi.org/api/timezone/Etc/UTC')
        return data.unixtime * 1000
    },
    async () => {
        const d = await fetchJson('https://timeapi.io/api/Time/current/zone?timeZone=UTC')
        return Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.seconds)
    },
    async () => {
        const d = await fetchJson('https://timeapi.io/api/time/current/zone?timeZone=UTC')
        return Date.parse(d.dateTime + 'Z')
    }
]

const setStatus = (msg) => {
    if (statusText) statusText.textContent = msg
}

// Internet theke real time ana
const syncTime = async () => {
    for (const getTime of timeSources) {
        try {
            const start = Date.now()
            const serverTime = await getTime()
            const end = Date.now()
            if (!Number.isFinite(serverTime)) throw new Error('Invalid time')

            // Request-e jei somoy legechhe tar aadha jog kore sothik kora
            timeOffset = serverTime + (end - start) / 2 - end
            setStatus('Internet time use hochche')
            return true
        } catch (e) {
            // porer site try korbe
        }
    }
    setStatus('Offline: PC time use hochche')
    return false
}

const countdown = () => {
    const realNow = Date.now() + timeOffset

    // Bangladesh time onujayi ekhon-kar year
    const bdDate = new Date(realNow + BD_OFFSET)
    const targetYear = bdDate.getUTCFullYear() + 1

    // Bangladesh time-er 1 January 12:00 AM
    const countToDate = Date.UTC(targetYear, 0, 1) - BD_OFFSET
    const distance = Math.max(0, countToDate - realNow)

    const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    newYear.textContent = targetYear
    daysSpan.textContent = days
    hoursSpan.textContent = hours
    minutesSpan.textContent = minutes
    secondsSpan.textContent = seconds

    // Popup year o every tick-e update hobe, tai sync-er por-o thik thakbe
    popupYear.textContent = targetYear
}

// Countdown sathe sathe shuru, sync hole nijei thik hoye jabe
countdown()
setInterval(countdown, 1000)

syncTime()

// Proti 10 minute-e abar sync
setInterval(syncTime, 10 * 60 * 1000)


// Fireworks
const fireworks = new Fireworks(fireworkContainer, {
    speed: 4,
    acceleration: 1.05,
    friction: 1,
    gravity: 4,
    particles: 400,
    explosion: 10
})

fireworks.start()


// Background music
bgMusic.volume = 0.5

const playMusic = () => bgMusic.play().catch(() => {})

// Browser autoplay block korle prothom click-e music shuru hobe
playMusic().then(() => {}).catch(() => {})
document.addEventListener('click', () => {
    if (bgMusic.paused) playMusic()
}, { once: true })


// Popup start
popupBtn.addEventListener('click', () => {
    popup.classList.add('hide')
    playMusic()
})
// pop up end