var creep_scoreRunner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        let southWallRooms = ["W20N10", "W19N10", "W18N10", "W17N10", "W16N10", "W15N10", "W14N10", "W13N10", "W11N10", "W10N10"]
        let eastWallRooms = ["W10N8", "W10N7", "W10N6", "W10N5", "W10N4", "W10N3", "W10N2", "W10N1", "W10N0"]
        let westWallRooms = ["W20N9", "W20N8", "W20N6", "W20N5", "W20N4", "W20N3", "W20N2", "W20N0"]
        let northeastWallRooms = ["W9N10", "W8N10", "W6N10", "W5N10", "W4N10", "W3N10", "W2N10", "W1N10"]
        let ughExceptions = ["W10N12", "W10N11", "W11N11"]
        if (creep.room.name != creep.memory.homeRoom && creep.store.getFreeCapacity() >= creep.store.getCapacity()) {
            if (creep.memory.travelDistance && creep.ticksToLive <= creep.memory.travelDistance) {
                //Don't waste time
                creep.suicide();
            }

            if (southWallRooms.includes(creep.room.name) && creep.pos.y >= 25) {
                creep.travelTo(new RoomPosition(24, 32, "W12N10"));
            } else if (creep.room.name == "W12N10" && creep.pos.y > 22) {
                creep.travelTo(new RoomPosition(25, 22, "W12N10"))
            } else if (creep.room.name == "W12N10" && creep.pos.y <= 22) {
                creep.travelTo(new RoomPosition(25, 25, "W11N11"))
            } else if (Game.rooms[creep.memory.homeRoom] && Game.rooms[creep.memory.homeRoom].storage) {
                creep.travelTo(Game.rooms[creep.memory.homeRoom].storage);
            } else {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.homeRoom));
            }
        } else if (creep.room.name != creep.memory.destination && creep.store.getFreeCapacity() < creep.store.getCapacity()) {
            if (creep.room.name == "W14N10" && creep.pos.y < 25) {
                creep.travelTo(new RoomPosition(3, 6, "W13N10"));
            } else if (ughExceptions.includes(creep.room.name)) {
                creep.travelTo(new RoomPosition(9, 3, "W11N10"))
            } else if (southWallRooms.includes(creep.room.name) && creep.pos.y < 25) {
                creep.travelTo(new RoomPosition(25, 22, "W12N10"))
            } else if (creep.room.name == "W12N10" && creep.pos.y < 27) {
                creep.travelTo(new RoomPosition(23, 28, "W12N10"))
            } else if (eastWallRooms.includes(creep.room.name) && creep.pos.x < 25) {
                creep.travelTo(new RoomPosition(22, 5, "W10N9"));
            } else if (creep.room.name == "W10N9" && creep.pos.x < 27) {
                creep.travelTo(new RoomPosition(28, 16, "W10N9"))
            } else if (westWallRooms.includes(creep.room.name) && creep.pos.x > 24) {
                creep.travelTo(new RoomPosition(24, 7, "W20N7"))
            } else if (creep.room.name == "W20N7" && creep.pos.x > 24) {
                creep.travelTo(new RoomPosition(24, 7, "W20N7"))
            } else if (northeastWallRooms.includes(creep.room.name) && creep.pos.y > 24) {
                creep.travelTo(new RoomPosition(40, 24, "W7N10"))
            } else {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.destination));
            }

            if (!creep.memory.travelDistance && creep.memory._trav && creep.memory._trav.path) {
                creep.memory.travelDistance = creep.memory._trav.path.length + 100
                creep.memory.deathWarn = (creep.memory.travelDistance + _.size(creep.body) * 3) + 15;
            }         
        } else {
            if (creep.store.getFreeCapacity() >= creep.store.getCapacity()) {
                //In homeroom, get score
                if (creep.memory.travelDistance && creep.ticksToLive <= creep.memory.travelDistance) {
                    //Don't waste score
                    creep.suicide();
                }

                let withdrawResult = undefined;
                if (Memory.transferNeed[creep.memory.resourceName] && Memory.mineralTotals[creep.memory.resourceName] + creep.store.getCapacity() <= Memory.transferNeed[creep.memory.resourceName]) {
                    withdrawResult = undefined
                } else if (creep.room.storage && creep.room.storage.store[creep.memory.resourceName]) {           
                    withdrawResult = creep.withdraw(creep.room.storage, creep.memory.resourceName)               
                } else if (creep.room.terminal && creep.room.terminal.store[creep.memory.resourceName]) {              
                    withdrawResult = creep.withdraw(creep.room.terminal, creep.memory.resourceName)               
                }

                if (withdrawResult == ERR_NOT_IN_RANGE) {
                    if (creep.room.storage && creep.room.storage.store[creep.memory.resourceName]) {
                        creep.travelTo(creep.room.storage, {
                            maxRooms: 1
                        });
                    } else {
                        creep.travelTo(creep.room.terminal, {
                            maxRooms: 1
                        });
                    }                  
                } else if (withdrawResult == OK) {
                    if (creep.memory.destination == creep.room.name) {
                        //go right to decoder
                        let roomDecoder = creep.pos.findClosestByRange(FIND_SYMBOL_DECODERS)
                        if(roomDecoder) {
                            creep.travelTo(roomDecoder, {
                                maxRooms: 1
                            })
                        }
                    } else {
                        creep.travelTo(new RoomPosition(25, 25, creep.memory.destination));
                    }
                } else if (!withdrawResult) {
                    creep.suicide();
                }
            } else {
                //In target room, bank score.
                let scoreCollector = creep.pos.findClosestByRange(FIND_SYMBOL_DECODERS);
                if (scoreCollector && creep.transfer(scoreCollector, creep.memory.resourceName) == ERR_NOT_IN_RANGE) {
                    creep.travelTo(scoreCollector, {
                        maxRooms: 1
                    })
                }
            }
        }

        creep.heal(creep);
        //evadeAttacker(creep, 5, true);
    }
};

function evadeAttacker(creep, evadeRange, roadIgnore) {
    let Foe = undefined;
    let closeFoe = undefined;
    let didRanged = false;

    Foe = creep.pos.findInRange(FIND_HOSTILE_CREEPS, evadeRange, {
        filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0) && !Memory.grayList.includes(eCreep.owner.username))
    });

    if (Foe.length) {
        if (Memory.FarRoomsUnderAttack.indexOf(creep.room.name) == -1) {
            Memory.FarRoomsUnderAttack.push(creep.room.name);
        }
        creep.memory.evadingUntil = Game.time + 5;
        closeFoe = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0) && !Memory.grayList.includes(eCreep.owner.username))
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