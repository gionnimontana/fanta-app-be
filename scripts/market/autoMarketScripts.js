const pVscripts = require('./purchasesValidationScripts')
const aRC = require('../../api/restCollection')
const h = require('../../helpers/index')

// buyNeed example: { 'p': 1, 'd': 1, 'c': 1, 'a': 1 }
// startersNeed example: { 'p': 1, 'd': 1, 'c': 1, 'a': 1 }
// richPlayer example: { id: 1, fvm: 100, starter_index: 80, role: 'p', custom_fvm: 105, owned: true, active_offer: null, current_fvm: 110 }

const getCustomSortedPurchaseListPerRole = (role, richPlayers, startersNeed) => {
    const players = richPlayers[role]
    let snp = startersNeed[role]
    if (snp > 0) richPlayers.filter(p => p.starter_index > 80)
    const sortedPlayers = players.sort((a, b) => a.custom_fvm - b.custom_fvm)
    return sortedPlayers
}

const getBuyActions = (richPlayers, mp) => {
    const {buyNeed, startersNeed} = mp
    if (!buyNeed) return
    const buyActions = {
        teamId: team.id,
        leagueId: team.league,
        list: []
    }
    for (const role in buyNeed) {
        const neededPlayers = buyNeed[role]
        if (neededPlayers > 0) {
            const sortedPlayers = getCustomSortedPurchaseListPerRole(role, richPlayers, startersNeed)
            const playersToBuy = sortedPlayers.slice(0, neededPlayers)
            for (const player of playersToBuy) {
                const price = player.current_fvm
                const maxprice = Math.max(player.current_fvm, player.custom_fvm)
                const fromsquad = null
                buyActions.list.push({playerID: player.id, fromsquad, price, maxprice})
            }
        }
    }
    return buyActions
}

const manageIncomingOffers = async (offersActions) => {
    if (!offersActions) return
    for (const o of offersActions.list) { 
        if (o.accepted) {
            const purchaseId = o.id
            await pVscripts.acceptPurchaseOffer(purchaseId, offersActions.teamId)
        }
    }
}

const buyPlayers = async (buyActions) => {
    if (!buyActions) return
    for (const player of buyActions.list) { 
        const leagueId = buyActions.leagueId
        const playerID = player.playerID
        const fromsquad = player.fromsquad
        const tosquad = buyActions.teamId
        const price = player.price
        const maxprice = player.maxprice
        if (player.active_offer) {
            const purchaseId = player.active_offer.id
            await pVscripts.updatePurchaseOffer(buyActions.teamId, purchaseId, price, maxPrice)
        }
        else {
            await pVscripts.createPurchaseOffer(leagueId, playerID, fromsquad, tosquad, price, maxprice)
        }
    }
}

const sellPlayers = async (sellActions) => {
    if (!sellActions) return
    for (const s of sellActions.list) { 
        const leagueId = sellActions.leagueId
        const playerID = s.playerID
        const fromsquad = sellActions.teamId
        const tosquad = null
        const price = s.price
        const maxprice = s.maxprice
        await pVscripts.createPurchaseOffer(leagueId, playerID, fromsquad, tosquad, price, maxprice)
    }
}

const evalueateStartersNeeded = (richPlayers) => {
    const teamPlayers = richPlayers.filter(p => p.owned)
    const si = 80
    let startersNeed = {
        p: 0,
        d: 0,
        c: 0,
        a: 0
    }
    const starterP = teamPlayers.filter(p => p.role === 'p' && p.starter_index > si)
    const starterD = teamPlayers.filter(p => p.role === 'd' && p.starter_index > si)
    const starterC = teamPlayers.filter(p => p.role === 'c' && p.starter_index > si)
    const starterA = teamPlayers.filter(p => p.role === 'a' && p.starter_index > si)
    if (starterP.length < 1) startersNeed.p = 1
    if (starterD.length < 4) startersNeed.d = 4 - starterD.length
    if (starterC.length < 4) startersNeed.c = 4 - starterC.length
    if (starterA.length < 3) startersNeed.a = 3 - starterA.length
    return startersNeed
}

