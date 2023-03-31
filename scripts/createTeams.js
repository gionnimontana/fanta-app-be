const mockSquads = require('../mock/squads.json')
const aRC = require('../api/restCollection')

const roleMap = {
    attaccanti: 'a',
    centrocampisti: 'c',
    difensori: 'd',
    portieri: 'p',
}

const sortPerCredit = (squads) => {
    return squads.sort((a, b) => b.credits - a.credits).map(s => s.id)
}

const countSquadsMissingRoleSlot = (role, hidratedSquads) => {
    return hidratedSquads.reduce((acc, hs) => {
        const missingPlayers = hs.players[role].reduce((a, g) => {
            if (g === null) a += 1
            return a
        }, 0)
        return acc += missingPlayers
    }, 0)
}

const getAuctionablePlayers = async (squads) => {
    const players = await aRC.getAllPlayers()
    const unaviablePlayers = squads.reduce((acc, s) => {
        const allSquadPlayers = Object.values(s).filter(p => p !== undefined)
        return [...acc, ...allSquadPlayers]
    }, [])
    return players.filter(p => !unaviablePlayers.includes(p))
}

const roleAuction = (role, squads, players) => {
    const callsNumber = countSquadsMissingRoleSlot(role, squads)
    const auctionerOrder = sortPerCredit(squads)
    const reversedOrder = [...auctionerOrder].reverse()
    const auctNumber = auctionerOrder.length
    let squadMap = squads.reduce((acc, el) => {
       acc[el.id] = el
       return acc
    }, {})

    let remaningPlayers = players.filter(p => p.role === roleMap[role]).sort((a, b) => a.fvm - b.fvm).reverse()

    for (let call = 0; call < callsNumber; call++) {
        const round = Math.floor(call / auctNumber)
        const roundIsEven = round % 2 === 0
        const auctionerIndex = call - (round * auctNumber)
        const squadEmptySlots = squads[auctionerIndex].players[role].filter(g => g === null).length
        const totalRoleSlots = squads[auctionerIndex].players[role].length
        const titolaritaTarget = (squadEmptySlots / totalRoleSlots) > 0.8 ? 80 : (squadEmptySlots / totalRoleSlots) > 0.45 ? 60 : 0
        const auctioner = roundIsEven ? auctionerOrder[auctionerIndex] : reversedOrder[auctionerIndex]
        const wishList = remaningPlayers.filter(p => p.starter_index > titolaritaTarget)
        const purchase = wishList.length > 0 ? wishList[0] : remaningPlayers[0]
        const purchaseIndex = squadMap[auctioner]?.players[role].findIndex(el => el === null)

        if (purchaseIndex >= 0) {
            const current = [...squadMap[auctioner].players[role]]
            current[purchaseIndex] = purchase.id
            squadMap[auctioner].players[role] = current
            squadMap[auctioner].credits = squadMap[auctioner].credits - purchase.fvm
            remaningPlayers = remaningPlayers.filter(p => p.id !== purchase.id)
        }
    }

    return Object.values(squadMap)
}

const startAuction = async () => {
    const squads = mockSquads
    const players = await getAuctionablePlayers(squads)
    const squadsWithP = roleAuction('portieri', squads, players)
    const squadsWithPD = roleAuction('difensori', squadsWithP, players)
    const squadsWithPDC = roleAuction('centrocampisti', squadsWithPD, players)
    const squadsWithPDCA = roleAuction('attaccanti', squadsWithPDC, players)

    const dehidratedSquads = squadsWithPDCA.map((s, id) => {
        const idGiocatori = Object.values(s.players).reduce((acc, el) => [...acc, ...el], [])
        return ({ 
            credits: s.credits,
            name: `squad-${id}`, 
            players: idGiocatori.join('@') })
    })

    console.log('squadsWithPDCA', squadsWithPDCA.map(s => s.credits))
    await aRC.writeSquads(dehidratedSquads)
}

module.exports = {
    run: startAuction
}