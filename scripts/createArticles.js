const { Configuration, OpenAIApi } = require("openai");
const aRC = require('../api/restCollection')

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


const writeMainDayArticle = async (day) => {
    const allDayMatches = await aRC.getMatchByDay(day)
    const allSquads = await aRC.getAllSquads()
    const noNoiseMatches = allDayMatches.map(el => el.match)
    const noNoiseSquads = allSquads.map(el => ({
        id: el.id,
        name: el.name,
        emoji: el.emoji,
        formation_managed_by_bot: el.auto_formation
    }))
    const query = `considerando i match del giorno: ${JSON.stringify(noNoiseMatches)} e le squadre: ${JSON.stringify(noNoiseSquads)} scrivi un articolo sarcastico sulla giornata ${day} che dove ancora giocarsi`
    
    const chat_completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: query }],
    });
    const gptMessage = chat_completion.data.choices[0].message.content
    const res = await aRC.writeArticle(day, 'FantaBot League Giornata ' + day, gptMessage, 'results')
    console.log('writeMainDayArticle', res)
}

module.exports = {
    writeMainDayArticle: writeMainDayArticle
}