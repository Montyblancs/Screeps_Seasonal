var creep_workV2 = {

    /** @param {Creep} creep **/
    run: function(creep, moveRecalc) {

        if (creep.carry.energy > 0 && creep.memory.priority != 'harvester' && creep.memory.priority != 'harvesterNearDeath') {
            //All creeps check for road under them and repair if needed.
            var someStructure = creep.pos.lookFor(LOOK_STRUCTURES);
            if (someStructure.length && (someStructure[0].hitsMax - someStructure[0].hits >= 600) && someStructure[0].structureType == STRUCTURE_ROAD) {
                creep.repair(someStructure[0]);
            }
        }

        switch (creep.memory.priority) {
            case 'harvester':
            case 'harvesterNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'harvesterNearDeath') {
                    creep.memory.priority = 'harvesterNearDeath';
                }
                let mineTarget = undefined;
                let thisUnit = undefined;

                if (creep.memory.sourceLocation) {
                    mineTarget = Game.getObjectById(creep.memory.sourceLocation);
                    if (mineTarget) {
                        if (creep.harvest(mineTarget) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(mineTarget, {
                                maxRooms: 1
                            });
                        }
                    }
                }
                if (creep.memory.storageUnit && (Game.time % 4 == 0 || !creep.memory.onContainer)) {
                    thisUnit = Game.getObjectById(creep.memory.storageUnit);
                }

                if (thisUnit) {
                    if (thisUnit.structureType == STRUCTURE_CONTAINER) {
                        if (thisUnit.hits < thisUnit.hitsMax) {
                            creep.repair(thisUnit);
                        }
                        if (creep.pos.x != thisUnit.pos.x || creep.pos.y != thisUnit.pos.y) {
                            creep.travelTo(thisUnit, {
                                maxRooms: 1
                            });
                        } else {
                            creep.memory.onContainer = true;
                        }
                    } else {
                        //This is a storage Unit
                        if (creep.transfer(thisUnit, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            if (Game.flags[creep.room.name + "storageMiner"]) {
                                creep.travelTo(Game.flags[creep.room.name + "storageMiner"], {
                                    maxRooms: 1
                                })
                            } else {
                                creep.travelTo(thisUnit, {
                                    maxRooms: 1
                                });
                            }
                        } else if (!creep.memory.onContainer) {
                            creep.memory.onContainer = true;
                        }
                    }
                } else if (!creep.memory.storageUnit && mineTarget && creep.pos.inRangeTo(mineTarget, 1)) {
                    let containers = mineTarget.pos.findInRange(FIND_STRUCTURES, 2, {
                        filter: (structure) => structure.structureType == STRUCTURE_STORAGE
                    });
                    if (!containers.length) {
                        containers = mineTarget.pos.findInRange(FIND_STRUCTURES, 2, {
                            filter: (structure) => structure.structureType == STRUCTURE_CONTAINER
                        });
                    }
                    if (containers.length) {
                        if (creep.pos != containers[0].pos && containers[0].structureType == STRUCTURE_CONTAINER) {
                            creep.travelTo(containers[0], {
                                maxRooms: 1
                            });
                        }
                        creep.memory.storageUnit = containers[0].id;
                    } else {
                        if (creep.carry[RESOURCE_ENERGY] >= 36) {
                            let sites = mineTarget.pos.findInRange(FIND_CONSTRUCTION_SITES, 2)
                            if (sites.length) {
                                if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(sites[0], {
                                        maxRooms: 1
                                    });
                                }
                            } else if (!sites.length) {
                                //Create new container
                                if (creep.pos.isNearTo(mineTarget)) {
                                    creep.room.createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_CONTAINER);
                                }
                            }
                        }
                    }
                }
                break;
            case 'supplier':
            case 'supplierNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'supplierNearDeath') {
                    creep.memory.priority = 'supplierNearDeath';
                }

                if (!creep.memory.atSpot && Game.flags[creep.room.name + "Supply"] && (creep.pos.x != Game.flags[creep.room.name + "Supply"].pos.x || creep.pos.y != Game.flags[creep.room.name + "Supply"].pos.y)) {
                    creep.travelTo(Game.flags[creep.room.name + "Supply"], {
                        maxRooms: 1
                    });
                } else if (_.sum(creep.carry) == 0) {
                    creep.memory.atSpot = true;
                    //Get from storage
                    var storageTarget = creep.room.storage;
                    if (storageTarget) {
                        if (creep.withdraw(storageTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(storageTarget, {
                                maxRooms: 1
                            });
                        }
                    }
                } else if (Memory.towerNeedEnergy[creep.room.name].length) {
                    var target = Game.getObjectById(Memory.towerNeedEnergy[creep.room.name][0]);
                    if (target) {
                        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(target, {
                                maxRooms: 1
                            });
                        }
                    }
                }
                break;
            case 'upgrader':
            case 'upgraderNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'upgraderNearDeath') {
                    creep.memory.priority = 'upgraderNearDeath';
                }

                if (_.sum(creep.carry) > 0) {
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        if (Game.flags[creep.room.name + "Controller"]) {
                            creep.travelTo(Game.flags[creep.room.name + "Controller"], {
                                maxRooms: 1,
                                range: 2
                            });
                        } else {
                            creep.travelTo(creep.room.controller, {
                                maxRooms: 1,
                                range: 2
                            });
                        }
                    } else {
                        if ((creep.room.controller.sign && creep.room.controller.sign.username != "Montblanc") || !creep.room.controller.sign) {
		                	let roomDecoder = creep.pos.findClosestByRange(FIND_SYMBOL_DECODERS);
		                	let thisDecoderResource = ''
		                    if (roomDecoder) {
		                        thisDecoderResource = roomDecoder.resourceType.replace("symbol_", "").toUpperCase();
		                    }
		                    creep.travelTo(creep.room.controller, {
		                    	maxRooms: 1
		                    });
		                    creep.signController(creep.room.controller, '| ' + thisDecoderResource + ' | DM/Slack for whitelist! Rushing RCL for big doinks');
		                }

                        if (Game.time % 2 == 0) {
                            creep.say("\u261D\uD83D\uDE3C", true);
                        } else {
                            creep.say("\uD83D\uDC4C\uD83D\uDE39", true);
                        }
                    }
                } else if (creep.memory.storageTarget) {
                    let thisTarget = Game.getObjectById(creep.memory.storageTarget);
                    if (thisTarget && _.sum(thisTarget.store) > creep.carryCapacity) {
                        if (creep.withdraw(thisTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(thisTarget, {
                                maxRooms: 1
                            });
                        }
                    } else {
                        let newContainer = findContainerWithEnergy(creep, creep.carryCapacity);
                        if (newContainer) {
                            creep.memory.storageTarget = newContainer.id;
                            if (creep.withdraw(newContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(newContainer, {
                                    maxRooms: 1
                                });
                            }
                        }
                    }
                } else {
                    let newContainer = findContainerWithEnergy(creep, creep.carryCapacity);
                    if (newContainer) {
                        creep.memory.storageTarget = newContainer.id;
                        if (creep.withdraw(newContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(newContainer, {
                                maxRooms: 1
                            });
                        }
                    }
                }
                break;
            case 'builder':
            case 'builderNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'builderNearDeath') {
                    creep.memory.priority = 'builderNearDeath';
                }

                if (_.sum(creep.carry) > 0) {
                    let needSearch = true;
                    if (creep.memory.structureTarget) {
                        let thisStructure = Game.getObjectById(creep.memory.structureTarget);
                        if (thisStructure) {
                            needSearch = false;
                            if (creep.build(thisStructure) == ERR_NOT_IN_RANGE || creep.repair(thisStructure) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(thisStructure, {
                                    maxRooms: 1,
                                    range: 2
                                });
                            }
                        } else {
                            creep.memory.structureTarget = undefined;
                        }
                    }

                    if (needSearch) {
                        let target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => structure.structureType == STRUCTURE_RAMPART && structure.hits <= 500
                        });
                        if (target) {
                            creep.memory.structureTarget = target.id;
                            let repairResult = creep.repair(target)
                            if (repairResult == ERR_NOT_IN_RANGE) {
                                creep.travelTo(target, {
                                    maxRooms: 1,
                                    range: 2
                                });
                            } else if (repairResult == ERR_NO_BODYPART) {
                                creep.suicide();
                            }
                        } else {
                            target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                            if (target) {
                                creep.memory.structureTarget = target.id;
                                if (creep.build(target) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(target, {
                                        maxRooms: 1
                                    });
                                } else if (creep.build(target) == ERR_NO_BODYPART) {
                                    creep.suicide();
                                }
                            } else if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                                if (Game.flags[creep.room.name + "Controller"]) {
                                    creep.travelTo(Game.flags[creep.room.name + "Controller"], {
                                        maxRooms: 1,
                                        range: 2
                                    });
                                } else {
                                    creep.travelTo(creep.room.controller, {
                                        maxRooms: 1,
                                        range: 2
                                    });
                                }
                            }
                        }
                    }
                } else if (creep.memory.storageTarget) {
                    creep.memory.structureTarget = undefined;
                    let thisTarget = Game.getObjectById(creep.memory.storageTarget);
                    if (thisTarget && _.sum(thisTarget.store) > creep.carryCapacity) {
                        if (creep.withdraw(thisTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(thisTarget, {
                                maxRooms: 1
                            });
                        }
                    } else {
                        let newContainer = findContainerWithEnergy(creep, creep.carryCapacity);
                        if (newContainer) {
                            creep.memory.storageTarget = newContainer.id;
                            if (creep.withdraw(newContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(newContainer, {
                                    maxRooms: 1
                                });
                            }
                        }
                    }
                } else {
                    creep.memory.structureTarget = undefined;
                    let newContainer = findContainerWithEnergy(creep, creep.carryCapacity);
                    if (newContainer) {
                        creep.memory.storageTarget = newContainer.id;
                        if (creep.withdraw(newContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(newContainer, {
                                maxRooms: 1
                            });
                        }
                    }
                }
                break;
            case 'repair':
            case 'repairNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'repairNearDeath') {
                    creep.memory.priority = 'repairNearDeath';
                }

                if (!creep.memory.hasBoosted) {
                    creep.memory.hasBoosted = true;
                }

                if (creep.carryCapacity > 0) {
                    findNewRepairTarget(creep, _.sum(creep.carry));
                } else {
                    creep.suicide();
                }
                break;
            case 'distributor':
            case 'distributorNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'distributorNearDeath') {
                    creep.memory.priority = 'distributorNearDeath';
                }

                if (_.sum(creep.carry) == 0) {
                    //Get from storage
                    if (creep.memory.storageTarget) {
                        creep.memory.structureTarget = undefined;

                        let thisTarget = Game.getObjectById(creep.memory.storageTarget);
                        if (thisTarget && _.sum(thisTarget.store) > 0) {
                            let withdrawResult = creep.withdraw(thisTarget, RESOURCE_ENERGY);
                            if (withdrawResult == ERR_NOT_IN_RANGE) {
                                creep.travelTo(thisTarget, {
                                    maxRooms: 1
                                });
                            } else if (withdrawResult == OK) {
                                creep.memory.storageTarget = undefined;
                            }
                        } else {
                            let newContainer = findContainerWithEnergy(creep, 10);
                            if (newContainer) {
                                creep.memory.storageTarget = newContainer.id;
                                if (creep.withdraw(newContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(newContainer, {
                                        maxRooms: 1
                                    });
                                }
                            }
                        }
                    } else {
                        creep.memory.structureTarget = undefined;

                        let newContainer = findContainerWithEnergy(creep, 10);
                        if (newContainer) {
                            creep.memory.storageTarget = newContainer.id;
                            if (creep.withdraw(newContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(newContainer, {
                                    maxRooms: 1
                                });
                            }
                        } else {
                            //Listen & move for creeps
                            let talkingCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                                filter: (thisCreep) => (creep.id != thisCreep.id && thisCreep.saying)
                            })
                            if (talkingCreeps.length) {
                                let coords = talkingCreeps[0].saying.split(";");
                                if (talkingCreeps[0].memory.priority != 'repair' && coords.length == 2 && creep.pos.x == parseInt(coords[0]) && creep.pos.y == parseInt(coords[1])) {
                                    //Standing in the way of a creep
                                    let thisDirection = creep.pos.getDirectionTo(talkingCreeps[0].pos);
                                    creep.move(thisDirection);
                                    creep.say("\uD83D\uDCA6", true);
                                }
                            }
                        }
                    }
                } else if (creep.room.energyAvailable < creep.room.energyCapacityAvailable || !creep.room.storage || creep.room.name != creep.memory.homeRoom) {
                    var savedTarget = Game.getObjectById(creep.memory.structureTarget);
                    var getNewStructure = false;
                    if (savedTarget && savedTarget.energy < savedTarget.energyCapacity) {
                        if (creep.transfer(savedTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(savedTarget, {
                                maxRooms: 1
                            });
                        } else {
                            getNewStructure = true;
                            creep.memory.structureTarget = undefined;
                        }
                    } else if (savedTarget) {
                        getNewStructure = true;
                        creep.memory.structureTarget = undefined;
                    }
                    if (!creep.memory.structureTarget) {
                        var target = undefined;
                        if (getNewStructure) {
                            if (!creep.room.storage) {
                                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                    filter: (structure) => {
                                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                            structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity && structure.id != savedTarget.id;
                                    }
                                });
                            } else {
                                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                    filter: (structure) => {
                                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                            structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity && structure.id != savedTarget.id;
                                    }
                                });
                            }

                        } else {
                            if (!creep.room.storage) {
                                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                    filter: (structure) => {
                                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                            structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                                    }
                                });
                            } else {
                                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                    filter: (structure) => {
                                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                            structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
                                    }
                                });
                            }

                        }
                        if (!target) {
                            //Find closest by path will not return anything if path is blocked
                            if (getNewStructure) {
                                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                                    filter: (structure) => {
                                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                            structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity && structure.id != savedTarget.id;
                                    }
                                });
                            } else {
                                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                                    filter: (structure) => {
                                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                            structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
                                    }
                                });
                            }
                        }

                        if (target) {
                            if (getNewStructure) {
                                creep.travelTo(target, {
                                    maxRooms: 1
                                });
                                creep.memory.structureTarget = target.id;
                            } else if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(target, {
                                    maxRooms: 1
                                });
                                creep.memory.structureTarget = target.id;
                            }
                        } else {
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
                        }
                    }
                }
                break;
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
    }
};

