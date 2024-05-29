const express = require("express");
const request = require("request");
const cheerio = require("cheerio");
const app = express();

app.get("/match", function (req, res) {
  let url = "https://www.vlr.gg";
  let query = req.query.q;

  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      var upcomingMatches = [];

      $("div.js-home-matches-upcoming > div > a").each((index, element) => {
        let match = cheerio.load(element);

        let time_left;

        let teams = [];

        match("div.h-match-team").each((index, element) => {
          let team = cheerio.load(element);

          if (index == 0) {
            time_left = `${team("div.h-match-eta").text().trim()} from now`;
          }

          teams.push(team("div.h-match-team-name").text().trim());
        });

        upcomingMatches.push({
          match_event: match("div.h-match-preview > div.h-match-preview-event")
            .text()
            .trim(),
          team1: teams[0],
          team2: teams[1],
          time_until_match: time_left,
        });
      });

      if (query == "upcoming") {
        upcomingMatches = upcomingMatches.filter((curr, index) => {
          return curr.time_until_match !== "LIVE from now";
        });
      } else if (query == "live_score") {
        upcomingMatches = upcomingMatches.filter((curr, index) => {
          return curr.time_until_match == "LIVE from now";
        });
      }

      var json = {
        data: {
          status: 200,
          segments: upcomingMatches,
        },
      };
    }

    res.send(json);
  });
});

app.get("/result", function (req, res) {
  let url = "https://www.vlr.gg/matches/results";

  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      var matchResults = [];

      $("a.wf-module-item").each((index, element) => {
        let match = cheerio.load(element);

        let teams = [];
        let scores = [];

        match("div.match-item-vs > div.match-item-vs-team").each(
          (index, element) => {
            let team = cheerio.load(element);

            teams.push(
              team("div.match-item-vs-team-name > div.text-of").text().trim()
            );
            scores.push(team("div.match-item-vs-team-score").text().trim());
          }
        );

        matchResults.push({
          tournament_name: match("div.match-item-event")
            .clone()
            .children()
            .remove()
            .end()
            .text()
            .trim(),
          team1: teams[0],
          team2: teams[1],
          score1: scores[0],
          score2: scores[1],
          tournament_icon: `https:${match("div.match-item-icon > img").attr(
            "src"
          )}`,
        });
      });

      var json = {
        data: {
          status: 200,
          segments: matchResults,
        },
      };
    }

    res.send(json);
  });
});

app.listen("8080");
console.log("API is running on http://localhost:8080");
module.exports = app;
