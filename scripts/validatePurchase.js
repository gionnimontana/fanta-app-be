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
    for (const purchase of purchases) {
        if (purchase.validated) {
          await validatePurchaseUnsafe(purchase)
        } else {
          await aRC.deletePurchase(purchase.id)
        }
    }
}

const validatePurchaseUnsafe = async (purchase) => {
  const leagueID = "ernyanuus7tdszx"
  if (purchase.from_team) {
    const teamPlayer = await aRC.getTeamPlayerByLeagueAndPlayerId(leagueID, purchase.player)
    const ft = await aRC.getSingleSquad(purchase.from_team)
    const fromTeamCredits = ft.credits + purchase.price
  if (teamPlayer) await aRC.deleteTeamPlayer(teamPlayer.id)
    await aRC.updateTeam(purchase.from_team, {credits: fromTeamCredits})
  }
  if (purchase.to_team) {
    const tt = await aRC.getSingleSquad(purchase.to_team)
    const toTeamCredits = tt.credits - purchase.price
    await aRC.writeTeamPlayer(purchase.to_team, purchase.player, leagueID)
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


module.exports = {
    singleById: singleById,
    all: validateAll,
    allAutomated: allAutomated
}