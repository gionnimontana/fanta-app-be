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
    isMatchDayInProgess: isMatchDayInProgess,
    isMatchDayEndedLessThanADayAgo: isMatchDayEndedLessThanADayAgo
}