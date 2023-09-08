const getCurrentMatchDay = (matchDayTimestamps) => {
    const nowTS = new Date().getTime()
    let matchDayIndex = 0
    for (let i = 0; i <= matchDayTimestamps.length; i++) {
        const endTS = getLocalizedDate(matchDayTimestamps[i]?.end)
        if (nowTS < endTS) {
            matchDayIndex = i
            break
        }
    }
    return matchDayTimestamps[matchDayIndex]
}

const isMatchDayInProgess = (schedule) => {
    const nowTS = new Date().getTime()
    return schedule.find(s => {
    const matchStartTS = new Date(s.start).getTime()
    const matchEndTS = getLocalizedDate(s.end)
    const diff = nowTS - matchStartTS
    const diff2 = nowTS - matchEndTS
    return diff > 0 && diff2 < 0
})}

const isMatchDayEndedLessThanADayAgo = (schedule) => {
    const nowTS = new Date().getTime()
    return schedule.find(s => {
    const matchTS = getLocalizedDate(s.end)
    const diff = nowTS - matchTS
    return diff > 0 && diff < 86400000
})}

const isMatchDayStarted = (date) => {
    const nowTS = new Date().getTime()
    return getLocalizedDate(date) < nowTS
}

const getLocalizedDate = (date) => {
    return new Date(date + '+02:00').getTime()
}

module.exports = {
    getCurrentMatchDay: getCurrentMatchDay,
    isMatchDayInProgess: isMatchDayInProgess,
    isMatchDayEndedLessThanADayAgo: isMatchDayEndedLessThanADayAgo,
    isMatchDayStarted: isMatchDayStarted,
}