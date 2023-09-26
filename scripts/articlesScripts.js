const { Configuration, OpenAIApi } = require("openai");
const aRC = require('../api/restCollection');
const h = require('../helpers/index')

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


const writeMainDayArticle = async (league, day, ended) => {
    const allDayMatches = await aRC.getMatchByLeagueAndDay(league, day)
    const allSquads = await aRC.getAllSquadsByLeague(league)
    const noNoiseMatches = allDayMatches.map((el, i) => {
        const home = el.match.split('-')[0]
        const away = el.match.split('-')[1]
        return ({
            home,
            away,
            score: ended ? el.result?.score : undefined
        })
    })
    const squadMap = allSquads.reduce((acc, el) => {
        acc[el.id] = el
        return acc
    }, {})
    const noNoisePayload = noNoiseMatches.map(el => {
        const home = squadMap[el.home]
        const away = squadMap[el.away]
        return ({
            home: `${home.name} ${home.emoji}, team_season_points: ${home.score.pts}`,
            away: `${away.name} ${away.emoji}, team_season_points: ${away.score.pts}`,
            score: el.score
        })
    })

    const withScore = ended ? 'con relativo punteggio' : 'che devono ancora giocarsi (senza punteggio)'
    const dayEnded = ended ? 'appena conclusa' : 'non ancora conclusa'
    const query = `considerando i match del giorno ${withScore} $$$ ${JSON.stringify(noNoisePayload)} $$$ scrivi un articolo sarcastico di massimo 500 caratteri sulla giornata ${day} ${dayEnded} della FantaBot League (fantacalcio)`
    try {
        const chat_completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: query }],
        });
        const gptMessage = chat_completion.data.choices[0].message.content
        const res = await aRC.writeArticle(day, 'FantaBot League Giornata ' + day, gptMessage, 'results')
    } catch (e) {
        console.log('@@@ ERROR ON GPT API @@@', e)
    }
    console.log('writeMainDayArticle', res)
}

const allAutomated = async () => {
    const schedule = await aRC.getSortedSchedule()
    const matchDayEndedLessThanADayAgo = h.isMatchDayEndedLessThanADayAgo(schedule)
    if (matchDayEndedLessThanADayAgo) {
        const league = "ernyanuus7tdszx"
        console.log('@@@CONDITIONAL-SCRIPT@@@ - writeMainDayArticle:', matchDayEndedLessThanADayAgo.day)
        await writeMainDayArticle(league, matchDayEndedLessThanADayAgo.day, true)
        await writeMainDayArticle(league, matchDayEndedLessThanADayAgo.day + 1, false)
    } else {
        console.log('@@@CONDITIONAL-SCRIPT@@@ - writeMainDayArticle: NO RUN')
    }
}

module.exports = {
    writeMainDayArticle: writeMainDayArticle,
    allAutomated: allAutomated
}