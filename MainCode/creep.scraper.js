var creep_scraper = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (_.sum(creep.carry) < creep.carryCapacity) {
            //Go to link, find dropped energy
            if (creep.memory.targetResource) {
                var thisResource = Game.getObjectById(creep.memory.targetResource);
                if (thisResource) {
                    if (creep.pickup(thisResource) == ERR_NOT_IN_RANGE) {
                        creep.travelTo(thisResource, {
                            maxRooms: 1
                        })
                    } else {
                        creep.memory.targetResource = undefined;
                    }
                } else {
                    creep.memory.targetResource = undefined;
                }
            } else {
                if (Memory.linkList[creep.room.name] && Memory.linkList[creep.room.name].length >= 2) {
                    var thisLink = Game.getObjectById(creep.memory.linkID);
                    if (thisLink && creep.pos.inRangeTo(thisLink, 3)) {
                        let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
                        if (droppedResources) {
                            creep.memory.targetResource = droppedResources.id;
                        }
                    } else if (thisLink) {
                        creep.travelTo(thisLink, {
                            maxRooms: 1
                        })
                    }
                } else {
                    //Pre-5 searching
                    let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
                    if (droppedResources) {
                        creep.memory.targetResource = droppedResources.id;
                    }
                }
            }
        } else {
            //Deposit energy
            if (creep.room.storage) {
                if (Object.keys(creep.store).length > 1) {
                    if (creep.transfer(creep.room.storage, Object.keys(creep.store)[1]) == ERR_NOT_IN_RANGE) {
                        creep.travelTo(creep.room.storage, {
                            maxRooms: 1
                        });
                    }
                } else {
                    if (creep.transfer(creep.room.storage, Object.keys(creep.store)[0]) == ERR_NOT_IN_RANGE) {
                        creep.travelTo(creep.room.storage, {
                            maxRooms: 1
                        });
                    }
                }
            }
        }

        //Listen & move for creeps
        let talkingCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
            filter: (thisCreep) => (creep.id != thisCreep.id && thisCreep.saying)
        })
        if (talkingCreeps.length) {
            let coords = talkingCreeps[0].saying.split(";");
            if (coords.length == 2 && creep.pos.x == parseInt(coords[0]) && creep.pos.y == parseInt(coords[1])) {
                //Standing in the way of a creep
                let thisDirection = creep.pos.getDirectionTo(talkingCreeps[0].pos);
                creep.move(thisDirection);
                creep.say("\uD83D\uDCA6", true);
            }
        }

        evadeAttacker(creep, 4, true);
    }
};

function evadeAttacker(creep, evadeRange, roadIgnore) {
    let Foe = undefined;
    let closeFoe = undefined;
    let didRanged = false;

    Foe = creep.pos.findInRange(FIND_HOSTILE_CREEPS, evadeRange, {
        filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0))
    });

    if (Foe.length) {
        if (Memory.FarRoomsUnderAttack.indexOf(creep.room.name) == -1) {
            Memory.FarRoomsUnderAttack.push(creep.room.name);
        }
        creep.memory.evadingUntil = Game.time + 5;
        closeFoe = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0))
        });

        creep.travelTo(closeFoe, {
            ignoreRoads: roadIgnore,
            range: 8
        }, true);
    } else if (creep.memory.evadingUntil && creep.memory.evadingUntil > Game.time) {
        creep.travelTo(new RoomPosition(25, 25, creep.room.name));
    }
}

module.exports = creep_scraper;