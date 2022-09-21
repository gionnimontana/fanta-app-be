const u = require('../scrapers/utils')

const teamStructure = {
    portieri: [undefined, undefined, undefined],
    difensori: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
    centrocampisti: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
    attaccanti: [undefined, undefined, undefined, undefined, undefined, undefined],
}

const randomSort = v => v.sort(() => Math.random() - 0.5)

async function getTeamsData() {
	const operationsDoc = `
    query MyQueryA {
        fanta_squads {
          crediti
          giocatori
          id
        }
      }
	`;
    const { errors, data } =  await u.fetchGraphQL(operationsDoc, "MyQueryA", {});
    if (errors) {
        console.error(errors);
        return []
    }
    return data.fanta_squads
}

async function getPlayersData() {
	const operationsDoc = `
    query MyQueryB {
        fanta_quots {
          undiciideale
          ruolo
          fvm
          id
        }
      }
	`;
    const { errors, data } = await u.fetchGraphQL(operationsDoc, "MyQueryB", {});
    if (errors) {
        console.error(errors);
        return []
    }
    return data.fanta_quots
}

const getAuctionableSquads = async () => {
    const squads = await getTeamsData()
    const hidratedSquads = squads.map(s => ({
        ...s,
        giocatori: s.giocatori ? JSON.parse(s.giocatori) : {...teamStructure}
    }))
    return randomSort(hidratedSquads)
}

const countSquadsMissingRoleSlot = (role, hidratedSquads) => {
    return hidratedSquads.reduce((acc, hs) => {
        const missingPlayers = hs.giocatori[role].reduce((a, g) => {
            if (g === undefined) a += 1
            return a
        }, 0)
        return acc += missingPlayers
    }, 0)
}

const getAuctionablePlayers = async (squads) => {
    const players = await getPlayersData()
    const unaviablePlayers = squads.reduce((acc, s) => {
        const allSquadPlayers = Object.values(s).filter(p => p !== undefined)
        return [...acc, ...allSquadPlayers]
    }, [])
    return players.filter(p => !unaviablePlayers.includes(p))
}

const startAuction = async () => {
    let squads = await getAuctionableSquads()
    let players = await getAuctionablePlayers(squads)
    
    const roles = Object.keys(teamStructure)
    roleAuction('portieri', squads, players)
}

const roleAuction = (role, squads, players) => {
    const callsNumber = countSquadsMissingRoleSlot(role, squads)
    const auctionerOrder = randomSort(squads.map(s => s.id))
    const auctNumber = auctionerOrder.length
    let squadMap = squads.reduce((acc, el) => {
       acc[el.id] = el
       return acc
    }, {})

    let remaningPlayers = players.filter(p => p.ruolo === roleMap[role]).sort((a, b) => a.fvm - b.fvm).reverse()

    for (let call = 0; call < callsNumber; call++) {
        const round = Math.floor(call / auctNumber)
        const auctionerIndex = call - (round * auctNumber)
        const titolaritaTarget = call < (callsNumber / 3) ? 80 : call < (callsNumber / 2) ? 60 : 0
        const auctioner = auctionerOrder[auctionerIndex]
        const wishList = remaningPlayers.filter(p => p.undiciideale > titolaritaTarget)
        const purchase = wishList.length > 0 ? wishList[0] : remaningPlayers[0]
        const purchaseIndex = squadMap[auctioner]?.giocatori[role].findIndex(el => el === undefined)
        if (purchaseIndex >= 0) {
            const current = [...squadMap[auctioner].giocatori[role]]
            current[purchaseIndex] = purchase.id
            squadMap[auctioner].giocatori.portieri = current
            remaningPlayers = remaningPlayers.filter(p => p.id !== purchase.id)
        }
    }

    console.log('squadMap ====>', Object.values(squadMap).map(s => s.giocatori.portieri))

}

const roleMap = {
    attaccanti: 'a',
    centrocampisti: 'c',
    difensori: 'd',
    portieri: 'p',
}

module.exports = {
    run: startAuction
}