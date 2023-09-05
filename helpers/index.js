const getCurrentMatchDay = (matchDayTimestamps) => {
    const nowTS = new Date().getTime()
    let matchDayIndex = 0
    for (let i = 0; i <= matchDayTimestamps.length; i++) {
        const endTS = new Date(matchDayTimestamps[i]?.end).getTime()
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
    const matchEndTS = new Date(s.end).getTime()
    const diff = nowTS - matchStartTS
    const diff2 = nowTS - matchEndTS
    return diff > 0 && diff2 < 0
})}

const isMatchDayEndedLessThanADayAgo = (schedule) => {
    const nowTS = new Date().getTime()
    return schedule.find(s => {
    const matchTS = new Date(s.end).getTime()
    const diff = nowTS - matchTS
    return diff > 0 && diff < 86400000
})}

module.exports = {
    getCurrentMatchDay: getCurrentMatchDay,
    isMatchDayInProgess: isMatchDayInProgess,
    isMatchDayEndedLessThanADayAgo: isMatchDayEndedLessThanADayAgo
}