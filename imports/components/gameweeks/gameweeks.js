import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { ReactiveVar } from "meteor/reactive-var";

import { Gameweeks } from "../../api/gameweek.js";
import "./gameweekEntry.html";
import "../history/history.html";

const gameweekState = new ReactiveVar();
let globalGameweek = 1;

Template.home.onCreated(function bodyOnCreated() {
  let self = this;
  self.subscribe("currentGameweek");
});

Template.home.onDestroyed(function () {
  gameweekState.set();
});

Template.history.onCreated(function bodyOnCreated() {
  let self = this;
  self.subscribe("gameweek");
});

Template.history.onDestroyed(function () {
  gameweekState.set();
});

Template.home.helpers({
  getGameweek() {
    var g = Globals.findOne();

    if (g) {
      return Gameweeks.find(
        {},
        { sort: { TotalPoints: -1, DateLineupSet: 1 } }
      );
    }
  },
});

Template.history.helpers({
  getGameweek() {
    var g = Globals.findOne();

    if (g) {
      var gameweek = gameweekState.get();
      globalGameweek = g.Gameweek;

      let modifiedGameweek = globalGameweek === 0 ? 1 : globalGameweek;

      return Gameweeks.find(
        {
          SeasonId: g.SeasonId,
          Gameweek: gameweek ? gameweek : modifiedGameweek,
        },
        {
          sort: {
            TotalPoints: -1,
            DateLineupSet: 1,
          },
        }
      );
    }
  },
});

Template.gameweekEntry.helpers({
  showNextGameweekButton() {
    if (this.currentGameweekOnly) {
      return false;
    }

    var gameweek = getWeek(this.data) + 1;

    if (gameweek > globalGameweek + 1 || gameweek > 38) {
      return false;
    }

    return true;
  },
  showPreviousGameweekButton() {
    if (this.currentGameweekOnly) {
      return false;
    }

    var gameweek = getWeek(this.data) - 1;

    if (gameweek < 1) {
      return false;
    }

    return true;
  },
  getSelectedPlayers(gameweekPlayers) {
    gameweekPlayers.sort(sortPlayers);
    return gameweekPlayers.filter(function (player) {
      return player.Selected;
    });
  },
  getWeek() {
    return getWeek(this.data);
  },
  isLineupSetOnTime(gameweek) {
    if (!isLineupSet(gameweek.Formation)) {
      return false;
    }

    if (gameweek.Penalty) {
      return false;
    }

    return true;
  },
  isLineupSetLate(gameweek) {
    if (!isLineupSet(gameweek.Formation)) {
      return false;
    }

    if (gameweek.Penalty) {
      return true;
    }

    return false;
  },
  formatDate(date) {
    if (date) {
      return formatDate(date);
    }
  },
});

const isLineupSet = function (formation) {
  return !!formation;
};

const sortPlayers = function (a, b) {
  let aPosition = a.Player.Position;
  let bPosition = b.Player.Position;

  let aRecentPoints = a.Player.RecentPoints;
  let bRecentPoints = b.Player.RecentPoints;

  let aTotalPoints = a.Player.TotalPoints;
  let bTotalPoints = b.Player.TotalPoints;

  if (aPosition < bPosition) return -1;
  if (aPosition > bPosition) return 1;
  if (aRecentPoints > bRecentPoints) return -1;
  if (aRecentPoints < bRecentPoints) return 1;
  if (aTotalPoints > bTotalPoints) return -1;
  if (aTotalPoints < bTotalPoints) return 1;
};

const getWeek = function (data) {
  if (data) {
    var firstGameweek = data.fetch()[0];
    if (firstGameweek) {
      return firstGameweek.Gameweek;
    }
  }
};

Template.gameweekEntry.events({
  "click .toggleGameweekPlayers"(event) {
    const teamId = event.currentTarget.id;
    Template.instance()
      .$("." + teamId)
      .toggleClass("hidden");
  },
  "click [nextGameweek]"() {
    var gameweek = getWeek(this.data) + 1;

    if (gameweek > globalGameweek + 1) {
      gameweek = globalGameweek;
    }

    gameweekState.set(gameweek);
  },
  "click [previousGameweek]"() {
    var gameweek = getWeek(this.data) - 1;

    if (gameweek < 1) {
      gameweek = 1;
    }

    gameweekState.set(gameweek);
  },
});
