var creep_labWorker = {
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.room.terminal) {
            if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'labWorkerNearDeath') {
                creep.memory.priority = 'labWorkerNearDeath';
            }

            if (!creep.memory.nextResourceCheck) {
                creep.memory.nextResourceCheck = Game.time + 50;
            }

            if (Game.time >= creep.memory.nextResourceCheck && Game.flags[creep.memory.primaryFlag] && creep.memory.lab4) {
                creep.memory.nextResourceCheck = Game.time + 50;
                if (creep.memory.resourceChecks < 15) {
                    var lab4 = Game.getObjectById(creep.memory.lab4);
                    var lab5 = Game.getObjectById(creep.memory.lab5);
                    if (creep.room.terminal.store[creep.memory.mineral6] >= 40000) {
                        //Immediately swap flags
                        creep.memory.resourceChecks = 15;
                        //Game.notify('PRODUCTION MAXED: ' + creep.room.name + ' has swapped off ' + creep.memory.primaryFlag + ' New Target : ' + creep.memory.backupFlag);
                    } else if (lab4 && lab5 && (lab4.mineralAmount < creep.carryCapacity || lab5.mineralAmount < creep.carryCapacity) && _.sum(creep.carry) == 0) {
                        //tick up, but don't swap yet
                        creep.memory.resourceChecks = creep.memory.resourceChecks + 1;
                        if (creep.memory.resourceChecks >= 15) {
                            //Game.notify('NO MATERIALS:' + creep.room.name + ' has swapped off ' + creep.memory.primaryFlag + ' New Target : ' + creep.memory.backupFlag);
                        }
                    }
                } else {
                    //Still can't find resources, switch flags
                    if (!Game.flags[creep.memory.backupFlag] && Game.flags[creep.memory.primaryFlag]) {
                        creep.room.createFlag(Game.flags[creep.memory.primaryFlag].pos, creep.memory.backupFlag, COLOR_CYAN);
                        Game.flags[creep.memory.primaryFlag].remove();
                    } else if (Game.flags[creep.memory.backupFlag] && Game.flags[creep.memory.primaryFlag]) {
                        //Just in case
                        Game.flags[creep.memory.primaryFlag].remove();
                    }
                }
            } else if (Game.flags[creep.memory.backupFlag] && Game.flags[creep.memory.primaryFlag]) {
                //Just in case
                Game.flags[creep.memory.primaryFlag].remove();
            } else if (Game.flags[creep.memory.backupFlag] && creep.memory.resourceChecks >= 15 && _.sum(creep.carry) == 0) {
                creep.suicide();
            }

            if (creep.memory.mineral1 == creep.memory.mineral6 || creep.memory.mineral2 == creep.memory.mineral6 || creep.memory.mineral3 == creep.memory.mineral6) {
                creep.memory.storeProduced = true;
            } else {
                creep.memory.storeProduced = false;
            }

            var labArray = [];
            var mineralArray = [];
            var lab1 = Game.getObjectById(creep.memory.lab1);
            var lab2 = Game.getObjectById(creep.memory.lab2);
            var lab3 = Game.getObjectById(creep.memory.lab3);
            labArray.push(lab1);
            labArray.push(lab2);
            labArray.push(lab3);
            mineralArray.push(creep.memory.mineral1);
            mineralArray.push(creep.memory.mineral2);
            mineralArray.push(creep.memory.mineral3);
            var lab4 = undefined;
            var lab5 = undefined;
            var lab6 = undefined;
            var lab7 = undefined;
            var lab8 = undefined;
            var lab9 = undefined;
            var lab10 = undefined;
            if (creep.memory.lab4) {
                lab4 = Game.getObjectById(creep.memory.lab4);
                lab5 = Game.getObjectById(creep.memory.lab5);
                lab6 = Game.getObjectById(creep.memory.lab6);
                labArray.push(lab4);
                labArray.push(lab5);
                labArray.push(lab6);
                mineralArray.push(creep.memory.mineral4);
                mineralArray.push(creep.memory.mineral5);
                mineralArray.push(creep.memory.mineral6);
            } else {
                creep.memory.lab4 = 'XXX';
                creep.memory.lab5 = 'XXX';
                creep.memory.lab6 = 'XXX';
            }

            if (creep.memory.lab7) {
                lab7 = Game.getObjectById(creep.memory.lab7);
                lab8 = Game.getObjectById(creep.memory.lab8);
                lab9 = Game.getObjectById(creep.memory.lab9);
                labArray.push(lab7);
                labArray.push(lab8);
                labArray.push(lab9);
                mineralArray.push(creep.memory.mineral7);
                mineralArray.push(creep.memory.mineral8);
                mineralArray.push(creep.memory.mineral9);
            } else {
                creep.memory.lab7 = 'XXX';
                creep.memory.lab8 = 'XXX';
                creep.memory.lab9 = 'XXX';
            }

            if (creep.memory.lab10) {
                lab10 = Game.getObjectById(creep.memory.lab10);
                labArray.push(lab10);
                mineralArray.push(creep.memory.mineral10);
            } else {
                creep.memory.lab10 = 'XXX';
            }

            var checkForMoreWork = false;
            var foundWork = false;

            var thisTarget = undefined;
            if (creep.memory.structureTarget) {
                thisTarget = Game.getObjectById(creep.memory.structureTarget);
            }

            if (thisTarget) {
                //Acting upon already saved target
                if (creep.memory.direction == 'Withdraw' && creep.memory.priority != 'labWorkerNearDeath') {
                    foundWork = true;
                    var withdrawResult = creep.withdraw(thisTarget, creep.memory.mineralToMove);
                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(thisTarget, {
                            maxRooms: 1,
                            ignoreRoads: true
                        });
                    } else {
                        creep.memory.structureTarget = undefined;
                        creep.memory.direction = undefined;
                        creep.memory.mineralToMove = undefined;
                    }
                } else {
                    foundWork = true;
                    var transferResult = creep.transfer(thisTarget, creep.memory.mineralToMove)
                    if (transferResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(thisTarget, {
                            maxRooms: 1,
                            ignoreRoads: true
                        });
                    } else {
                        creep.memory.structureTarget = undefined;
                        creep.memory.direction = undefined;
                        creep.memory.mineralToMove = undefined;
                        creep.memory.otherMineralTarget = undefined;
                    }
                }
            } else if (_.sum(creep.carry) == 0) {
                //Check all labs to see if there's a mineral that shouldn't be there, withdraw if needed
                for (var i in labArray) {
                    if (labArray[i] && labArray[i].mineralAmount > 0 && labArray[i].mineralType != mineralArray[i]) {
                        foundWork = true;
                        creep.memory.movingOtherMineral = true;
                        var withdrawResult = creep.withdraw(labArray[i], labArray[i].mineralType)
                        if (withdrawResult == ERR_NOT_IN_RANGE) {
                            creep.travelTo(labArray[i], {
                                maxRooms: 1,
                                ignoreRoads: true
                            });
                            creep.memory.structureTarget = labArray[i];
                            creep.memory.direction = 'Withdraw';
                            creep.memory.mineralToMove = labArray[i].mineralType;
                        }
                        break;
                    }
                }
            } else if (creep.memory.movingOtherMineral) {
                //Drop off "unknown" mineral in terminal
                foundWork = true;
                var currentlyCarrying = _.findKey(creep.carry);
                let transferTarget = creep.room.terminal;
                if (creep.memory.otherMineralTarget) {
                    transferTarget = Game.getObjectById(creep.memory.otherMineralTarget);
                }
                var transferResult = creep.transfer(transferTarget, currentlyCarrying)
                if (transferResult == ERR_NOT_IN_RANGE) {
                    creep.travelTo(transferTarget, {
                        maxRooms: 1,
                        ignoreRoads: true
                    });
                    creep.memory.structureTarget = transferTarget.id;
                    creep.memory.direction = 'Transfer';
                    creep.memory.mineralToMove = currentlyCarrying;
                } else if (transferResult == OK) {
                    creep.memory.movingOtherMineral = false;
                    creep.memory.structureTarget = undefined;
                    creep.memory.direction = undefined;
                    creep.memory.mineralToMove = undefined;
                    creep.memory.otherMineralTarget = undefined;
                }
            } else if (!thisTarget) {
                //Clear possible instructions if target is undefined
                creep.memory.structureTarget = undefined;
                creep.memory.direction = undefined;
                creep.memory.mineralToMove = undefined;
                creep.memory.otherMineralTarget = undefined;
            }

            if (!foundWork) {
                //Need to find target for work
                for (var i in labArray) {
                    if (Game.flags[creep.room.name + "WarBoosts"] && labArray[i]) {
                        //Blocks all other checks
                        switch (labArray[i].id) {
                            case creep.memory.lab4:
                            case creep.memory.lab5:
                            case creep.memory.lab6:
                            case creep.memory.lab1:
                            case creep.memory.lab2:
                            case creep.memory.lab3:
                                //Boost labs
                                if (_.sum(creep.carry) == 0 && creep.memory.priority != 'labWorkerNearDeath') {
                                    var minAmount = mineralArray[i] in creep.room.terminal.store;
                                    var minLab = labArray[i].mineralAmount;
                                    if (minLab <= 2500 && minAmount > 0) {
                                        creep.memory.structureTarget = creep.room.terminal.id;
                                        creep.memory.direction = 'Withdraw';
                                        creep.memory.mineralToMove = mineralArray[i];
                                        var withdrawResult = creep.withdraw(creep.room.terminal, mineralArray[i]);
                                        if (withdrawResult == ERR_NOT_IN_RANGE) {
                                            creep.travelTo(creep.room.terminal, {
                                                maxRooms: 1,
                                                ignoreRoads: true
                                            });
                                        }
                                        foundWork = true;
                                    }
                                } else {
                                    var carryAmount = mineralArray[i] in creep.carry;
                                    if (carryAmount > 0) {
                                        creep.memory.structureTarget = labArray[i].id;
                                        creep.memory.direction = 'Transfer';
                                        creep.memory.mineralToMove = mineralArray[i];
                                        var transferResult = creep.transfer(labArray[i], mineralArray[i]);
                                        if (transferResult == ERR_NOT_IN_RANGE) {
                                            creep.travelTo(labArray[i], {
                                                maxRooms: 1,
                                                ignoreRoads: true
                                            });
                                        }
                                        foundWork = true;
                                    }
                                }
                                break;
                            }
                        } else {
                            if (labArray[i]) {
                                switch (labArray[i].id) {
                                //Reagent labs
                                case creep.memory.lab4:
                                case creep.memory.lab5:
                                if (_.sum(creep.carry) == 0 && creep.memory.priority != 'labWorkerNearDeath') {
                                    if (creep.room.terminal.store[creep.memory.mineral6] < 40000 || !creep.room.terminal.store[creep.memory.mineral6]) {
                                        var mineralAmount = mineralArray[i] in creep.room.terminal.store;
                                        if (mineralAmount > 0 && labArray[i].mineralAmount < labArray[i].mineralCapacity - creep.carryCapacity) {
                                            creep.memory.structureTarget = creep.room.terminal.id;
                                            creep.memory.direction = 'Withdraw';
                                            creep.memory.mineralToMove = mineralArray[i];
                                            var withdrawResult = creep.withdraw(creep.room.terminal, mineralArray[i])
                                            if (withdrawResult == ERR_NOT_IN_RANGE) {
                                                creep.travelTo(creep.room.terminal, {
                                                    maxRooms: 1,
                                                    ignoreRoads: true
                                                });
                                            }
                                            foundWork = true;
                                        }
                                    }
                                } else if (creep.carry[mineralArray[i]] && labArray[i].mineralAmount < labArray[i].mineralCapacity - creep.carryCapacity) {
                                    creep.memory.structureTarget = labArray[i].id;
                                    creep.memory.direction = 'Transfer';
                                    creep.memory.mineralToMove = mineralArray[i];
                                    var transferResult = creep.transfer(labArray[i], mineralArray[i])
                                    if (transferResult == ERR_NOT_IN_RANGE) {
                                        creep.travelTo(labArray[i], {
                                            maxRooms: 1,
                                            ignoreRoads: true
                                        });
                                    }
                                    foundWork = true;
                                }
                                break;
                                    //Result labs
                                    case creep.memory.lab6:
                                    case creep.memory.lab7:
                                    case creep.memory.lab8:
                                    case creep.memory.lab9:
                                    case creep.memory.lab10:
                                    if (_.sum(creep.carry) == 0 && creep.memory.priority != 'labWorkerNearDeath') {
                                        var mineralAmount = labArray[i].mineralAmount;
                                        if (mineralAmount >= creep.carryCapacity) {
                                            creep.memory.structureTarget = labArray[i].id;
                                            creep.memory.direction = 'Withdraw';
                                            creep.memory.mineralToMove = mineralArray[i];
                                            var withdrawResult = creep.withdraw(labArray[i], labArray[i].mineralType)
                                            if (withdrawResult == ERR_NOT_IN_RANGE) {
                                                creep.travelTo(labArray[i], {
                                                    maxRooms: 1,
                                                    ignoreRoads: true
                                                });
                                            }
                                            foundWork = true;
                                        }
                                    } else if (creep.carry[mineralArray[i]]) {
                                        if (creep.memory.storeProduced) {
                                            var labAmount = 9999;
                                            if (mineralArray[i] == creep.memory.mineral1) {
                                                labAmount = lab1.mineralAmount;
                                            } else if (mineralArray[i] == creep.memory.mineral2) {
                                                labAmount = lab2.mineralAmount;
                                            } else if (mineralArray[i] == creep.memory.mineral3) {
                                                labAmount = lab3.mineralAmount;
                                            }
                                            if (labAmount <= 2500) {
                                                continue;
                                            }
                                        }

                                        if (mineralArray[i] == RESOURCE_GHODIUM && creep.room.controller.level == 8 && Memory.nukerList[creep.room.name].length) {
                                            var thisNuker = Game.getObjectById(Memory.nukerList[creep.room.name][0]);
                                            if (thisNuker && thisNuker.ghodiumCapacity > thisNuker.ghodium) {
                                                creep.memory.structureTarget = thisNuker.id;
                                                creep.memory.direction = 'Transfer';
                                                creep.memory.mineralToMove = RESOURCE_GHODIUM;
                                                if (creep.transfer(thisNuker, mineralArray[i]) == ERR_NOT_IN_RANGE) {
                                                    creep.travelTo(thisNuker, {
                                                        maxRooms: 1,
                                                        ignoreRoads: true
                                                    });
                                                }
                                                foundWork = true;
                                                continue;
                                            }
                                        }

                                        creep.memory.structureTarget = creep.room.terminal.id;
                                        creep.memory.direction = 'Transfer';
                                        creep.memory.mineralToMove = mineralArray[i];
                                        if (creep.transfer(creep.room.terminal, mineralArray[i]) == ERR_NOT_IN_RANGE) {
                                            creep.travelTo(creep.room.terminal, {
                                                maxRooms: 1,
                                                ignoreRoads: true
                                            });
                                        }
                                        foundWork = true;
                                    }
                                    break;
                                    case creep.memory.lab1:
                                    case creep.memory.lab2:
                                    case creep.memory.lab3:
                                    //Boost labs
                                    if (_.sum(creep.carry) == 0 && creep.memory.priority != 'labWorkerNearDeath') {
                                        var minAmount = mineralArray[i] in creep.room.terminal.store;
                                        var minLab = labArray[i].mineralAmount;
                                        if (minLab <= 2500 && minAmount > 0) {
                                            creep.memory.structureTarget = creep.room.terminal.id;
                                            creep.memory.direction = 'Withdraw';
                                            creep.memory.mineralToMove = mineralArray[i];
                                            var withdrawResult = creep.withdraw(creep.room.terminal, mineralArray[i]);
                                            if (withdrawResult == ERR_NOT_IN_RANGE) {
                                                creep.travelTo(creep.room.terminal, {
                                                    maxRooms: 1,
                                                    ignoreRoads: true
                                                });
                                            }
                                            foundWork = true;
                                        }
                                    } else {
                                        var carryAmount = mineralArray[i] in creep.carry;
                                        if (carryAmount > 0 && labArray[i].mineralAmount <= 2500) {
                                            creep.memory.structureTarget = labArray[i].id;
                                            creep.memory.direction = 'Transfer';
                                            creep.memory.mineralToMove = mineralArray[i];
                                            var transferResult = creep.transfer(labArray[i], mineralArray[i]);
                                            if (transferResult == ERR_NOT_IN_RANGE) {
                                                creep.travelTo(labArray[i], {
                                                    maxRooms: 1,
                                                    ignoreRoads: true
                                                });
                                            }
                                            foundWork = true;
                                        }
                                    }
                                    break;
                                }
                            }
                        }

                        if (foundWork) {
                            break;
                        }
                    }
                }

                if (!foundWork && creep.room.storage) {
                //Take minerals out of storage and put them in the terminal
                if (Object.keys(creep.room.storage.store).length > 1 && creep.room.terminal && creep.room.terminal.store.getFreeCapacity() >= 25000) {
                    let withdrawResult = "N/A"
                    for (let i = 0, len = Object.keys(creep.room.storage.store).length; i < len; i++) {
                        if (Object.keys(creep.room.storage.store)[i] == RESOURCE_POWER || Object.keys(creep.room.storage.store)[i] == RESOURCE_ENERGY || SYMBOLS.indexOf(Object.keys(creep.room.storage.store)[i]) > -1) {
                            continue;
                        } else {
                            withdrawResult = creep.withdraw(creep.room.storage, Object.keys(creep.room.storage.store)[i]);
                            break;
                        }
                    }
                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(creep.room.storage, {
                            maxRooms: 1,
                            ignoreRoads: true
                        });
                        foundWork = true;
                    } else if (withdrawResult != ERR_NOT_IN_RANGE && withdrawResult != "N/A") {
                        creep.travelTo(creep.room.terminal, {
                            maxRooms: 1,
                            ignoreRoads: true
                        });
                        creep.memory.movingOtherMineral = true;
                        foundWork = true;
                    }
                }
            }

            if (!foundWork && Memory.mineralList[creep.room.name].length) {
                //Haul from the mineral miner's storage unit
                let thisMineral = Game.getObjectById(Memory.mineralList[creep.room.name][0]);
                let nearbyContainer = thisMineral.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: (structure) => structure.structureType == STRUCTURE_CONTAINER
                });
                if (nearbyContainer.length && _.sum(nearbyContainer[0].store) >= creep.carryCapacity) {
                    let withdrawResult = "N/A"
                    for (let i = 0, len = Object.keys(nearbyContainer[0].store).length; i < len; i++) {
                        if (Object.keys(nearbyContainer[0].store)[i] == RESOURCE_ENERGY) {
                            if (nearbyContainer[0].store[RESOURCE_ENERGY] >= creep.carryCapacity) {
                                withdrawResult = creep.withdraw(nearbyContainer[0], Object.keys(nearbyContainer[0].store)[i]);
                                break;
                            }
                        } else {
                            withdrawResult = creep.withdraw(nearbyContainer[0], Object.keys(nearbyContainer[0].store)[i]);
                            break;
                        }
                    }
                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                        creep.travelTo(nearbyContainer[0], {
                            maxRooms: 1,
                            ignoreRoads: true
                        });
                        foundWork = true;
                    } else if (withdrawResult != ERR_NOT_IN_RANGE && withdrawResult != "N/A") {
                        creep.travelTo(creep.room.terminal, {
                            maxRooms: 1,
                            ignoreRoads: true
                        });
                        creep.memory.movingOtherMineral = true;
                        foundWork = true;
                    }
                }
            }

            if (!foundWork && creep.room.controller.level == 8 && Memory.nukerList[creep.room.name].length) {
                //Fill the nuker
                var thisNuker = Game.getObjectById(Memory.nukerList[creep.room.name][0])
                if (thisNuker && thisNuker.ghodiumCapacity > thisNuker.ghodium && !creep.carry[RESOURCE_GHODIUM] && creep.room.terminal.store[RESOURCE_GHODIUM]) {
                    creep.memory.structureTarget = creep.room.terminal.id;
                    creep.memory.direction = 'Withdraw';
                    creep.memory.mineralToMove = RESOURCE_GHODIUM;
                    foundWork = true;
                } else if (thisNuker && thisNuker.ghodiumCapacity > thisNuker.ghodium && creep.carry[RESOURCE_GHODIUM]) {
                    creep.memory.structureTarget = thisNuker.id;
                    creep.memory.direction = 'Transfer';
                    creep.memory.mineralToMove = RESOURCE_GHODIUM;
                    foundWork = true;
                } else if (thisNuker && thisNuker.ghodiumCapacity == thisNuker.ghodium && creep.carry[RESOURCE_GHODIUM]) {
                    creep.memory.structureTarget = creep.room.terminal.id;
                    creep.memory.direction = 'Transfer';
                    creep.memory.mineralToMove = RESOURCE_GHODIUM;
                    foundWork = true;
                }
            }

            if (!foundWork && !Game.flags[creep.room.name + "RoomOperator"]) {
                //creep.memory.offlineUntil = Game.time + 10;
                creep.memory.previousPriority = 'labWorker';
                creep.memory.priority = 'distributor';
                creep.memory.hasDistributed = false;
            }

            //Determine if this creep needs to move over
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

            if (Game.flags[creep.room.name + "RoomOperator"]) {
                talkingCreeps = creep.pos.findInRange(FIND_MY_POWER_CREEPS, 1, {
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
};

function orderPriceCompareBuying(a, b) {
    if (a.price < b.price)
        return -1;
    if (a.price > b.price)
        return 1;
    return 0;
}

function NotOverLimit(thisTerminal) {
    //Determines if there's too many unsold bars in the terminal
    if (thisTerminal.store[RESOURCE_UTRIUM_BAR] && thisTerminal.store[RESOURCE_UTRIUM_BAR] >= 10000) {
        return false;
    } else if (thisTerminal.store[RESOURCE_LEMERGIUM_BAR] && thisTerminal.store[RESOURCE_LEMERGIUM_BAR] >= 10000) {
        return false;
    } else if (thisTerminal.store[RESOURCE_ZYNTHIUM_BAR] && thisTerminal.store[RESOURCE_ZYNTHIUM_BAR] >= 10000) {
        return false;
    } else if (thisTerminal.store[RESOURCE_KEANIUM_BAR] && thisTerminal.store[RESOURCE_KEANIUM_BAR] >= 10000) {
        return false;
    } else if (thisTerminal.store[RESOURCE_OXIDANT] && thisTerminal.store[RESOURCE_OXIDANT] >= 10000) {
        return false;
    } else if (thisTerminal.store[RESOURCE_REDUCTANT] && thisTerminal.store[RESOURCE_REDUCTANT] >= 10000) {
        return false;
    } else if (thisTerminal.store[RESOURCE_PURIFIER] && thisTerminal.store[RESOURCE_PURIFIER] >= 10000) {
        return false;
    } else {
        return true;
    }
}

module.exports = creep_labWorker;