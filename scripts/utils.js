const sigmoid = (z) => {
    const k = 2;
    return 1 / (1 + Math.exp(-z/k));
}

const getPlayerFux = (player) => {
    const { play_next_match, fvm } = player
    if (play_next_match === 0) return 0
    const presenceFactor = 
        play_next_match > 80 ? 1 : 
        play_next_match > 60 ? 0.7 : 
        play_next_match > 40 ? 0.5 : 
        play_next_match > 20 ? 0.2 
        : 0.1
    return fvm * presenceFactor
}

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    sigmoid: sigmoid,
    getPlayerFux: getPlayerFux,
    sleep: sleep
}