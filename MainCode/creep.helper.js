var creep_Helper = {
    run: function(creep) {

        /*let closeFoe = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (eCreep) => (!Memory.whiteList.includes(eCreep.owner.username) && eCreep.owner.username != "Nemah")
        });*/
        if (creep.hits <= 800 && !creep.room.controller.safeMode && Game.flags[creep.memory.homeRoom + "SendHelper"]) {
            //Determine if attacker is player, if so, delete flag.
            var hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                filter: (creep) => (creep.getActiveBodyparts(WORK) > 0 || creep.getActiveBodyparts(CARRY) > 0 || creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0 || creep.getActiveBodyparts(HEAL) > 0 && !Memory.whiteList.includes(creep.owner.username))
            });
            if (hostiles.length > 0 && hostiles[0].owner.username != 'Invader' && hostiles[0].owner.username != 'Source Keeper') {
                //Try safe mode
                //let safeModeResult = creep.room.controller.activateSafeMode()
                let safeModeResult = false;
                if (safeModeResult != OK) {
                    Game.notify(creep.memory.targetFlag + ' was removed due to an attack by ' + hostiles[0].owner.username);
                    Memory.LastNotification = Game.time.toString() + ' : ' + creep.memory.targetFlag + ' was removed due to an attack by ' + hostiles[0].owner.username
                    if (!Memory.warMode) {
                        Memory.warMode = true;
                        Game.notify('War mode has been enabled.');
                    }
                    let targetTime = Game.time + 1500;
                    creep.room.createFlag(Game.flags[creep.memory.homeRoom + "SendHelper"].pos, creep.memory.homeRoom + "SendHelper" + ";" + targetTime.toString());
                    Game.flags[creep.memory.homeRoom + "SendHelper"].remove();
                }
            }
        }

        if (creep.room.name != creep.memory.destination) {
            var thisPortal = undefined;
            if (Game.flags["TakePortal"] && Game.flags["TakePortal"].pos.roomName == creep.pos.roomName) {
                var thisPortal = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_PORTAL)
                });
            }
            if (thisPortal) {
                if (creep.memory.path.length && creep.memory.path[0] == creep.room.name) {
                    creep.memory.path.splice(0, 1);
                }
                creep.travelTo(thisPortal)
            } else if (creep.memory.path && creep.memory.path.length) {
                if (creep.memory.path[0] == creep.room.name) {
                    creep.memory.path.splice(0, 1);
                }
                creep.travelTo(new RoomPosition(25, 25, creep.memory.path[0]));
                //creep.travelTo(new RoomPosition(25, 25, creep.memory.destination));
            } else {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.destination));
            }

            if (creep.room.controller && !creep.room.controller.my) {
                if (creep.room.controller.reservation && creep.room.controller.reservation.username == "Montblanc") {
                    //Soak
                } else {
                    let somethingNearby = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => (structure.structureType != STRUCTURE_ROAD)
                    });
                    if (somethingNearby) {
                        creep.dismantle(somethingNearby);
                    }
                }
            }
        } else {
            if (!creep.memory.currentState) {
                creep.memory.currentState = 1;
            }
            if (!creep.memory.waitingTimer) {
                creep.memory.waitingTimer = 0;
            }

            if (creep.memory.currentState == 1) {
                let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (drop) => (drop.amount >= 200 && drop.resourceType == RESOURCE_ENERGY)
                });
                if (droppedResources) {
                    if (creep.pickup(droppedResources) == ERR_NOT_IN_RANGE) {
                        creep.travelTo(droppedResources, {
                            maxRooms: 1
                        })
                    }
                } else if (creep.memory.targetSource) {
                    let thisSource = Game.getObjectById(creep.memory.targetSource);
                    if (thisSource) {
                        if (creep.harvest(thisSource) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(thisSource, {
                                maxRooms: 1,
                                ignoreRoads: true
                            });
                        }
                        if (thisSource.energy <= 25 || creep.memory.waitingTimer >= 30) {
                            creep.memory.targetSource = undefined;
                        }
                    }
                } else {
                    let roomSources = creep.pos.findClosestByPath(FIND_SOURCES, {
                        filter: (tSource) => (tSource.energy >= creep.carryCapacity)
                    });
                    if (roomSources) {
                        creep.memory.targetSource = roomSources.id;
                        if (creep.harvest(roomSources) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(roomSources, {
                                maxRooms: 1,
                                ignoreRoads: true
                            });
                        }
                    }
                }

                if (_.sum(creep.carry) + (creep.getActiveBodyparts(WORK) * 2) >= creep.carryCapacity) {
                    creep.memory.currentState = 2;
                }
            } else {
                let needSearch = true;
                if (creep.memory.structureTarget) {
                    let thisStructure = Game.getObjectById(creep.memory.structureTarget);
                    if (thisStructure) {
                        needSearch = false;
                        let buildResult = creep.build(thisStructure);
                        if (buildResult == ERR_NOT_IN_RANGE) {
                            creep.travelTo(thisStructure, {
                                maxRooms: 1,
                                ignoreRoads: true
                            });
                        } else if (buildResult == ERR_INVALID_TARGET && thisStructure.energy < thisStructure.energyCapacity) {
                            if (creep.transfer(thisStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(thisStructure, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            } else {
                                creep.memory.structureTarget = undefined;
                            }
                        } else {
                            creep.memory.structureTarget = undefined;
                        }
                    } else {
                        creep.memory.structureTarget = undefined;
                    }
                }

                if (needSearch) {
                    target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                    if (target) {
                        let spawnSearch = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                            filter: (structure) => {
                                return structure.structureType == STRUCTURE_SPAWN
                            }
                        });
                        if (spawnSearch) {
                            target = spawnSearch;
                        }
                        creep.memory.structureTarget = target.id;
                        let buildResult = creep.build(target);
                        if (buildResult == ERR_NOT_IN_RANGE) {
                            creep.travelTo(target, {
                                maxRooms: 1,
                                ignoreRoads: true
                            });
                        } else if (buildResult == ERR_NO_BODYPART) {
                            creep.suicide();
                        }
                    } else {
                        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity;
                            }
                        });
                        if (target) {
                            creep.memory.structureTarget = target.id;
                            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(target, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            }
                        } else if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
                            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                filter: (structure) => {
                                    return (structure.structureType == STRUCTURE_EXTENSION ||
                                        structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
                                }
                            });
                            if (target && creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(target, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            }
                        } else if (creep.upgradeController(creep.room.controller) == ERR_INVALID_TARGET || 1 == 1) {
                            //Generate ramparts around the controller & upgrade them - hostiles are blocking
                            //Build ramparts around controller (lazy mode)
                            creep.room.createConstructionSite(creep.room.controller.pos.x-1, creep.room.controller.pos.y, STRUCTURE_RAMPART);
                            creep.room.createConstructionSite(creep.room.controller.pos.x-1, creep.room.controller.pos.y-1, STRUCTURE_RAMPART);
                            creep.room.createConstructionSite(creep.room.controller.pos.x, creep.room.controller.pos.y-1, STRUCTURE_RAMPART);
                            creep.room.createConstructionSite(creep.room.controller.pos.x+1, creep.room.controller.pos.y-1, STRUCTURE_RAMPART);
                            creep.room.createConstructionSite(creep.room.controller.pos.x+1, creep.room.controller.pos.y, STRUCTURE_RAMPART);
                            creep.room.createConstructionSite(creep.room.controller.pos.x+1, creep.room.controller.pos.y+1, STRUCTURE_RAMPART);
                            creep.room.createConstructionSite(creep.room.controller.pos.x, creep.room.controller.pos.y+1, STRUCTURE_RAMPART);
                            creep.room.createConstructionSite(creep.room.controller.pos.x-1, creep.room.controller.pos.y+1, STRUCTURE_RAMPART);

                            mostDamagedStructure = creep.room.find(FIND_STRUCTURES, {
                                filter: (structure) => (structure.structureType != STRUCTURE_ROAD && structure.structureType != STRUCTURE_CONTAINER && structure.hitsMax - structure.hits >= 200) || (structure.structureType == STRUCTURE_CONTAINER && structure.hitsMax - structure.hits >= 50000)
                            });
                            if (mostDamagedStructure.length > 0) {
                                mostDamagedStructure.sort(repairCompare);
                                if (creep.repair(mostDamagedStructure[0]) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(mostDamagedStructure[0], {
                                        maxRooms: 1
                                    })
                                }
                            } else {
                                creep.travelTo(creep.room.controller, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            }
                        } else if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                            if (Game.flags[creep.room.name + "Controller"]) {
                                creep.travelTo(Game.flags[creep.room.name + "Controller"], {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            } else {
                                creep.travelTo(creep.room.controller, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            }
                        } else {
                            if (creep.room.controller.sign && creep.room.controller.sign.username != "Montblanc") {
                                creep.travelTo(creep.room.controller, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                                creep.signController(creep.room.controller, '\u300C\u8F1D\u304F\u732B\u300D(\uFF90\u24DB\u11BD\u24DB\uFF90)\u2727');
                            } else if (!creep.room.controller.sign) {
                                creep.travelTo(creep.room.controller, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                                creep.signController(creep.room.controller, '\u300C\u8F1D\u304F\u732B\u300D(\uFF90\u24DB\u11BD\u24DB\uFF90)\u2727');
                            }
                        }
                    }
                }

                if (_.sum(creep.carry) <= 0) {
                    creep.memory.currentState = 1;
                } else {
                    let someStructure = creep.pos.lookFor(LOOK_STRUCTURES);
                    if (someStructure.length && (someStructure[0].hitsMax - someStructure[0].hits >= 800)) {
                        creep.repair(someStructure[0]);
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
            if (talkingCreeps[0].memory.priority != 'helper' && coords.length == 2 && creep.pos.x == parseInt(coords[0]) && creep.pos.y == parseInt(coords[1])) {
                //Standing in the way of a creep
                let thisDirection = creep.pos.getDirectionTo(talkingCreeps[0].pos);
                creep.move(thisDirection);
                creep.say("\uD83D\uDCA6", true);
            }
        }

        /*if (closeFoe) {
            let closeRange = creep.pos.getRangeTo(closeFoe);
            if (closeRange <= 7) {
                //Dodge away from foe
                let foeDirection = creep.pos.getDirectionTo(closeFoe);
                let y = 0;
                let x = 0;
                switch (foeDirection) {
                    case TOP:
                        y = 5;
                        break;
                    case TOP_RIGHT:
                        y = 5;
                        x = -5;
                        break;
                    case RIGHT:
                        x = -5;
                        break;
                    case BOTTOM_RIGHT:
                        y = -5;
                        x = -5;
                        break;
                    case BOTTOM:
                        y = -5;
                        break;
                    case BOTTOM_LEFT:
                        y = -5;
                        x = 5;
                        break;
                    case LEFT:
                        x = 5;
                        break;
                    case TOP_LEFT:
                        y = 5;
                        x = 5;
                        break;
                }
                x = creep.pos.x + x;
                y = creep.pos.y + y;
                if (x < 0) {
                    x = 0;
                    if (y < 25 && y > 0) {
                        y = y - 1;
                    } else if (y < 49) {
                        y = y + 1;
                    }
                } else if (x > 49) {
                    x = 49;
                    if (y < 25 && y > 0) {
                        y = y - 1;
                    } else if (y < 49) {
                        y = y + 1;
                    }
                }
                if (y < 0) {
                    y = 0;
                    if (x < 25 && x > 0) {
                        x = x - 1;
                    } else if (x < 49) {
                        x = x + 1;
                    }
                } else if (y > 49) {
                    y = 49;
                    if (x < 25 && x > 0) {
                        x = x - 1;
                    } else if (x < 49) {
                        x = x + 1;
                    }
                }

                creep.moveTo(x, y, {
                    ignoreRoads: true
                });
            }
        }*/
    }
};

function repairCompare(a, b) {
    if (a.hits < b.hits)
        return -1;
    if (a.hits > b.hits)
        return 1;
    return 0;
}

module.exports = creep_Helper;