function findNewRepairTarget(creep, creepEnergy) {
    if (creepEnergy <= 0) {

        creep.memory.structureTarget = undefined;
        //Get from storage
        if (creep.memory.storageTarget) {
            let thisTarget = Game.getObjectById(creep.memory.storageTarget);
            if (thisTarget && _.sum(thisTarget.store) > creep.carryCapacity) {
                let withdrawResult = creep.withdraw(thisTarget, RESOURCE_ENERGY);
                if (withdrawResult == ERR_NOT_IN_RANGE) {
                    creep.travelTo(thisTarget, {
                        maxRooms: 1
                    });
                } else if (withdrawResult == OK) {
                    moveToNewTarget(creep);
                }
            } else {
                let newContainer = findContainerWithEnergy(creep, creep.carryCapacity);
                if (newContainer) {
                    creep.memory.storageTarget = newContainer.id;
                    let withdrawResult = creep.withdraw(newContainer, RESOURCE_ENERGY);
                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(newContainer, {
                            maxRooms: 1
                        });
                    } else if (withdrawResult == OK) {
                        moveToNewTarget(creep);
                    }
                }
            }
        } else {
            let newContainer = findContainerWithEnergy(creep, creep.carryCapacity);
            if (newContainer) {
                creep.memory.storageTarget = newContainer.id;
                let withdrawResult = creep.withdraw(newContainer, RESOURCE_ENERGY);
                if (withdrawResult == ERR_NOT_IN_RANGE) {
                    creep.travelTo(newContainer, {
                        maxRooms: 1
                    });
                } else if (withdrawResult == OK) {
                    moveToNewTarget(creep);
                }
            }
        }
    } else if (creep.memory.structureTarget) {
        var thisStructure = Game.getObjectById(creep.memory.structureTarget);
        if (thisStructure) {
            if (thisStructure.hits == thisStructure.hitsMax) {
                creep.memory.structureTarget = undefined;
                findNewRepairTarget(creep, _.sum(creep.carry));
            } else {
                //If using last bit of energy this tick, find new target
                var repairResult = creep.repair(thisStructure);
                creep.travelTo(thisStructure, {
                    maxRooms: 1,
                    range: 1
                });
                if (repairResult == OK) {
                    //Listen for creeps
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
                }

                if (repairResult == OK && creepEnergy <= creep.getActiveBodyparts(WORK)) {
                    //Used all energy, travel to storage
                    findNewRepairTarget(creep, 0);
                }
            }
        } else {
            creep.memory.structureTarget = undefined;
            findNewRepairTarget(creep, _.sum(creep.carry));
        }
    } else {
        var closestDamagedStructure = [];
        closestDamagedStructure = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => (structure.structureType != STRUCTURE_ROAD) && (structure.hitsMax - structure.hits >= 200)
        });

        if (closestDamagedStructure.length > 0) {
            closestDamagedStructure.sort(repairCompare);
            creep.memory.structureTarget = closestDamagedStructure[0].id;
            if (creep.repair(closestDamagedStructure[0]) == ERR_NOT_IN_RANGE) {
                if (!Memory.warMode) {
                    creep.travelTo(closestDamagedStructure[0], {
                        maxRooms: 1,
                        range: 1
                    });
                } else {
                    creep.travelTo(closestDamagedStructure[0], {
                        maxRooms: 1
                    });
                }
            }
        }
    }
}

