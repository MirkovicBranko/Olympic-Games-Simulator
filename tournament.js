// Function to load JSON files
const fs = require('fs'); // File system module

function loadJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// "Team" class to represent a team
class Team {
    constructor(name, isoCode, fibaRanking) {
        this.name = name;
        this.isoCode = isoCode;
        this.fibaRanking = fibaRanking;
        this.points = 0; // Points in the group
        this.wins = 0; // Wins
        this.losses = 0; // Losses
        this.scoreFor = 0; // Points scored
        this.scoreAgainst = 0; // Points conceded
        this.exhibitionResults = [];
    }

    addExhibitionResults(results) {
        this.exhibitionResults = results;
    }

    playMatch(opponent) {
        const didTeamGiveUp = Math.random() < 0.1; // 10% chance that the team gives up
        const didOpponentGiveUp = Math.random() < 0.1; // 10% chance that the opponent gives up

        if (didTeamGiveUp) {
            console.log(`${this.name} gives up against ${opponent.name}.`);
            opponent.points += 2;
            opponent.wins++;
            this.losses++;
            return 'loser'; // Team gives up
        }

        if (didOpponentGiveUp) {
            console.log(`${opponent.name} gives up against ${this.name}.`);
            this.points += 2;
            this.wins++;
            opponent.losses++;
            return 'winner'; // Team against whom the opponent gives up becomes the winner
        }

        const [scoreA, scoreB] = this.calculateScore(opponent);
        this.scoreFor += scoreA;
        this.scoreAgainst += scoreB;
        opponent.scoreFor += scoreB;
        opponent.scoreAgainst += scoreA;

        if (scoreA > scoreB) {
            this.points += 2;
            this.wins++;
            opponent.losses++;
            console.log(`${this.name} wins against ${opponent.name} (${scoreA}:${scoreB})`);
            return 'winner'; // Team wins
        } else {
            opponent.points += 2;
            opponent.wins++;
            this.losses++;
            console.log(`${opponent.name} wins against ${this.name} (${scoreB}:${scoreA})`);
            return 'loser'; // Team loses
        }
    }

    calculateScore(opponent) {
        let formFactorA = this.calculateFormFactor();
        let formFactorB = opponent.calculateFormFactor();
        let factor = ((this.fibaRanking - opponent.fibaRanking) / 10) + formFactorA - formFactorB;
        const baseScore = 70 + (factor * 5);
        let scoreA = Math.floor(Math.max(60, baseScore + (Math.random() * 20)));
        let scoreB = Math.floor(Math.max(60, 140 - baseScore + (Math.random() * 20)));

        if (scoreA === scoreB) {
            scoreB++;
        }

        return [scoreA, scoreB];
    }

    calculateFormFactor() {
        if (this.exhibitionResults.length === 0) return 0;
        const wins = this.exhibitionResults.filter(result => {
            const [scoreA, scoreB] = result.Result.split('-').map(Number);
            return scoreA > scoreB;
        }).length;
        return wins / this.exhibitionResults.length;
    }
}

// "Group" class to represent a group of teams
class Group {
    constructor(teams) {
        this.teams = teams;
    }

    simulate() {
        console.log("Group stage - Round 1:");
        for (let i = 0; i < this.teams.length; i++) {
            for (let j = i + 1; j < this.teams.length; j++) {
                this.teams[i].playMatch(this.teams[j]);
            }
        }
    }

    getRankedTeams() {
        return this.teams.sort((a, b) => {
            if (b.points === a.points) {
                const pointDifferenceA = a.scoreFor - a.scoreAgainst;
                const pointDifferenceB = b.scoreFor - b.scoreAgainst;

                if (pointDifferenceA === pointDifferenceB) {
                    return b.scoreFor - a.scoreFor;
                }
                return pointDifferenceB - pointDifferenceA;
            }
            return b.points - a.points;
        });
    }
}

// "Tournament" class for the entire tournament flow
class Tournament {
    constructor(groups) {
        this.groups = groups;
    }

    simulate() {
        this.groups.forEach((group, index) => {
            console.log(`Group ${String.fromCharCode(65 + index)}:`);
            group.simulate();
            const rankedTeams = group.getRankedTeams();
            console.log(`Final ranking in group ${String.fromCharCode(65 + index)}:`);
            rankedTeams.forEach((team, rankIndex) => {
                console.log(`${rankIndex + 1}. ${team.name} ${team.wins}/${team.losses} ${team.points} ${team.scoreFor} ${team.scoreAgainst} ${team.scoreFor - team.scoreAgainst}`);
            });
        });
        this.determineAdvancingTeams();
    }

    determineAdvancingTeams() {
        const advancingTeams = [];
        const thirdPlaceTeams = [];

        this.groups.forEach(group => {
            const rankedTeams = group.getRankedTeams();
            const topTeams = rankedTeams.slice(0, 2);
            advancingTeams.push(...topTeams);
            if (rankedTeams.length > 2) {
                thirdPlaceTeams.push(rankedTeams[2]);
            }
        });

        const rankedThirdTeams = this.rankThirdPlaceTeams(thirdPlaceTeams);
        advancingTeams.push(...rankedThirdTeams.slice(0, 2));

        console.log(`Teams advancing to the next round:`);
        advancingTeams.forEach(team => console.log(team.name));

        this.setupEliminationMatches(advancingTeams);
    }