// buyNeed example: { 'p': 1, 'd': 1, 'c': 1, 'a': 1 }
const evalueateBuyNeeded = (richPlayers) => {
    const teamPlayers = richPlayers.filter(p => p.owned)
    let buyNeed = {
        p: 0,
        d: 0,
        c: 0,
        a: 0
    }
    const totalP = teamPlayers.filter(p => p.role === 'p')
    const totalD = teamPlayers.filter(p => p.role === 'd')
    const totalC = teamPlayers.filter(p => p.role === 'c')
    const totalA = teamPlayers.filter(p => p.role === 'a')
    if (totalP.length < 3) startersNeed.p = 1 - totalP.length
    if (totalD.length < 4) startersNeed.d = 4 - totalP.length
    if (totalC.length < 4) startersNeed.c = 4 - totalC.length
    if (totalA.length < 3) startersNeed.a = 3 - totalA.length
    return startersNeed
}


const getMarketParams = (richPlayers) => {
    const startersNeed = evalueateStartersNeeded(teamRoaster, richPlayers)
    const sellNeed = evalueateSellNeeded(richPlayers)
    const buyNeed = evalueateBuyNeeded(richPlayers)
    return {startersNeed, sellNeed, buyNeed}
}

const getRichPlayers = (customFVM, teamRoaster, players, leaguePurchases) => {
    const leaguePurchasesMapByPlayer = leaguePurchases.reduce((map, obj) => {
        map[obj.player] = obj
        return map
    }, {})
    const playerRoleMap = {
        p: [],
        d: [],
        c: [],
        a: []
    }
    for (const p of players) {
        const active_offer = leaguePurchasesMapByPlayer[p.id]
        const owned = teamRoaster.find(tp => tp.player === p.id) ? true : false
        const custom_fvm = customFVM[p.id] ? customFVM[p.id].fvm : p.fvm
        const current_fvm = active_offer ? active_offer.price : p.fvm
        playerRoleMap[p.role].push({ ...p, custom_fvm, owned, active_offer, current_fvm })
    }
    return playerRoleMap
}

const getTeamCustomFVM = (allPlayers) => {
    const customFVM = {}
    for (const p of allPlayers) {
        if (p.custom_fvm) customFVM[p.id] = p.custom_fvm
    }
    return customFVM
}

const runAutoMarket = async (team, allPlayers) => {
    const teamRoaster = await aRC.getTeamPlayersByTeam(team.id)
    const leaguePurchases = await aRC.getAllOpenPurchasesByLeague(team.league)
    const customFVM = getTeamCustomFVM(allPlayers)
    let richPlayers = getRichPlayers(customFVM,teamRoaster, allPlayers, leaguePurchases)
    let mp = getMarketParams(richPlayers)

    const offersActions = getOffersActions(richPlayers, mp)

    if (offersActions.rosterChanges) {
        richPlayers = getLevingPlayers(offersActions, richPlayers)
        mp = getMarketParams(richPlayers)
    }

    const sellActions = getSellActions(richPlayers, mp)

    if (sellActions) {
        richPlayers = getLevingPlayers(sellActions, richPlayers)
        mp = getMarketParams(richPlayers)
    }
    
    const buyActions = getBuyActions(richPlayers, mp)

    await manageIncomingOffers(offersActions)
    await sellPlayers(sellActions)
    await buyPlayers(buyActions)
}

const runAutoMarketManager = async () => {
    const teams = await aRC.getAllSquads()
    const allPlayers = await aRC.getAllPlayers(true)
    for (const t of teams) {
        if (t.auto_market) {
            try {
                await runAutoMarket(t, allPlayers)
            } catch (e) {
                console.log('@@@CONDITIONAL-SCRIPT-ERROR@@@ - auto validatePurchase failded on team:' + t.id)
                console.log(e)
            }
        }
    }
}


const allAutomated = async () => {
  const schedule = await aRC.getSortedSchedule()
  const matchDayInProgess = h.isMatchDayInProgess(schedule)
  if (matchDayInProgess) {
    console.log('@@@CONDITIONAL-SCRIPT@@@ - auto validatePurchase: NO RUN')
    return
  }
  console.log('@@@CONDITIONAL-SCRIPT@@@ - auto validatePurchase: START')
  return await runAutoMarketManager()
}

const runAutoMarketOnDevLeague = async () => {
    const devLeagueId = '1bn2o4kzza0ufc1'
    const teams = await aRC.getAllSquadsByLeague(devLeagueId)
    const allPlayers = await aRC.getAllPlayers()
    for (const t of teams) {
        if (t.auto_market) {
            try {
                await runAutoMarket(t, allPlayers)
            } catch (e) {
                console.log('@@@CONDITIONAL-SCRIPT-ERROR@@@ - auto validatePurchase failded on team:' + t.id)
                console.log(e)
            }
        }
    }
}


module.exports = {
    allAutomated: allAutomated,
    test: runAutoMarketOnDevLeague
}