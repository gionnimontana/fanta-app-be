const aRC = require('../api/restCollection')
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
        const fromTeam = squads.find(s => s.id === purchase.from_team)
        const toTeam = squads.find(s => s.id === purchase.to_team)
        await validatePurchaseUnsafe(purchase, fromTeam, toTeam)
    }
}

const validatePurchaseUnsafe = async (purchase, fromTeam, toTeam) => {
  if (fromTeam) {
    const fromTeamCredits = fromTeam.credits + purchase.price
    await aRC.updateTeam(fromTeam.id, {credits: fromTeamCredits})
  }
  if (toTeam) {
    const toTeamCredits = toTeam.credits - purchase.price
    await aRC.updateTeam(toTeam.id, {credits: toTeamCredits})
  }
  
  await aRC.updatePlayer(purchase.player, {fanta_team: purchase.to_team || null })
  await aRC.updatePurchase(purchase.id, {closed: true})
}

module.exports = {
    singleById: singleById,
    all: validateAll,
    allAutomated: validateAllMaturePurchases
}