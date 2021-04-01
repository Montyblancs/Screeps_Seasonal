var creep_upSupplier = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'upSupplierNearDeath') {
            creep.memory.priority = 'upSupplierNearDeath';
        }

        if (creep.store.getUsedCapacity() == 0) {
            //Get from storage
            //Get power if available and powerSpawn is empty
            let storageTarget = creep.room.storage;
            if (storageTarget) {
            	let moveScoreNeed = undefined;
            	if (creep.room.terminal) {
            		moveScoreNeed = determineScoreNeed(creep, storageTarget, creep.room.terminal);
            	}
                let getPower = false;
                let powerAmount = 100;
                if (Memory.powerSpawnList[creep.room.name].length && creep.room.storage.store[RESOURCE_POWER] > 0) {
                    var pSpawn = Game.getObjectById(Memory.powerSpawnList[creep.room.name][0]);
                    if (pSpawn && pSpawn.power == 0) {
                        getPower = true;
                        if (creep.room.storage.store[RESOURCE_POWER] < 100) {
                            powerAmount = creep.room.storage.store[RESOURCE_POWER];
                        }
                    }
                }
                if (moveScoreNeed) {
                	//moveScoreNeed = resource key to grab from storage
                	let withdrawResult = creep.withdraw(storageTarget, moveScoreNeed);
                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(storageTarget, {
                            ignoreRoads: true,
                            maxRooms: 1
                        });
                    } else if (withdrawResult == OK) {
                        locateSupplierTarget("SCORE", creep);
                    }
                } else if (getPower) {
                    var withdrawResult = creep.withdraw(storageTarget, RESOURCE_POWER, powerAmount);
                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(storageTarget, {
                            ignoreRoads: true,
                            maxRooms: 1
                        });
                    } else if (withdrawResult == OK) {
                        locateSupplierTarget("POWER", creep);
                    }
                } else {
                    if (creep.room.terminal && storageTarget.store[RESOURCE_ENERGY] < 250000 && creep.room.terminal.store[RESOURCE_ENERGY] > 31000) {
                        storageTarget = creep.room.terminal
                    }
                    var withdrawResult = creep.withdraw(storageTarget, RESOURCE_ENERGY);
                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(storageTarget, {
                            ignoreRoads: true,
                            maxRooms: 1
                        });
                    } else if (withdrawResult == OK) {
                        locateSupplierTarget("ENERGY", creep);
                    }
                }
            }
        } else {
        	if (creep.store[RESOURCE_ENERGY] == 0 && !creep.store[RESOURCE_POWER]) {
        		//Carrying score, go to terminal
        		if (creep.room.terminal) {
        			let transferResult = creep.transfer(creep.room.terminal, Object.keys(creep.store)[0]);
        			if (transferResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(creep.room.terminal, {
                            maxRooms: 1
                        });
                    }
        		}
        	} else if (creep.store[RESOURCE_POWER] > 0) {
                //Drop off in power Spawn
                var pSpawn = Game.getObjectById(Memory.powerSpawnList[creep.room.name][0]);
                if (pSpawn) {
                    var transferResult = creep.transfer(pSpawn, RESOURCE_POWER);
                    if (transferResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(pSpawn, {
                            maxRooms: 1
                        });
                    } else if (transferResult == OK) {
                        determineIfEmptyPower(pSpawn, creep);
                    }
                }
            } else {
                //Drop off in upgrader link
                var upLink = Game.getObjectById(creep.memory.linkTarget);
                if (upLink) {
                    var transferResult = creep.transfer(upLink, RESOURCE_ENERGY);
                    if (transferResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(upLink, {
                            maxRooms: 1
                        });
                    } else if (transferResult == OK){
                        determineIfEmptyEnergy(upLink, creep);
                    }
                } else {
                    creep.travelTo(creep.room.controller, {
                        maxRooms:1
                    });
                }
            }
        }
    }
};

function locateSupplierTarget(targetType, creep) {
	if (targetType == "SCORE") {
		if (creep.room.terminal) {
			creep.travelTo(creep.room.terminal, {
				maxRooms: 1
			});
		}
	} else if (targetType == "POWER") {
        var pSpawn = Game.getObjectById(Memory.powerSpawnList[creep.room.name][0]);
        if (pSpawn) {
            creep.travelTo(pSpawn, {
                maxRooms: 1
            });
        }
    } else {
        //Energy
        var upLink = Game.getObjectById(creep.memory.linkTarget);
        if (upLink) {
            creep.travelTo(upLink, {
                maxRooms: 1
            });
        }
    }
}

//Below functions are only fired when OK is returned
function determineIfEmptyPower(thisSpawn, creep) {
    if (creep.store.getUsedCapacity <= thisSpawn.powerCapacity - thisSpawn.power) {
        var storageTarget = creep.room.storage;
        if (storageTarget) {
            creep.travelTo(storageTarget, {
                ignoreRoads: true,
                maxRooms: 1
            });
        }
    }
}

function determineIfEmptyEnergy(thisLink, creep) {
    if (creep.store.getUsedCapacity <= thisLink.energyCapacity - thisLink.energy) {
        var storageTarget = creep.room.storage;
        if (storageTarget) {
            creep.travelTo(storageTarget, {
                ignoreRoads: true,
                maxRooms: 1
            });
        }
    }
}

function determineScoreNeed(creep, storage, terminal) {
	for (const key in storage.store) {
		//Don't move score from storage if it's supposed to be here
		if (SYMBOLS.indexOf(key) > -1 && (!Memory.decoderIndex[key] || (Memory.decoderIndex[key] && Memory.decoderIndex[key] != creep.room.name))) {
			if (storage.store[key] >= 100 && (!terminal.store[key] || terminal.store[key] < 5000)) {
				return key;
			}
		}
	}
	return undefined;
}

module.exports = creep_upSupplier;