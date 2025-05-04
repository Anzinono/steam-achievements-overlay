require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

const PORT = 3000;

app.use(express.static('public'));

app.get('/api/missing-achievements', async (req, res) => {
    const { STEAM_API_KEY, STEAM_ID, APP_ID } = process.env;

    try {
        const [achievementsRes, schemaRes] = await Promise.all([
            axios.get(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/`, {
                params: {
                    key: STEAM_API_KEY,
                    steamid: STEAM_ID,
                    appid: APP_ID,
                }
            }),
            axios.get(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/`, {
                params: {
                    key: STEAM_API_KEY,
                    appid: APP_ID,
                    l: 'german',
                }
            })
        ]);

        const playerAchievements = achievementsRes.data.playerstats.achievements;
        const gameAchievements = schemaRes.data.game.availableGameStats.achievements;

        // Nur fehlende Erfolge
        const missing = playerAchievements
            .filter(a => a.achieved === 0)
            .map(a => {
                const full = gameAchievements.find(g => g.name === a.apiname);
                return {
                    apiname: a.apiname,
                  displayName: full?.displayName || a.apiname,
                    description: full?.description || '',
                    icon: full?.icon,
                };
            });

        res.json(missing);
    } catch (error) {
        console.error('Fehler:', error.message);
        res.status(500).send('API-Fehler');
    }
});


app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
