const aRC = require('../../api/restCollection')
const h = require('../../helpers/index')
const maturePurchaseOffset = 86400000 // 24h
const marketFee = 1

const singleById = async (id) => {
    const purchase = await aRC.getSinglePurchase(id)
    const squads = await aRC.getAllSquads()
    const fromTeam = squads.find(s => s.id === purchase.from_team)
    const toTeam = squads.find(s => s.id === purchase.to_team)
    await validatePurchaseUnsafe(purchase, fromTeam, toTeam)
}

const validateAllMaturePurchases = async () => {
    const purchases = await aRC.getAllOpenPurchases()
    const nowTS = Date.now()
    const matureTs = nowTS - maturePurchaseOffset
    const isMature = (p) => new Date(p.updated).getTime() < matureTs
    const maturePurchases = purchases.filter(isMature)
    await validateAll(maturePurchases)
}

const validateAll = async (purchases) => {
    for (const purchase of purchases) {
        if (purchase.validated) {
          await validatePurchaseUnsafe(purchase)
        } else {
          await aRC.deletePurchase(purchase.id)
        }
    }
}

const validatePurchaseUnsafe = async (purchase) => {
  if (purchase.from_team) {
    const teamPlayer = await aRC.getTeamPlayerByLeagueAndPlayerId(purchase.league, purchase.player)
    const ft = await aRC.getSingleSquad(purchase.from_team)
    const fromTeamCredits = ft.credits + purchase.price
  if (teamPlayer) await aRC.deleteTeamPlayer(teamPlayer.id)
    await aRC.updateTeam(purchase.from_team, {credits: fromTeamCredits})
  }
  if (purchase.to_team) {
    const tt = await aRC.getSingleSquad(purchase.to_team)
    const toTeamCredits = tt.credits - purchase.price
    await aRC.writeTeamPlayer(purchase.to_team, purchase.player, purchase.league)
    await aRC.updateTeam(purchase.to_team, {credits: toTeamCredits})
  } 
  await aRC.updatePurchase(purchase.id, {closed: true})
}

const allAutomated = async () => {
  const schedule = await aRC.getSortedSchedule()
  const matchDayInProgess = h.isMatchDayInProgess(schedule)
  if (matchDayInProgess) {
    console.log('@@@CONDITIONAL-SCRIPT@@@ - auto validatePurchase: NO RUN')
    return
  }
  console.log('@@@CONDITIONAL-SCRIPT@@@ - auto validatePurchase: START')
  return await validateAllMaturePurchases()
}

const createPurchaseOffer = async (leagueId, teamId, playerId, price, maxPrice) => {
  const player = await aRC.getSinglePlayer(playerId)
  if (!player) throw new Error('invalid player')
  const isPriceValid = price >= player.fvm
  if (!isPriceValid) throw new Error('invalid price')
  const isMaxPriceValid = maxPrice >= price
  if (!isMaxPriceValid) throw new Error('invalid max price')
  const currentPurchase = await aRC.getPurchaseByLeagueAndPlayerId(leagueId, playerId)
  if (currentPurchase) throw new Error('player already on sale')
  const playerTeam = await aRC.getTeamPlayerByLeagueAndPlayerId(leagueId, playerId)
  await aRC.writePurchase(leagueId, playerId, playerTeam?.team, teamId, price, maxPrice)
}

const releasePlayer = async (leagueId, teamId, playerId) => {
  const player = await aRC.getSinglePlayer(playerId)
  if (!player) throw new Error('invalid player')
  const playerTeam = await aRC.getTeamPlayerByLeagueAndPlayerId(leagueId, playerId)
  if (!playerTeam) throw new Error('player not in team')
  if (playerTeam.team !== teamId) throw new Error('invalid team, must be player team')
  const currentPurchase = await aRC.getPurchaseByLeagueAndPlayerId(leagueId, playerId)
  if (currentPurchase) throw new Error('player already on sale')
  await aRC.writePurchase(leagueId, playerId, teamId, null, player.fvm - marketFee, player.fvm - marketFee)
}

const deletePurchaseOffer = async (id, teamId) => {
  const purchase = await aRC.getSinglePurchase(id)
  if (!purchase) throw new Error('invalid purchase')
  if (purchase.validated) throw new Error('purchase already accepted')
  if (purchase.from_team !== teamId) throw new Error('invalid team')
  await aRC.deletePurchase(id)
}

const updatePurchaseOffer = async (teamId, purchase_id, price, maxPrice) => {
  const purchase = await aRC.getSinglePurchase(purchase_id)
  if (!purchase) throw new Error('invalid purchase')
  const isPriceValid = teamId === purchase.to_team ? price >= purchase.price : price >= purchase.max_price
  if (!isPriceValid) throw new Error('invalid price')
  const isMaxPriceValid = maxPrice >= price
  if (!isMaxPriceValid) throw new Error('invalid max price')
  await aRC.updatePurchase(purchase_id, {to_team: teamId, price: price, max_price: maxPrice})
}

const acceptPurchaseOffer = async (purchase_id, teamId) => {
  const purchase = await aRC.getSinglePurchase(purchase_id)
  if (!purchase) throw new Error('invalid purchase')
  if (purchase.from_team !== teamId) throw new Error('invalid team')
  await aRC.updatePurchase(purchase_id, {validated: true})
}


module.exports = {
    singleById: singleById,
    all: validateAll,
    allAutomated: allAutomated,
    createPurchaseOffer: createPurchaseOffer,
    deletePurchaseOffer: deletePurchaseOffer,
    updatePurchaseOffer: updatePurchaseOffer,
    acceptPurchaseOffer: acceptPurchaseOffer,
    releasePlayer: releasePlayer
}