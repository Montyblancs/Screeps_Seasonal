var creep_assattacker = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'assattackerNearDeath') {
            creep.memory.priority = 'assattackerNearDeath';
        }

        let targetFlag = Game.flags[creep.memory.homeRoom + "Assault"];
        if (!targetFlag) {
            for (j = 2; j < 6; j++) {
                targetFlag = Game.flags[creep.memory.homeRoom + "Assault" + j]
                if (targetFlag) {
                    break;
                }
            }
        }

        if (targetFlag) {
            var unboostedTough = 0;
            var unboostedAttack = 0;
            var unboostedMove = 0;
            var unboostedWork = 0;
            var unboostedRanged = 0;
            var unboostedHeal = 0;

            creep.body.forEach(function(thisPart) {
                if (thisPart.type == ATTACK && !thisPart.boost) {
                    unboostedAttack = unboostedAttack + 1;
                } else if (thisPart.type == TOUGH && !thisPart.boost) {
                    unboostedTough = unboostedTough + 1;
                } else if (thisPart.type == MOVE && !thisPart.boost) {
                    unboostedMove = unboostedMove + 1;
                } else if (thisPart.type == WORK && !thisPart.boost) {
                    unboostedWork = unboostedWork + 1;
                } else if (thisPart.type == RANGED_ATTACK && !thisPart.boost) {
                    unboostedRanged = unboostedRanged + 1;
                } else if (thisPart.type == HEAL && !thisPart.boost) {
                    unboostedHeal = unboostedHeal + 1;
                }
            });

            if (creep.memory.previousRoom != creep.room.name) {
                creep.memory.previousRoom = creep.room.name;
                creep.memory._trav = undefined;
            }

            let wallFlag = Game.flags[creep.memory.homeRoom + "WallFlag"];
            if (!wallFlag) {
                for (i = 2; i < 6; i++) {
                    wallFlag = Game.flags[creep.memory.homeRoom + "WallFlag" + i]
                    if (wallFlag) {
                        break;
                    }
                }
            }

            if (!creep.memory.healerID && !creep.spawning) {
                let nearbyHealer = creep.pos.findInRange(FIND_MY_CREEPS, 2, {
                    filter: (mCreep) => (mCreep.memory.priority == "asshealer" && mCreep.memory.attackerID == creep.id)
                });
                if (nearbyHealer.length) {
                    creep.memory.healerID = nearbyHealer[0].id;
                    creep.memory.isReserved = true;
                }
            }

            let closeFoe = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                filter: (eCreep) => (!Memory.whiteList.includes(eCreep.owner.username) && eCreep.owner.username != "KamiKatze")
            });
            let closePFoe = creep.pos.findClosestByPath(FIND_HOSTILE_POWER_CREEPS, {
                filter: (eCreep) => (!Memory.whiteList.includes(eCreep.owner.username) && eCreep.owner.username != "KamiKatze")
            });

            let otherHealers = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                filter: (mCreep) => ((mCreep.memory.priority == "asshealer" || mCreep.memory.priority == "targetlessHealer" || mCreep.memory.priority == "asshealerNearDeath") && mCreep.memory.attackerID == creep.id)
            });
            let healerIsNear = false;
            let healerIsGood = false;
            if (otherHealers.length) {
                healerIsNear = true;
                if (otherHealers[0].fatigue <= 0) {
                    healerIsGood = true;
                }
            }

            if (Game.flags[creep.memory.homeRoom + "WallBreaker"]) {
                //Seasonal override - no healer needed
                healerIsNear = true;
                healerIsGood = true;
            }

            if (Game.flags[creep.memory.homeRoom + "DoBoost"] && creep.pos.roomName == creep.memory.homeRoom && (unboostedMove > 0 || unboostedTough > 0 || unboostedAttack > 0 || unboostedWork > 0 || unboostedRanged > 0 || unboostedHeal > 0)) {
                let MoveLab = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_LAB && structure.mineralType == RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE)
                });
                let ToughLab = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_LAB && structure.mineralType == RESOURCE_CATALYZED_GHODIUM_ALKALIDE)
                });
                let AttackLab = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_LAB && structure.mineralType == RESOURCE_CATALYZED_UTRIUM_ACID)
                });
                let WorkLab = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_LAB && structure.mineralType == RESOURCE_CATALYZED_ZYNTHIUM_ACID)
                });
                let RangedLab = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_LAB && structure.mineralType == RESOURCE_CATALYZED_KEANIUM_ALKALIDE)
                });
                let HealLab = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_LAB && structure.mineralType == RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE)
                });
                let hasTraveled = false;
                let result;
                if (MoveLab.length && unboostedMove > 0) {
                    result = MoveLab[0].boostCreep(creep);
                    creep.travelTo(MoveLab[0]);
                    hasTraveled = true;
                    if (result == ERR_NOT_ENOUGH_RESOURCES && MoveLab[0].energy >= 1000) {
                        if (Game.flags[creep.memory.homeRoom + "RunningAssault"]) {
                            Game.flags[creep.memory.homeRoom + "RunningAssault"].remove();
                            console.log(creep.memory.homeRoom + " Labs are dry");
                        }
                    }
                }
                if (ToughLab.length && unboostedTough > 0) {
                    if (!hasTraveled) {
                        creep.travelTo(ToughLab[0], {
                            ignoreRoads: true
                        });
                        hasTraveled = true;
                    }
                    result = ToughLab[0].boostCreep(creep);
                    if (result == ERR_NOT_ENOUGH_RESOURCES && ToughLab[0].energy >= 1000) {
                        if (Game.flags[creep.memory.homeRoom + "RunningAssault"]) {
                            Game.flags[creep.memory.homeRoom + "RunningAssault"].remove();
                            console.log(creep.memory.homeRoom + " Labs are dry");
                        }
                    }
                }
                if (RangedLab.length && unboostedRanged > 0) {
                    if (!hasTraveled) {
                        creep.travelTo(RangedLab[0], {
                            ignoreRoads: true
                        });
                        hasTraveled = true;
                    }
                    result = RangedLab[0].boostCreep(creep);
                    if (result == ERR_NOT_ENOUGH_RESOURCES && RangedLab[0].energy >= 1000) {
                        if (Game.flags[creep.memory.homeRoom + "RunningAssault"]) {
                            Game.flags[creep.memory.homeRoom + "RunningAssault"].remove();
                            console.log(creep.memory.homeRoom + " Labs are dry");
                        }
                    }
                }
                if (AttackLab.length && unboostedAttack > 0) {
                    if (!hasTraveled) {
                        creep.travelTo(AttackLab[0], {
                            ignoreRoads: true
                        });
                        hasTraveled = true;
                    }
                    result = AttackLab[0].boostCreep(creep);
                    if (result == ERR_NOT_ENOUGH_RESOURCES && AttackLab[0].energy >= 1000) {
                        if (Game.flags[creep.memory.homeRoom + "RunningAssault"]) {
                            Game.flags[creep.memory.homeRoom + "RunningAssault"].remove();
                            console.log(creep.memory.homeRoom + " Labs are dry");
                        }
                    }
                }
                if (WorkLab.length && unboostedWork > 0) {
                    if (!hasTraveled) {
                        creep.travelTo(WorkLab[0], {
                            ignoreRoads: true
                        });
                        hasTraveled = true;
                    }
                    result = WorkLab[0].boostCreep(creep);
                    if (result == ERR_NOT_ENOUGH_RESOURCES && WorkLab[0].energy >= 1000) {
                        if (Game.flags[creep.memory.homeRoom + "RunningAssault"]) {
                            Game.flags[creep.memory.homeRoom + "RunningAssault"].remove();
                            console.log(creep.memory.homeRoom + " Labs are dry");
                        }
                    }
                }
                if (HealLab.length && unboostedHeal > 0) {
                    if (!hasTraveled) {
                        creep.travelTo(HealLab[0], {
                            ignoreRoads: true
                        });
                        hasTraveled = true;
                    }
                    result = HealLab[0].boostCreep(creep);
                    if (result == ERR_NOT_ENOUGH_RESOURCES && HealLab[0].energy >= 1000) {
                        if (Game.flags[creep.memory.homeRoom + "RunningAssault"]) {
                            Game.flags[creep.memory.homeRoom + "RunningAssault"].remove();
                            console.log(creep.memory.homeRoom + " Labs are dry");
                        }
                    }
                }
                let talkingCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                    filter: (thisCreep) => (creep.id != thisCreep.id && thisCreep.saying)
                })
                if (talkingCreeps.length) {
                    let coords = talkingCreeps[0].saying.split(";");
                    if (creep.fatigue <= 0 && coords.length == 2 && creep.pos.x == parseInt(coords[0]) && creep.pos.y == parseInt(coords[1])) {
                        //Standing in the way of a creep
                        let thisDirection = creep.pos.getDirectionTo(talkingCreeps[0].pos);
                        creep.move(thisDirection);
                        creep.say("\uD83D\uDCA6", true);
                    }
                }
            } else {
                if (targetFlag.pos.roomName == creep.pos.roomName) {
                    //In target room

                    if (Game.time % 2 == 0) {
                        creep.say("(=\uFF40\u03C9\u00B4=)", true);
                    } else {
                        creep.say("(=\u00B4\u2207\uFF40=)", true);
                    }

                    //Cancel this flag if room is in safe mode
                    if (creep.room.controller && creep.room.controller.safeMode) {
                        targetFlag.remove();
                        return;
                    }

                    var didDismantle = false;
                    if (wallFlag && wallFlag.pos.roomName == creep.pos.roomName) {
                        var thisWall = wallFlag.pos.lookFor(LOOK_STRUCTURES);
                        if (thisWall.length && creep.pos.isNearTo(thisWall[0])) {
                            creep.dismantle(thisWall[0]);
                            creep.attack(thisWall[0]);
                            creep.rangedAttack(thisWall[0]);
                            didDismantle = true;
                        }
                        if (Game.flags[creep.memory.homeRoom + "WallBreaker"]) {
                            creep.travelTo(wallFlag)
                        }
                    }


                    if (!didDismantle) {
                        let searchRange = 1;
                        if (creep.rangedMassAttack() != ERR_NO_BODYPART) {
                            searchRange = 3;
                        }

                        var somethingNearby = creep.pos.findInRange(FIND_STRUCTURES, searchRange, {
                            filter: (structure) => (structure.structureType != STRUCTURE_ROAD && structure.structureType != STRUCTURE_STORAGE && structure.structureType != STRUCTURE_TERMINAL && structure.structureType != STRUCTURE_CONTROLLER)
                        });
                        if (somethingNearby.length) {
                            somethingNearby.sort(repairCompare);
                            creep.dismantle(somethingNearby[0]);
                            creep.attack(somethingNearby[0]);
                            creep.rangedAttack(somethingNearby[0]);
                            if (creep.pos.getRangeTo(somethingNearby[0]) == 1 && somethingNearby.structureType != STRUCTURE_WALL && somethingNearby.structureType != STRUCTURE_CONTAINER && somethingNearby.structureType != STRUCTURE_EXTENSION && somethingNearby.structureType != STRUCTURE_RAMPART) {
                                didDismantle = true;
                            }
                        }
                    }

                    //creep.rangedMassAttack();
                    if (creep.hits < creep.hitsMax - 500 && Game.flags[creep.memory.homeRoom + "FallBack"] && Game.flags[creep.memory.homeRoom + "FallBack"].pos) {
                        //Fall back
                        creep.travelTo(Game.flags[creep.memory.homeRoom + "FallBack"], {
                            ignoreRoads: true,
                            stuckValue: 2,
                            allowSK: true
                        });
                    } else if (!healerIsNear) {
                        if (creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49) {
                            let xTarget = 0;
                            let yTarget = 0;
                            if (creep.pos.x == 0) {
                                xTarget = 2;
                                yTarget = creep.pos.y;
                            } else if (creep.pos.x == 49) {
                                xTarget = 47;
                                yTarget = creep.pos.y;
                            }
                            if (creep.pos.y == 0) {
                                yTarget = 2;
                                xTarget = creep.pos.x;
                            } else if (creep.pos.y == 49) {
                                yTarget = 47;
                                xTarget = creep.pos.x;
                            }
                            creep.moveTo(xTarget, yTarget);
                        }
                    } else if (healerIsNear) {
                        if (wallFlag && wallFlag.pos.roomName == creep.pos.roomName) {
                            let thisWall = wallFlag.pos.lookFor(LOOK_STRUCTURES);
                            if (thisWall.length) {
                                if (healerIsGood && !didDismantle) {
                                    creep.travelTo(thisWall[0], {
                                        maxRooms: 1,
                                        stuckValue: 2,
                                        allowSK: true,
                                        ignoreRoads: true
                                    });
                                }
                                creep.dismantle(thisWall[0]);
                                creep.attack(thisWall[0]);
                                creep.rangedAttack(thisWall[0]);
                            } else {
                                wallFlag.remove();
                            }
                        } else {
                            //Find structures that don't have a rampart on them
                            /*let allStruct = creep.room.find(FIND_HOSTILE_STRUCTURES, {
                                filter: (structure) => (structure.structureType != STRUCTURE_CONTROLLER && structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART && structure.structureType != STRUCTURE_KEEPER_LAIR && structure.structureType != STRUCTURE_EXTRACTOR)
                            });*/
                            let targetFound = false;
                            /*if (allStruct.length) {
                                //Sort based on distance.
                                allStruct.sort(distCompare(creep));
                            }
                            for (let thisStruct in allStruct) {
                                let found = allStruct[thisStruct].pos.lookFor(LOOK_STRUCTURES);
                                let hasRampart = false;
                                for (var building in found) {
                                    if (found[building].structureType == STRUCTURE_RAMPART) {
                                        hasRampart = true;
                                        break;
                                    }
                                }
                                if (!hasRampart) {
                                    if (healerIsGood) {
                                        creep.travelTo(allStruct[thisStruct], {
                                            ignoreRoads: true,
                                            maxRooms: 1,
                                            stuckValue: 2,
                                            allowSK: true
                                        });
                                    }
                                    creep.dismantle(allStruct[thisStruct]);
                                    creep.attack(allStruct[thisStruct]);
                                    creep.rangedAttack(allStruct[thisStruct]);
                                    targetFound = true;
                                    break;
                                }
                            }*/
                            if (!targetFound) {
                                let eSpawns = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                                    filter: (structure) => (structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_INVADER_CORE)
                                });
                                if (eSpawns) {
                                    if (healerIsGood && !didDismantle) {
                                        creep.travelTo(eSpawns, {
                                            ignoreRoads: true,
                                            maxRooms: 1,
                                            stuckValue: 2,
                                            allowSK: true
                                        });
                                    }
                                    creep.dismantle(eSpawns);
                                    creep.attack(eSpawns);
                                    creep.rangedAttack(eSpawns);
                                } else {
                                    if (targetFlag) {
                                        //targetFlag.remove();
                                    }
                                    let eStructures = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                                        filter: (structure) => (structure.structureType != STRUCTURE_CONTROLLER && structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART && structure.structureType != STRUCTURE_KEEPER_LAIR && structure.structureType != STRUCTURE_EXTRACTOR && structure.structureType != STRUCTURE_STORAGE && structure.structureType != STRUCTURE_TERMINAL)
                                    });
                                    if (eStructures) {
                                        if (healerIsGood && !didDismantle) {
                                            creep.travelTo(eStructures, {
                                                ignoreRoads: true,
                                                maxRooms: 1,
                                                stuckValue: 2,
                                                allowSK: true
                                            });
                                        }
                                        creep.dismantle(eStructures);
                                        creep.attack(eStructures);
                                        creep.rangedAttack(eStructures);
                                    } else if (closeFoe && creep.attack(closeFoe) != ERR_NO_BODYPART) {
                                        creep.moveTo(closeFoe, {
                                            ignoreRoads: true,
                                            maxRooms: 1,
                                            allowSK: true
                                        });
                                    } else if (closePFoe && creep.attack(closePFoe) != ERR_NO_BODYPART) {
                                    	creep.moveTo(closePFoe, {
                                            ignoreRoads: true,
                                            maxRooms: 1,
                                            allowSK: true
                                        });
                                    } else if (targetFlag) {
                                        targetFlag.remove();
                                    }
                                }
                            }
                        }
                    }

                    if (Game.flags[creep.memory.homeRoom + "WallBreaker"]) {
                    	//Move out of the way for boosted units
                    	if (wallFlag && wallFlag.pos.roomName == creep.pos.roomName && creep.pos.isNearTo(wallFlag)) {
							let helpers = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
	                    		filter: (creep) => (creep.getActiveBodyparts(WORK) > 0 && creep.body[0].boost)
	                		});
	                		if (helpers.length) {
	                			creep.travelTo(Game.flags[creep.memory.homeRoom + "Assault"]);
	                		}
                    	}          	
            		}
                } else if (!healerIsNear) {
                    if (creep.memory.getOutOfStartRoom) {
                        var thisPortal = undefined;
                        if (Game.flags["TakePortal"] && Game.flags["TakePortal"].pos.roomName == creep.pos.roomName) {
                            var thisPortal = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                                filter: (structure) => (structure.structureType == STRUCTURE_PORTAL)
                            });
                        }
                        if (thisPortal) {
                            creep.memory.destination = undefined;
                            creep.memory.usedPortal = true;
                            creep.travelTo(thisPortal);
                        } else if (creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49) {
                            var xTarget = 0;
                            var yTarget = 0;
                            if (creep.pos.x == 0) {
                                xTarget = 2;
                                yTarget = creep.pos.y;
                            } else if (creep.pos.x == 49) {
                                xTarget = 47;
                                yTarget = creep.pos.y;
                            }
                            if (creep.pos.y == 0) {
                                yTarget = 2;
                                xTarget = creep.pos.x;
                            } else if (creep.pos.y == 49) {
                                yTarget = 47;
                                xTarget = creep.pos.x;
                            }
                            creep.moveTo(xTarget, yTarget);
                        }
                    } else if (Game.flags[creep.memory.homeRoom + "RallyHere"] && Game.flags[creep.memory.homeRoom + "RallyHere"].pos) {
                        creep.travelTo(Game.flags[creep.memory.homeRoom + "RallyHere"], {
                            ignoreRoads: true
                        });
                    }
                } else if (healerIsNear) {
                    if (!creep.memory.getOutOfStartRoom) {
                        creep.memory.getOutOfStartRoom = true;
                    }
                    if (creep.memory.usedPortal == undefined) {
                        creep.memory.usedPortal = false
                    }
                    if (Game.flags["TakePortal"] && Game.flags["TakePortal"].pos.roomName != creep.pos.roomName) {
                        creep.memory.destination = Game.flags["TakePortal"].pos.roomName;
                    }

                    var thisPortal = undefined;
                    if (Game.flags["TakePortal"] && Game.flags["TakePortal"].pos.roomName == creep.pos.roomName) {
                        var thisPortal = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => (structure.structureType == STRUCTURE_PORTAL)
                        });
                    }
                    if (thisPortal) {
                        creep.memory.destination = undefined;
                        creep.memory.usedPortal = true;
                        if (creep.memory.path && creep.memory.path.length && creep.memory.path[0] == creep.room.name) {
                            creep.memory.path.splice(0, 1);
                        }
                        if (healerIsGood) {
                            creep.travelTo(thisPortal, {
                                ignoreRoads: true
                            });
                        }
                    } else if (targetFlag.pos.roomName != creep.pos.roomName) {
                        /*if (creep.memory.destination && !creep.memory.usedPortal) {
                            creep.travelTo(new RoomPosition(25, 25, creep.memory.destination))
                        } else*/
                        if (Game.flags[creep.memory.homeRoom + "GroupHere"] && Game.flags[creep.memory.homeRoom + "GroupHere"].pos.roomName == creep.pos.roomName && !creep.memory.isGrouped) {
                            if (healerIsGood) {
                                creep.travelTo(Game.flags[creep.memory.homeRoom + "GroupHere"], {
                                    stuckValue: 2,
                                    allowSK: true,
                                    preferHighway: true
                                });
                            }

                            let nearbyAlly = creep.pos.findInRange(FIND_MY_CREEPS, 2, {
                                filter: (mCreep) => ((mCreep.memory.priority == 'assattacker' || mCreep.memory.priority == 'assranger') && mCreep.id != creep.id)
                            });
                            if (nearbyAlly.length) {
                                creep.memory.isGrouped = true;
                            }
                        } else if (creep.memory.path && creep.memory.path.length) {
                            if (creep.memory.path[0] == creep.room.name) {
                                creep.memory.path.splice(0, 1);
                            }
                            if (healerIsGood) {
                                creep.travelTo(new RoomPosition(25, 25, creep.memory.path[0]), {
                                    stuckValue: 2,
                                    allowSK: true
                                });
                            }
                        } else if (targetFlag.pos) {
                            if (wallFlag && wallFlag.pos && wallFlag.pos.roomName == targetFlag.pos.roomName) {
                                if (healerIsGood) {
                                    creep.travelTo(wallFlag, {
                                        stuckValue: 2,
                                        allowSK: true,
                                        preferHighway: true
                                    });
                                }
                            } else {
                                if (healerIsGood) {
                                    creep.travelTo(targetFlag, {
                                        stuckValue: 2,
                                        allowSK: true,
                                        preferHighway: true
                                    });
                                }
                            }
                        } else {
                            if (healerIsGood) {
                                creep.travelTo(new RoomPosition(25, 25, targetFlag.pos.roomName), {
                                    stuckValue: 2,
                                    allowSK: true,
                                    preferHighway: true
                                });
                            }
                        }

                        if (!creep.memory.travelDistance && creep.memory._trav && creep.memory._trav.path) {
                            creep.memory.travelDistance = creep.memory._trav.path.length;
                            creep.memory.deathWarn = (creep.memory.travelDistance + _.size(creep.body) * 3) + 15;
                        }
                    }
                }
            }

            if (closeFoe) {
                var lookResult = closeFoe.pos.lookFor(LOOK_STRUCTURES);
                let inRampart = false;
                if (lookResult.length) {
                    for (let d = 0; d < lookResult.length; d++) {
                        if (lookResult[d].structureType == STRUCTURE_RAMPART) {
                            inRampart = true;
                            break;
                        }
                    }
                    if (inRampart) {
                        creep.rangedMassAttack();
                    } else {
                        creep.rangedAttack(closeFoe);
                        creep.attack(closeFoe);
                    }
                } else {
                    creep.rangedAttack(closeFoe);
                    creep.attack(closeFoe);
                }
            }
            if (closePFoe) {
            	var lookResult = closePFoe.pos.lookFor(LOOK_STRUCTURES);
                let inRampart = false;
                if (lookResult.length) {
                    for (let d = 0; d < lookResult.length; d++) {
                        if (lookResult[d].structureType == STRUCTURE_RAMPART) {
                            inRampart = true;
                            break;
                        }
                    }
                    if (inRampart) {
                        creep.rangedMassAttack();
                    } else {
                        creep.rangedAttack(closePFoe);
                        creep.attack(closePFoe);
                    }
                } else {
                    creep.rangedAttack(closePFoe);
                    creep.attack(closePFoe);
                }
            }
        } else {
            if (Game.flags[creep.memory.homeRoom + "RunningAssault"]) {
                Game.flags[creep.memory.homeRoom + "RunningAssault"].remove();
                console.log(creep.memory.homeRoom + " unable to find any more marks.");
            }
            //Dance party!
            if (Game.time % 2 == 0) {
                creep.say("\u{266A}~ \u{1555}( \u{141B} )\u{1557}", true);
            } else {
                creep.say("\u{669}( \u{141B} )\u{648} ~\u{266A}", true);
            }
            let otherHealers = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                filter: (mCreep) => ((mCreep.memory.priority == "asshealer" || mCreep.memory.priority == "targetlessHealer" || mCreep.memory.priority == "asshealerNearDeath") && mCreep.memory.attackerID == creep.id)
            });
            if (otherHealers.length) {
                creep.moveTo(otherHealers[0]);
            }
        }

        let targetHealer = undefined;
        if (creep.memory.healerID) {
            targetHealer = Game.getObjectById(creep.memory.healerID);
        }
        if (creep.hits < creep.hitsMax - 100) {
            creep.heal(creep);
        } else if (targetHealer && targetHealer.hits < targetHealer.hitsMax - 500) {
            creep.heal(targetHealer);
        }
    }

};

function distCompare(creep) {
    return function(a, b) {
        let aRange = a.pos.getRangeTo(creep);
        let bRange = b.pos.getRangeTo(creep);
        if (aRange < bRange)
            return -1;
        if (aRange > bRange)
            return 1;
        return 0;
    }
}

function repairCompare(a, b) {
    if (a.hits < b.hits)
        return -1;
    if (a.hits > b.hits)
        return 1;
    return 0;
}

module.exports = creep_assattacker;