require('dotenv').config(); // .env-Datei laden
const express = require('express'); // Framework für den Server
const axios = require('axios'); // HTTP-Client für API-Anfragen
const app = express();
const PORT = 3000;

app.use(express.static('public')); // Übergibt statische Dateien aus dem 'public'-Verzeichnis

app.get('/api/missing-achievements', async (req, res) => {
    const { STEAM_API_KEY, STEAM_ID, APP_ID } = process.env; // lad die Umgebungsvariablen aus der .env-Datei
    try {
        const [achievementsRes, schemaRes, summariesRes] = await Promise.all([
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
            }),
            /*axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`, {
                params: {
                    key: STEAM_API_KEY,
                    steamids: STEAM_ID,
                }
            })*/
        ]);

        const playerAchievements = achievementsRes.data.playerstats.achievements;
        const gameAchievements = schemaRes.data.game.availableGameStats.achievements;
        //const playerSummarie = summariesRes.data.response.players.gameid; // Dynamisch game id holen
        /*
        Beispielt Objekt von GetPlayerSummaries:
        https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=89565E8F36B7FA26A2E5B6B42CF6B25B&steamids=76561198209384259
        {
            "response": {
                "players": [
                    {
                        "steamid": "76561198209384259",
                        "communityvisibilitystate": 3,
                        "profilestate": 1,
                        "personaname": "Anzinono",
                        "profileurl": "https://steamcommunity.com/id/Anzinono/",
                        "avatar": "https://avatars.steamstatic.com/5010994c9856ab223d4ac853b49879e095652f81.jpg",
                        "avatarmedium": "https://avatars.steamstatic.com/5010994c9856ab223d4ac853b49879e095652f81_medium.jpg",
                        "avatarfull": "https://avatars.steamstatic.com/5010994c9856ab223d4ac853b49879e095652f81_full.jpg",
                        "avatarhash": "5010994c9856ab223d4ac853b49879e095652f81",
                        "lastlogoff": 1746312687,
                        "personastate": 1,
                        "primaryclanid": "103582791429521408",
                        "timecreated": 1438086613,
                        "personastateflags": 0,
                        "gameextrainfo": "Bloons TD 6",
                        "gameid": "960090",
                        "loccountrycode": "DE"
                    }
                ]
            }
        }
        */

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