    rankThirdPlaceTeams(thirdPlaceTeams) {
        return thirdPlaceTeams.sort((a, b) => {
            if (b.points === a.points) {
                const pointDifferenceA = a.scoreFor - a.scoreAgainst;
                const pointDifferenceB = b.scoreFor - b.scoreAgainst;

                if (pointDifferenceA === pointDifferenceB) {
                    return b.scoreFor - a.scoreFor;
                }
                return pointDifferenceB - pointDifferenceA;
            }
            return b.points - a.points;
        });
    }

    setupEliminationMatches(teams) {
        console.log("Seeds:");
        const seedings = {
            'D': [teams[0], teams[1]],
            'E': [teams[2], teams[3]],
            'F': [teams[4], teams[5]],
            'G': [teams[6], teams[7]]
        };

        for (const seed in seedings) {
            console.log(`Seed ${seed}:`);
            seedings[seed].forEach(team => console.log(`    ${team.name}`));
        }

        console.log(`\nQuarterfinal matches:`);
        const quarterfinals = [];

        // Pairings for the quarterfinals
        quarterfinals.push([teams[0], teams[1]]); // 1 vs 8
        quarterfinals.push([teams[2], teams[3]]); // 2 vs 7
        quarterfinals.push([teams[4], teams[5]]); // 3 vs 6
        quarterfinals.push([teams[6], teams[7]]); // 4 vs 5

        const semifinalWinners = [];

        quarterfinals.forEach(match => {
            console.log(`${match[0].name} vs ${match[1].name}`);
            const result = match[0].playMatch(match[1]); // The match is played
            if (result === 'winner') {
                semifinalWinners.push(match[0]); // Winner goes to the semifinals
            } else {
                semifinalWinners.push(match[1]); // Winner goes to the semifinals
            }
        });

        // Semifinals
        console.log(`\nSemifinals:`);
        const finalContestants = [];
        const thirdPlaceContestants = [];

        const semifinalMatches = [
            [semifinalWinners[0], semifinalWinners[1]],
            [semifinalWinners[2], semifinalWinners[3]]
        ];

        semifinalMatches.forEach(match => {
            console.log(`${match[0].name} vs ${match[1].name}`);
            const result = match[0].playMatch(match[1]); // The match is played
            if (result === 'winner') {
                finalContestants.push(match[0]); // Winner goes to the finals
                thirdPlaceContestants.push(match[1]); // Loser goes to third place
            } else {
                finalContestants.push(match[1]); // Winner goes to the finals
                thirdPlaceContestants.push(match[0]); // Loser goes to third place
            }
        });

        // Finals
        console.log(`\nFinals:`);
        const finalMatch = [finalContestants[0], finalContestants[1]];
        console.log(`${finalMatch[0].name} vs ${finalMatch[1].name}`);
        const finalResult = finalMatch[0].playMatch(finalMatch[1]); // The match is played

        // Medal distribution
        let winner, loser;
        if (finalResult === 'winner') {
            winner = finalMatch[0];
            loser = finalMatch[1];
        } else {
            winner = finalMatch[1];
            loser = finalMatch[0];
        }

        // Third place match
        console.log(`\nThird place match:`);
        console.log(`${thirdPlaceContestants[0].name} vs ${thirdPlaceContestants[1].name}`);
        const thirdPlaceResult = thirdPlaceContestants[0].playMatch(thirdPlaceContestants[1]); // The match is played

        // Determine the third place winner
        const thirdPlaceWinner = thirdPlaceResult === 'winner' ? thirdPlaceContestants[0] : thirdPlaceContestants[1];

        // Print winners and rankings
        this.printMedals(winner, loser, thirdPlaceWinner);
    }

    printMedals(winner, loser, thirdPlaceWinner) {
        console.log(`\nMedals:`);
        console.log(`1st place: ${winner.name}`);
        console.log(`2nd place: ${loser.name}`);
        console.log(`3rd place: ${thirdPlaceWinner.name}`);
    }
}

// Loading teams from files
const groupsData = loadJSON('groups.json'); // Load groups and teams
const exhibitionData = loadJSON('exhibitions.json'); // Load exhibition match results

// Creating teams based on loaded data
const teamList = [];

// Loading teams
for (const groupName in groupsData) {
    groupsData[groupName].forEach(teamInfo => {
        const team = new Team(teamInfo.Team, teamInfo.ISOCode, teamInfo.FIBARanking);
        if (exhibitionData[team.isoCode]) {
            team.addExhibitionResults(exhibitionData[team.isoCode]);
        }
        teamList.push(team);
    });
}

// Dividing teams into groups
const groupA = new Group(teamList.slice(0, 4)); // Group A - First 4 teams
const groupB = new Group(teamList.slice(4, 8)); // Group B - Next 4 teams
const groupC = new Group(teamList.slice(8, 12)); // Group C - Last 4 teams

const tournament = new Tournament([groupA, groupB, groupC]); // Three groups
tournament.simulate(); // Simulate the tournament
