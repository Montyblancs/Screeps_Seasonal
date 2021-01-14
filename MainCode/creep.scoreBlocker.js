var creep_scoreBlocker = {

    /** @param {Creep} creep **/
    run: function(creep) {
        let scoreWhitelist = ['Saruss', 'Montblanc'];
        if (!creep.memory.waitTimer) {
        	creep.memory.waitTimer = 0;
        }
        if (creep.ticksToLive <= creep.memory.deathWarn) {
            creep.memory.priority = "scoreBlockerNearDeath"
        }
        if (creep.room.name != creep.memory.destination) {   
            if (Game.flags[creep.memory.homeRoom + "ScoreBlocker"] && Game.flags[creep.memory.homeRoom + "ScoreBlocker"].pos) {
                creep.travelTo(Game.flags[creep.memory.homeRoom + "ScoreBlocker"]);
            } else {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.destination));
            }

            if (!creep.memory.travelDistance && creep.memory._trav && creep.memory._trav.path) {
                creep.memory.travelDistance = creep.memory._trav.path.length;
                creep.memory.deathWarn = (creep.memory.travelDistance + _.size(creep.body) * 3) + 15;
            }     
        } else {
            let NotWelcome = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                filter: (eCreep) => (!scoreWhitelist.includes(eCreep.owner.username))
            });
            if (creep.pos.x != Game.flags[creep.memory.homeRoom + "ScoreBlocker"].pos.x || creep.pos.y != Game.flags[creep.memory.homeRoom + "ScoreBlocker"].pos.y) {
                creep.travelTo(Game.flags[creep.memory.homeRoom + "ScoreBlocker"].pos, {
                    range: 0
                });
                if (NotWelcome.length) {
                    creep.attack(NotWelcome[0]);
                }
            } else if (creep.pos.x == Game.flags[creep.memory.homeRoom + "ScoreBlocker"].pos.x && creep.pos.y == Game.flags[creep.memory.homeRoom + "ScoreBlocker"].pos.y) {
                //On flag, determine if a creep nearby can pass             
                let IsWelcome = creep.pos.findInRange(FIND_CREEPS, 1, {
                    filter: (eCreep) => (scoreWhitelist.includes(eCreep.owner.username) && eCreep.id != creep.id)
                });
                if (NotWelcome.length) {
                    creep.attack(NotWelcome[0]);
                } else if (IsWelcome.length) {
                	let moveTarget = 0;
                	if (IsWelcome.length >= 2) {
                		if (IsWelcome[1].pos.y < IsWelcome[0].pos.y) {
                			moveTarget = 1;
                		}
                		if (creep.memory.blockID && IsWelcome[moveTarget].id == creep.memory.blockID && IsWelcome[moveTarget].store.getUsedCapacity() == 0) {
                			creep.memory.waitTimer += 1;
                			if (creep.memory.waitTimer >= 25) {
                				//This unit is blocking the pipe
                				creep.attack(IsWelcome[moveTarget]);
                			}
                		} else if (creep.memory.blockID && IsWelcome[moveTarget].id != creep.memory.blockID) {
                			creep.memory.blockID = IsWelcome[moveTarget].id
                			creep.memory.waitTimer = 0;
                		} else if (!creep.memory.blockID) {
                			creep.memory.blockID = IsWelcome[moveTarget].id
                			creep.memory.waitTimer = 0;
                		}           		
                	}
                    creep.travelTo(IsWelcome[moveTarget], {
                        range: 0
                    });
                }
            }

            if (!NotWelcome.length && creep.hits < creep.hitsMax) {
                creep.heal(creep)
            }
        }
    }
};

module.exports = creep_scoreBlocker;