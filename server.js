require('dotenv').config({path: __dirname + '/.env'})
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const sa = require('./api/serverAuth')
const formationScript = require('./scripts/formationsScripts')
const purchaseScript = require('./scripts/market/purchasesValidationScripts')
const aRC = require('./api/restCollection')

const app = express()
const port = 8085

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}))
app.listen(port, () => { console.log(`Fantabot editing endpoint listening on port ${port}`)})

app.patch('/update_match_formation', async (req, res) => {
  const { teamId }  = await sa.getAuthenticatedSquad(req, res)
  await sa.sfc(res, () => formationScript.singleByTeamAndDay(teamId, req?.body?.day, req?.body?.formation))
  sa.safeServerResponse(res, 'formation updated')
})

app.patch('/update_team_autoformation', async (req, res) => {
  const { teamId }  = await sa.getAuthenticatedSquad(req, res)
  await sa.sfc(res, () => aRC.updateTeamAutoFormation(teamId, req?.body?.auto_formation))
  sa.safeServerResponse(res, 'team auto formation updated')
})

app.post('/purchase_offer', async (req, res) => {
  const { teamId, leagueId }  = await sa.getAuthenticatedSquad(req, res)
  await sa.sfc(res, () => purchaseScript.createPurchaseOffer(leagueId, teamId, req?.body?.player, req?.body?.price, req?.body?.max_price))
  sa.safeServerResponse(res, 'purchase offer created')
})

app.post('/delete_purchase_offer', async (req, res) => {
  const { teamId }  = await sa.getAuthenticatedSquad(req, res)
  await sa.sfc(res, () => purchaseScript.deletePurchaseOffer(req?.body?.purchase_id, teamId))
  sa.safeServerResponse(res, 'purchase offer deleted')
})

app.patch('/purchase_offer', async (req, res) => {
  const { teamId }  = await sa.getAuthenticatedSquad(req, res)
  await sa.sfc(res, () => purchaseScript.updatePurchaseOffer(teamId, req?.body?.purchase_id, req?.body?.price, req?.body?.max_price))
  sa.safeServerResponse(res, 'purchase offer updated')
})

app.post('/accept_purchase_offer', async (req, res) => {
  const { teamId }  = await sa.getAuthenticatedSquad(req, res)
  await sa.sfc(res, () => purchaseScript.acceptPurchaseOffer(req?.body?.purchase_id, teamId))
  sa.safeServerResponse(res, 'purchase offer accepted')
})

app.post('/release_player', async (req, res) => {
  const { teamId, leagueId }  = await sa.getAuthenticatedSquad(req, res)
  await sa.sfc(res, () => purchaseScript.acceptPurchaseOffer(leagueId, teamId, req?.body?.player))
  sa.safeServerResponse(res, 'purchase offer accepted')
})
