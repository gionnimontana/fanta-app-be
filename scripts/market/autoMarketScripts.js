const pVscripts = require('./purchasesValidationScripts')
const aRC = require('../../api/restCollection')
const h = require('../../helpers/index')
const starterIndex = 80

// buyNeed example: { 'p': 1, 'd': 1, 'c': 1, 'a': 1 }
// startersNeed example: { 'p': 1, 'd': 1, 'c': 1, 'a': 1 }
// richPlayer example: { id: 1, fvm: 100, starterIndex: 80, role: 'p', custom_fvm: 105, owned: true, active_offer: null, current_fvm: 110 }

const getCustomSortedPurchaseListPerRole = (role, richPlayers, startersNeed) => {
    const players = richPlayers[role]
    let snp = startersNeed[role]
    if (snp > 0) players.filter(p => p.starter_index >= starterIndex)
    const sortedPlayers = players.sort((a, b) => a.custom_fvm + b.custom_fvm)
    return sortedPlayers
}

const getCustomSortedPlayerToSellPerRole = (role, mp) => {
    const players = mp.teamPlayers[role]
    const sortedPlayers = players.sort((a, b) => a.custom_fvm - b.custom_fvm)
    return sortedPlayers
}

const getTeamPlayersWithOffer = (richPlayers) => {
    const allRolePlayers = [...richPlayers.p, ...richPlayers.d, ...richPlayers.c, ...richPlayers.a]
    const teamPlayersWithOffer = allRolePlayers.filter(p => p.owned === true && p.active_offer !== null)
    return teamPlayersWithOffer
}

const getOfferAppetibilityIndex = (richplayer) => {
    const { custom_fvm, active_offer } = richplayer
    if (active_offer) return 0
    const { price } = active_offer
    if (price > 1.5 * custom_fvm) return 1
    if (price < custom_fvm / 2) return 0
    const offerAppetibilityIndex = price / custom_fvm - 0.5
    return offerAppetibilityIndex
}

const getSellImpactIndex = (richplayer, mp) => {
    const isStarter = richplayer.starter_index >= starterIndex
    if (!isStarter) return 0.5
    const sameRoleStarters = mp.teamPlayers[richplayer.role].filter(p => p.starter_index >= starterIndex)
    const fvmSum = sameRoleStarters.reduce((sum, p) => sum + p.custom_fvm, 0)
    const averageCustomFvm = fvmSum / sameRoleStarters.length
    const averageCustomAfterSellFvm = (fvmSum - richplayer.custom_fvm) / (sameRoleStarters.length - 1)
    const sellImpactIndex = 0.5 + (averageCustomAfterSellFvm - averageCustomFvm) / (2 * averageCustomFvm)
    if (sellImpactIndex > 1) return 1
    return sellImpactIndex
}

const evaluateIncomingPlayerOffer = (richplayer, mp) => {
    const offerAppetibilityIndex = getOfferAppetibilityIndex(richplayer)
    if (offerAppetibilityIndex > 0.8) return true
    const sellImpactIndex = getSellImpactIndex(richplayer, mp)
    const sellNeed = mp[richplayer.role].length > 0
    if (offerAppetibilityIndex >= 0.5) {
        if (sellNeed && sellImpactIndex > 0.5) return true
    }
    return false
}

const getOffersActions = (richPlayers, mp) => {
    const teamPlayersWithOffer = getTeamPlayersWithOffer(richPlayers)
    const offerActions = {
        teamId: mp.team.id,
        leagueId: mp.team.league,
        list: [],
        rosterChanges: false
    }
    for (const p of teamPlayersWithOffer) {
        const accepted = evaluateIncomingPlayerOffer(p, mp)
        offerActions.list.push({id: purchaseId, accepted})
        if (accepted) offerActions.rosterChanges = true
    }
    return offerActions
}

