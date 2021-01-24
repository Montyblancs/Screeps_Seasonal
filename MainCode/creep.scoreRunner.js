var creep_scoreRunner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.room.name != creep.memory.homeRoom && creep.store.getFreeCapacity() >= creep.store.getCapacity()) {
        	if (creep.memory.travelDistance && creep.ticksToLive <= creep.memory.travelDistance) {
                //Don't waste time
                creep.suicide();
            }
            if (Game.rooms[creep.memory.homeRoom] && Game.rooms[creep.memory.homeRoom].storage) {
                creep.travelTo(Game.rooms[creep.memory.homeRoom].storage, {
                    preferHighway: true
                });
            } else {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.homeRoom), {
                    preferHighway: true
                });
            }
        } else if (creep.room.name != creep.memory.destination && creep.store.getFreeCapacity() < creep.store.getCapacity()) {   
            if (Memory.scoreTarget[creep.memory.homeRoom]) {
                creep.travelTo(new RoomPosition(25, 25, Memory.scoreTarget[creep.memory.homeRoom]), {
                    preferHighway: true
                });
            } else {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.destination), {
                    preferHighway: true
                });
            }

            if (!creep.memory.travelDistance && creep.memory._trav && creep.memory._trav.path) {
                creep.memory.travelDistance = creep.memory._trav.path.length;
                creep.memory.deathWarn = (creep.memory.travelDistance + _.size(creep.body) * 3) + 15;
            }     
        } else {
            if (creep.store.getFreeCapacity() >= creep.store.getCapacity()) {
                //In homeroom, get score
                if (creep.memory.travelDistance && creep.ticksToLive <= creep.memory.travelDistance) {
                    //Don't waste score
                    creep.suicide();
                }

                if (creep.room.storage && creep.room.storage.store[RESOURCE_SCORE]) {
                    withdrawResult = creep.withdraw(creep.room.storage, RESOURCE_SCORE)
                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(creep.room.storage, {
                            maxRooms: 1
                        });
                    } else if (withdrawResult == OK) {
                        if (Memory.scoreTarget[creep.memory.homeRoom]) {
                            creep.travelTo(new RoomPosition(25, 25, Memory.scoreTarget[creep.memory.homeRoom]));
                    } else {
                            creep.travelTo(new RoomPosition(25, 25, creep.memory.destination));
                        }
                    }
                } else {
                    creep.suicide();
                }
            } else {
                //In target room, bank score.
                let scoreCollector = creep.pos.findClosestByRange(FIND_SCORE_COLLECTORS);
                let outerRange = 3
                let doIgnore = false
                if (scoreCollector && creep.transfer(scoreCollector, RESOURCE_SCORE) == ERR_NOT_IN_RANGE) {
                	if (creep.pos.inRangeTo(scoreCollector, 4)) {
                		outerRange = 1,
                		doIgnore = true
                	}
                    creep.travelTo(scoreCollector, {
                        maxRooms: 1,
                        range: outerRange,
                        ignoreCreeps: doIgnore
                    })
                } 

                if (creep.hits <= 800) {
                    //Don't let runners get blown to bits over and over
                    var hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                        filter: (creep) => (creep.getActiveBodyparts(WORK) > 0 || creep.getActiveBodyparts(CARRY) > 0 || creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0 || creep.getActiveBodyparts(HEAL) > 0 && !Memory.whiteList.includes(creep.owner.username))
                    });
                    if (hostiles.length > 0 && hostiles[0].owner.username != 'Invader' && hostiles[0].owner.username != 'Source Keeper') {
                        Game.notify('ScoreTarget was removed due to an attack by ' + hostiles[0].owner.username);
                        Memory.LastNotification = Game.time.toString() + ' : ' + creep.memory.targetFlag + ' was removed due to an attack by ' + hostiles[0].owner.username
                        /*let targetTime = Game.time + 1500;
                        creep.room.createFlag(Game.flags["ScoreTarget"].pos, "ScoreTarget;" + targetTime.toString());
                        Game.flags["ScoreTarget"].remove();*/
                    }
                }
            }
        }

        creep.heal(creep);
        evadeAttacker(creep, 5, true);
    }
};

function evadeAttacker(creep, evadeRange, roadIgnore) {
    let Foe = undefined;
    let closeFoe = undefined;
    let didRanged = false;

    Foe = creep.pos.findInRange(FIND_HOSTILE_CREEPS, evadeRange, {
        filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0) && eCreep.owner.username != 'Saruss')
    });

    if (Foe.length) {
        if (Memory.FarRoomsUnderAttack.indexOf(creep.room.name) == -1) {
            Memory.FarRoomsUnderAttack.push(creep.room.name);
        }
        creep.memory.evadingUntil = Game.time + 5;
        closeFoe = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0) && eCreep.owner.username != 'Saruss')
        });

        creep.travelTo(closeFoe, {
            ignoreRoads: roadIgnore,
            range: 8
        }, true);
    } else if (creep.memory.evadingUntil && creep.memory.evadingUntil > Game.time) {
    	creep.travelTo(new RoomPosition(25, 25, creep.room.name));
    }
}


module.exports = creep_scoreRunner;