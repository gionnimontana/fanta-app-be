const aRC = require('../api/restCollection')
const h = require('../helpers/index')
const maturePurchaseOffset = 86400000 // 24h

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
    const squads = await aRC.getAllSquads()
    for (const purchase of purchases) {
        if (purchase.validated) {
          const fromTeam = squads.find(s => s.id === purchase.from_team)
          const toTeam = squads.find(s => s.id === purchase.to_team)
          await validatePurchaseUnsafe(purchase, fromTeam, toTeam)
        } else {
          await aRC.deletePurchase(purchase.id)
        }
    }
}

const validatePurchaseUnsafe = async (purchase, fromTeam, toTeam) => {
  const leagueID = "ernyanuus7tdszx"
  if (fromTeam) {
    const teamPlayerId = await aRC.getTeamPlayerByLeagueAndPlayerId(leagueID, purchase.player)
    if (teamPlayerId) await aRC.deleteTeamPlayer(teamPlayerId)
    const fromTeamCredits = fromTeam.credits + purchase.price
    await aRC.updateTeam(fromTeam.id, {credits: fromTeamCredits})
  }
  if (toTeam) {
    // await aRC.writeTeamPlayer(toTeam?.id, purchase.player, leagueID)
    const toTeamCredits = toTeam.credits - purchase.price
    await aRC.updateTeam(toTeam.id, {credits: toTeamCredits})
  } else {
    const targetTeamPlayer = await aRC.getTeamPlayerByLeagueAndPlayerId(leagueID, purchase.player)
    if (targetTeamPlayer) await aRC.deleteTeamPlayer(targetTeamPlayer.id)
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


module.exports = {
    singleById: singleById,
    all: validateAll,
    allAutomated: allAutomated
}