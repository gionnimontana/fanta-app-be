const u = require('../scrapers/utils')
const fs = require('fs');
const getDirName = require('path').dirname;
const mockSquads = require('../mock/squads.json')
const mockPlayers = require('../mock/players')


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
            if (g === null) a += 1
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
    // let squads = await getAuctionableSquads()
    // let players = await getAuctionablePlayers(squads)
    
    // const squadsPath = getDirName(__dirname) + '/mock/squads.json'
    // const playerPath = getDirName(__dirname) + '/mock/players.json'

    // fs.writeFileSync(squadsPath, JSON.stringify(squads));
    // fs.writeFileSync(playerPath, JSON.stringify(players));

    // console.log(mockSquads[0].crediti)
    // console.log(mockPlayers[0].ruolo)

    const squads = mockSquads
    const players = mockPlayers

    const squadsWithP = roleAuction('portieri', squads, players)
    const squadsWithPD = roleAuction('difensori', squadsWithP, players)
    const squadsWithPDC = roleAuction('centrocampisti', squadsWithPD, players)
    const squadsWithPDCA = roleAuction('attaccanti', squadsWithPDC, players)

    const dehidratedSquads = squadsWithPDCA.map(s => {
        const idGiocatori = Object.values(s.giocatori).reduce((acc, el) => [...acc, ...el], [])
        return ({ ...s,nome: 'x', giocatori: idGiocatori.join('@') })
    })
    // const dehidratedSquads = squadsWithPDCA.map(s => ({...s, giocatori: 'giocatoroni', nome: 'x'}))

    // console.log('squadsWithPDCA', squadsWithPDCA.map(s => s.crediti))

    // fs.writeFileSync(squadsPath, JSON.stringify(squadsWithPDCA));

    await writeTeamsPlayers(dehidratedSquads)
}

const roleAuction = (role, squads, players) => {
    const callsNumber = countSquadsMissingRoleSlot(role, squads)
    const auctionerOrder = sortPerCredit(squads)
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
        const purchaseIndex = squadMap[auctioner]?.giocatori[role].findIndex(el => el === null)

        if (purchaseIndex >= 0) {
            const current = [...squadMap[auctioner].giocatori[role]]
            current[purchaseIndex] = purchase.id
            squadMap[auctioner].giocatori[role] = current
            squadMap[auctioner].crediti = squadMap[auctioner].crediti - purchase.fvm
            remaningPlayers = remaningPlayers.filter(p => p.id !== purchase.id)
        }
    }

    return Object.values(squadMap)
}

async function writeTeamsPlayers(teamsWithPlayers) {
	const json = JSON.stringify(teamsWithPlayers)
	const unquoted = json.replace(/"([^"]+)":/g, '$1:')

	const mutationString = `
        mutation insert_fanta_squads {
            insert_fanta_squads(
                objects: ${unquoted},
                on_conflict: {
                    constraint: fanta_squads_pkey,
                    update_columns: [crediti, giocatori]
                }
            ) {
                affected_rows
            }
        }
    `
    const result = await u.fetchGraphQL(mutationString, 'insert_fanta_squads', {})
    console.log(result)
}

const sortPerCredit = (squads) => {
    return squads.sort((a, b) => b.crediti - a.crediti).map(s => s.id)
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