const getSellActions = (mp) => {
    if (!mp.sellNeed) return
    const sellActions = {
        teamId: mp.team.id,
        leagueId: mp.team.league,
        list: []
    }
    for (const role in sellNeed) {
        const neededPlayers = sellNeed[role]
        if (neededPlayers > 0) {
            const sortedPlayers = getCustomSortedPlayerToSellPerRole(role, mp)
            const playersToSell = sortedPlayers.slice(0, neededPlayers)
            for (const player of playersToSell) {
                const price = player.current_fvm
                const maxprice = Math.max(player.current_fvm, player.custom_fvm)
                sellActions.list.push({playerID: player.id, price, maxprice})
            }
        }
    }
    return sellActions
}

const getBuyActions = (richPlayers, mp) => {
    const {buyNeed, startersNeed} = mp
    if (!buyNeed) return
    const buyActions = {
        teamId: mp.team.id,
        leagueId: mp.team.league,
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
        } else {
            await pVscripts.deletePurchaseOffer(o.id. offersActions.teamId)
        }
    }
}

const buyPlayers = async (buyActions) => {
    if (!buyActions) return
    for (const player of buyActions.list) { 
        const leagueId = buyActions.leagueId
        const playerID = player.playerID
        const price = player.price
        const maxprice = player.maxprice
        if (player.active_offer) {
            const purchaseId = player.active_offer.id
            await pVscripts.updatePurchaseOffer(buyActions.teamId, purchaseId, price, maxprice)
        }
        else {
            await pVscripts.createPurchaseOffer(leagueId, buyActions.teamId, playerID, price, maxprice)
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
    let startersNeed = {
        p: 0,
        d: 0,
        c: 0,
        a: 0
    }
    const starterP = richPlayers.p.filter(p => p.starterIndex >= starterIndex)
    const starterD = richPlayers.d.filter(p => p.starterIndex >= starterIndex)
    const starterC = richPlayers.c.filter(p => p.starterIndex >= starterIndex)
    const starterA = richPlayers.a.filter(p => p.starterIndex >= starterIndex)
    if (starterP.length < 2) startersNeed.p = 2 - starterP.length
    if (starterD.length < 4) startersNeed.d = 4 - starterD.length
    if (starterC.length < 4) startersNeed.c = 4 - starterC.length
    if (starterA.length < 3) startersNeed.a = 3 - starterA.length
    return startersNeed
}

const evalueateBuyNeeded = (richPlayers) => {
    let buyNeed = {
        p: 0,
        d: 0,
        c: 0,
        a: 0
    }
    if (richPlayers.p.length < 2) buyNeed.p = 2 - richPlayers.p.length
    if (richPlayers.d.length < 8) buyNeed.d = 8 - richPlayers.d.length
    if (richPlayers.c.length < 8) buyNeed.c = 8 - richPlayers.c.length
    if (richPlayers.a.length < 6) buyNeed.a = 6 - richPlayers.a.length
    return buyNeed
}

const evalueateSellNeeded = (richPlayers) => {
    let sellNeed = {
        p: 0,
        d: 0,
        c: 0,
        a: 0
    }
    if (richPlayers.p.length > 2) buyNeed.p = 2 - richPlayers.p.length - 2
    if (richPlayers.d.length > 8) buyNeed.d = richPlayers.d.length - 8
    if (richPlayers.c.length > 8) buyNeed.c = richPlayers.c.length - 8
    if (richPlayers.a.length > 6) buyNeed.a = richPlayers.a.length - 6
    return sellNeed
}

const getMarketParams = (team, richPlayers) => {
    const teamPlayers = getTeamPlayers(richPlayers)
    const startersNeed = evalueateStartersNeeded(teamPlayers)
    const sellNeed = evalueateSellNeeded(teamPlayers)
    const buyNeed = evalueateBuyNeeded(teamPlayers)
    return {startersNeed, sellNeed, buyNeed, team, teamPlayers}
}

const getTeamPlayers = (richPlayers) => {
    const teamPlayers = {
        p: richPlayers.p.filter(p => p.owned),
        d: richPlayers.d.filter(p => p.owned),
        c: richPlayers.c.filter(p => p.owned),
        a: richPlayers.a.filter(p => p.owned)
    }
    return teamPlayers
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
    let mp = getMarketParams(team, richPlayers)

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