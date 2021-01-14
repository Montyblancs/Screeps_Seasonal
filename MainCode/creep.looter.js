var creep_looter = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.carryCapacity == 0) {
            //YER DED TO ME
            creep.suicide();
        }
        if (creep.room.name != creep.memory.destination && creep.store.getFreeCapacity() >= 100) {
            if (Game.rooms[creep.memory.destination] && Game.rooms[creep.memory.destination].storage) {
                creep.travelTo(Game.rooms[creep.memory.destination].storage, {
                	preferHighway: true,
                    ensurePath: true
                });
            } else {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.destination), {
                	preferHighway: true,
                    ensurePath: true
                });
            }
        } else if (creep.room.name != creep.memory.homeRoom && creep.store.getFreeCapacity() < 100) {
            if (Game.rooms[creep.memory.homeRoom] && Game.rooms[creep.memory.homeRoom].storage) {
                creep.travelTo(Game.rooms[creep.memory.homeRoom].storage, {
                	preferHighway: true,
                    ensurePath: true
                });
            } else {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.homeRoom), {
                	preferHighway: true,
                    ensurePath: true
                });
            }
        } else {
            if (creep.store.getFreeCapacity() >= 100) {
                //In far room, loot container
                //Check for dropped resources
                let droppedResources = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: (thisResource) => (thisResource.amount > 100)
                });

                let ruins = creep.pos.findClosestByRange(FIND_RUINS, {
                    filter: (thisRuin) => (thisRuin.store.getUsedCapacity() > 0)
                });

                let scoreContainer = creep.pos.findClosestByRange(FIND_SCORE_CONTAINERS, {
                	filter: (thisScore) => (_.sum(thisScore.store) > 0)
            	});

                if (droppedResources) {
                	if (creep.pickup(droppedResources) == ERR_NOT_IN_RANGE) {
                		creep.travelTo(droppedResources, {
                			maxRooms: 1
                		});
                	}
                } else if (ruins) {
                    if (creep.withdraw(ruins, Object.keys(ruins.store)[0]) == ERR_NOT_IN_RANGE) {
                        creep.travelTo(ruins, {
                            maxRooms: 1
                        });
                    }
                } else if (scoreContainer) {
                	if (creep.withdraw(scoreContainer, RESOURCE_SCORE) == ERR_NOT_IN_RANGE) {
                        creep.travelTo(scoreContainer, {
                            maxRooms: 1
                        });
                    }
                } else if (creep.room.storage && creep.room.storage.owner.username != "Montblanc") {
                    if (creep.room.storage.store.getUsedCapacity() == 0) {
                        if (creep.room.terminal && creep.room.terminal.store.getUsedCapacity() > 0) {
                            if (Object.keys(creep.room.terminal.store).length > 1) {
                                if (creep.withdraw(creep.room.terminal, Object.keys(creep.room.terminal.store)[1]) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(creep.room.terminal);
                                }
                            } else {
                                if (creep.withdraw(creep.room.terminal, Object.keys(creep.room.terminal.store)[0]) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(creep.room.terminal);
                                }
                            }
                        } else {
                            //Nothing left to loot
                            if (Game.flags[creep.memory.homeRoom + "Loot"]) {
                                Game.flags[creep.memory.homeRoom + "Loot"].remove();
                            }
                            if (Memory.lootSpawn) {
                                Memory.lootSpawn = undefined;
                            }
                            creep.suicide();
                        }
                    } else {
                    	let withdrawResult = undefined;
                    	if (Object.keys(creep.room.storage.store).length > 1) {
                    		withdrawResult = creep.withdraw(creep.room.storage, Object.keys(creep.room.storage.store)[1])
                    	} else {
                    		withdrawResult = creep.withdraw(creep.room.storage, Object.keys(creep.room.storage.store)[0])
                    	}
                        if (withdrawResult == ERR_NOT_IN_RANGE) {
                            creep.travelTo(creep.room.storage);
                        } else if (withdrawResult == OK) {
                            if (Game.rooms[creep.memory.homeRoom] && Game.rooms[creep.memory.homeRoom].storage) {
                                creep.travelTo(Game.rooms[creep.memory.homeRoom].storage);
                            } else {
                                creep.travelTo(new RoomPosition(25, 25, creep.memory.homeRoom));
                            }
                        }
                    }
                } else if (creep.room.terminal && creep.room.terminal.owner.username != "Montblanc" && creep.room.terminal.store.getUsedCapacity() > 0) {
                    if (Object.keys(creep.room.terminal.store).length > 1) {
                        if (creep.withdraw(creep.room.terminal, Object.keys(creep.room.terminal.store)[1]) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(creep.room.terminal);
                        }
                    } else {
                        if (creep.withdraw(creep.room.terminal, Object.keys(creep.room.terminal.store)[0]) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(creep.room.terminal);
                        }
                    }
                } else {
                    //Nothing left to loot
                    if (Game.flags[creep.memory.homeRoom + "Loot"]) {
                        Game.flags[creep.memory.homeRoom + "Loot"].remove();
                    }
                    if (Memory.lootSpawn) {
                        Memory.lootSpawn = undefined;
                    }
                    creep.suicide();
                }
            } else {
                //In home room, drop off energy
                if (creep.room.storage) {
                    let transferResult = undefined;
                    if (Object.keys(creep.store).length > 1) {
                        transferResult = creep.transfer(creep.room.storage, Object.keys(creep.store)[1])
                    } else {
                        transferResult = creep.transfer(creep.room.storage, Object.keys(creep.store)[0])
                    }
                    if (transferResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(creep.room.storage);
                    }
                }
            }
        }
    }
};

module.exports = creep_looter;