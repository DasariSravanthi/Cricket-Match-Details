const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `SELECT player_id AS playerId, player_name AS playerName 
    FROM player_details;`;
  const getAllPLayers = await db.all(getAllPlayersQuery);
  response.send(getAllPLayers);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT player_id AS playerId, player_name AS playerName 
    FROM player_details 
    WHERE player_id = ${playerId};`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(getPlayer);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `UPDATE player_details 
    SET player_name = '${playerName}' 
    WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT match_id AS matchId, match, year 
    FROM match_details 
    WHERE match_id = ${matchId};`;
  const getMatch = await db.get(getMatchQuery);
  response.send(getMatch);
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `SELECT match_details.match_id AS matchId, match_details.match, match_details.year 
    FROM match_details 
    INNER JOIN player_match_score 
    ON match_details.match_id = player_match_score.match_id 
    WHERE player_match_score.player_id = ${playerId} 
    GROUP BY match_details.match_id;`;
  const getMatchesOfPlayer = await db.all(getMatchesOfPlayerQuery);
  response.send(getMatchesOfPlayer);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName 
  FROM player_details 
  INNER JOIN player_match_score 
  ON player_details.player_id = player_match_score.player_id 
  WHERE player_match_score.match_id = ${matchId} 
  GROUP BY player_details.player_id;`;
  const getPlayersOfMatch = await db.all(getPlayersOfMatchQuery);
  response.send(getPlayersOfMatch);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayerQuery = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName, 
    SUM(player_match_score.score) AS totalScore, SUM(player_match_score.fours) AS totalFours, SUM(player_match_score.sixes) AS totalSixes 
    FROM player_details 
    INNER JOIN player_match_score 
    ON player_details.player_id = player_match_score.player_id 
    WHERE player_match_score.player_id = ${playerId};`;
  const getStatsOfPlayer = await db.get(getStatsOfPlayerQuery);
  response.send(getStatsOfPlayer);
});

module.exports = app;