function moveToNewTarget(creep) {
    var closestDamagedStructure = [];
    closestDamagedStructure = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => (structure.structureType != STRUCTURE_ROAD) && (structure.hitsMax - structure.hits >= 200)
    });

    if (closestDamagedStructure.length > 0) {
        closestDamagedStructure.sort(repairCompare);
        creep.memory.structureTarget = closestDamagedStructure[0].id;
        if (!Memory.warMode) {
            creep.travelTo(closestDamagedStructure[0], {
                maxRooms: 1,
                range: 1
            });
        } else {
            creep.travelTo(closestDamagedStructure[0], {
                maxRooms: 1
            });
        }
    }
}

function repairCompare(a, b) {
    if (a.hits < b.hits)
        return -1;
    if (a.hits > b.hits)
        return 1;
    return 0;
}

function findContainerWithEnergy(thisCreep, energyMin) {
    if (thisCreep.room.terminal && thisCreep.room.terminal.store[RESOURCE_ENERGY] > 0) {
        return thisCreep.room.terminal
    }
	if (thisCreep.memory.priority == 'distributor' && thisCreep.room.storage && thisCreep.room.storage.store[RESOURCE_ENERGY] >= 10000) {
		return thisCreep.room.storage
	}
	
    let storageContainer = thisCreep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] >= energyMin
    });
    if (storageContainer) {
        return storageContainer;
    } else {
        return undefined;
    }
}

module.exports = creep_workV2;