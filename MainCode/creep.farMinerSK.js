var creep_farMinerSK = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'farMinerNearDeath') {
            creep.memory.priority = 'farMinerNearDeath';
        }

        var hostiles = [];

        if (creep.hits < creep.hitsMax) {
            hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                filter: (creep) => (creep.getActiveBodyparts(WORK) > 0 || creep.getActiveBodyparts(CARRY) > 0 || creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0 || creep.getActiveBodyparts(HEAL) > 0) || (creep.hits <= 500)
            });
            creep.heal(creep);
        }

        if (creep.hits < 400 && Game.flags[creep.memory.targetFlag].room.name == creep.room.name) {
            //Determine if attacker is player, if so, delete flag.
            let targetTime = Game.time + 1500;
            if (hostiles.length > 0 && hostiles[0].owner.username != 'Invader' && hostiles[0].owner.username != 'Source Keeper' && Game.flags[creep.memory.targetFlag]) {
                Game.notify(creep.memory.tragetFlag + ' was removed due to an attack by ' + hostiles[0].owner.username);
                if (!Memory.warMode) {
                    Memory.warMode = true;
                    Game.notify('War mode has been enabled.');
                }
                //creep.room.createFlag(Game.flags[creep.memory.targetFlag].pos, creep.memory.targetFlag + ";" + targetTime.toString());
                //Game.flags[creep.memory.targetFlag].remove();
            } else if (hostiles.length > 0 && hostiles[0].owner.username == 'Invader') {
                //If there are no remaning allies, then the miners lost to an invasion. Time out all flags in this room for 1500 ticks.
                let farMiners = creep.room.find(FIND_MY_CREEPS, {
                    filter: (mCreep) => ((mCreep.memory.priority == 'farMiner' || mCreep.memory.priority == 'farMinerNearDeath') && mCreep.memory.jobSpecific == 'SKMiner' && mCreep.id != creep.id)
                })
                if (!farMiners.length) {
                    if (Game.flags[thisRoom.name + "FarMining"] && Game.flags[thisRoom.name + "FarMining"].pos.roomName == creep.pos.roomName) {
                        //creep.room.createFlag(Game.flags[thisRoom.name + "FarMining"].pos, thisRoom.name + "FarMining" + ";" + targetTime.toString());
                        //Game.flags[thisRoom.name + "FarMining"].remove();
                    }
                    for (i = 2; i < 10; i++) {
                        if (Game.flags[thisRoom.name + "FarMining" + i.toString()] && Game.flags[thisRoom.name + "FarMining" + i.toString()].pos.roomName == creep.pos.roomName) {
                            //creep.room.createFlag(Game.flags[thisRoom.name + "FarMining" + i.toString()].pos, thisRoom.name + "FarMining" + i.toString() + ";" + targetTime.toString());
                            //Game.flags[thisRoom.name + "FarMining" + i.toString()].remove();
                        }
                    }
                }
            }
        }


        var isEvading = false;
        //Memory.SKRoomsUnderAttack
        var Foe = [];
        let eCores = undefined;

        if (Game.time % 5 == 0) {
            Foe = creep.room.find(FIND_HOSTILE_CREEPS, {
                filter: (eCreep) => (!Memory.whiteList.includes(eCreep.owner.username) && eCreep.owner.username != "Source Keeper")
            });

            eCores = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                filter: (eStruct) => (eStruct.owner.username == 'Invader')
            })

            if (eCores && eCores.effects) {
                //Hostile core is active, shut down operations until timer is up.
                for (let thisPower in eCores.effects) {
                    if (eCores.effects[thisPower].effect == EFFECT_COLLAPSE_TIMER && Game.flags[creep.memory.targetFlag]) {
                        let targetTime = Game.time + eCores.effects[thisPower].ticksRemaining;
                        creep.room.createFlag(Game.flags[creep.memory.targetFlag].pos, creep.memory.targetFlag + ";" + targetTime.toString());
                        Game.flags[creep.memory.targetFlag].remove();                        
                    }
                }
            }

            if (Foe.length && Memory.SKRoomsUnderAttack.indexOf(creep.room.name) == -1) {
                Memory.SKRoomsUnderAttack.push(creep.room.name);
            } else if (!Foe.length && Memory.SKRoomsUnderAttack.indexOf(creep.room.name) != -1) {
                var UnderAttackPos = Memory.SKRoomsUnderAttack.indexOf(creep.room.name);
                if (UnderAttackPos >= 0) {
                    Memory.SKRoomsUnderAttack.splice(UnderAttackPos, 1);
                }
            }
        }

        if (Memory.SKRoomsUnderAttack.indexOf(creep.room.name) != -1) {
            isEvading = attackInvader(creep);
        } else {
            isEvading = evadeAttacker(creep, 2);
        }

        if (!isEvading) {
            if (creep.room.name != creep.memory.destination) {
                if (Game.flags[creep.memory.targetFlag + "Here"] && Game.flags[creep.memory.targetFlag + "Here"].pos) {
                    creep.travelTo(Game.flags[creep.memory.targetFlag + "Here"]);
                } else if (Game.flags[creep.memory.targetFlag] && Game.flags[creep.memory.targetFlag].pos) {
                    creep.travelTo(Game.flags[creep.memory.targetFlag]);
                } else {
                    creep.travelTo(new RoomPosition(25, 25, creep.memory.destination));
                }
            } else {
                if (!Memory.SKMineralTimers[creep.room.name]) {
                    Memory.SKMineralTimers[creep.room.name] = 0;
                }

                var mineTarget = undefined;
                var thisUnit = undefined;

                if (creep.memory.storageUnit) {
                    thisUnit = Game.getObjectById(creep.memory.storageUnit);
                }

                if (creep.memory.mineSource) {
                    mineTarget = Game.getObjectById(creep.memory.mineSource);
                    var StorageOK = true;
                    if (thisUnit && thisUnit.store.getFreeCapacity() <= 0) {
                        StorageOK = false;
                    }
                    if (mineTarget && mineTarget.energy > 0 && StorageOK) {
                    	let harvestResult = creep.harvest(mineTarget)
                    	if (Game.flags[creep.memory.targetFlag + "Here"]) {
                            creep.travelTo(Game.flags[creep.memory.targetFlag + "Here"]);
                        } else if (harvestResult == ERR_NOT_IN_RANGE) {
                            creep.travelTo(Game.flags[creep.memory.targetFlag])
                        }                      
                    } else if (Game.flags[creep.memory.targetFlag + "Here"] && mineTarget) {
                        creep.travelTo(Game.flags[creep.memory.targetFlag + "Here"]);
                    } else if (mineTarget && !creep.pos.isNearTo(mineTarget)) {
                        creep.travelTo(Game.flags[creep.memory.targetFlag]);
                    }
                } else {
                    //Get the source ID while in the room
                    var markedSources = [];
                    if (Game.flags[creep.memory.targetFlag]) {
                        markedSources = Game.flags[creep.memory.targetFlag].pos.lookFor(LOOK_SOURCES);
                    }
                    if (markedSources.length) {
                        creep.memory.mineSource = markedSources[0].id;
                    }
                    mineTarget = Game.getObjectById(creep.memory.mineSource);
                    if (mineTarget) {
                        if (creep.harvest(mineTarget) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(Game.flags[creep.memory.targetFlag]);
                        }
                    }
                }

                if (thisUnit) {
                    if (thisUnit.hits < thisUnit.hitsMax && hostiles.length == 0) {
                        creep.repair(thisUnit);
                    }
                } else {
                    if (mineTarget) {
                        if (creep.pos.inRangeTo(mineTarget, 2)) {
                            var containers = creep.pos.findInRange(FIND_STRUCTURES, 2, {
                                filter: (structure) => structure.structureType == STRUCTURE_CONTAINER
                            });
                            if (containers.length) {
                                if (creep.transfer(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(containers[0]);
                                }
                                creep.memory.storageUnit = containers[0].id;
                            } else {
                                if (creep.carry[RESOURCE_ENERGY] >= 36) {
                                    var sites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 2)
                                    var nearFoe = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                                        filter: (eCreep) => (!Memory.whiteList.includes(eCreep.owner.username))
                                    });
                                    if (sites.length && !nearFoe.length) {
                                        if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
                                            creep.travelTo(sites[0]);
                                        }
                                    } else if (!sites.length && !nearFoe.length) {
                                        //Create new container
                                        if (creep.pos.isNearTo(mineTarget)) {                                         
                                            creep.room.createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_CONTAINER);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

function evadeAttacker(creep, evadeRange) {
    var Foe = undefined;
    var closeFoe = undefined;
    var didRanged = false;

    closeFoe = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
        filter: (eCreep) => (!Memory.whiteList.includes(eCreep.owner.username))
    });
    Foe = creep.pos.findInRange(FIND_HOSTILE_CREEPS, evadeRange, {
        filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0 || eCreep.getActiveBodyparts(HEAL) > 0) && !Memory.whiteList.includes(eCreep.owner.username))
    });
    if (Foe.length > 1) {
        creep.rangedMassAttack();
        didRanged = true;
    } else if (closeFoe) {
        if (creep.rangedAttack(closeFoe) == OK) {
            didRanged = true;
        }
    }

    if (creep.hits < creep.hitsMax) {
        creep.heal(creep);
    } else {
        var hurtAlly = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
            filter: (thisCreep) => thisCreep.hits < thisCreep.hitsMax
        });
        if (hurtAlly.length > 0) {
            if (creep.pos.getRangeTo(hurtAlly[0]) > 1 && !didRanged) {
                creep.rangedHeal(hurtAlly[0]);
            } else {
                creep.heal(hurtAlly[0]);
            }
        }
    }

    if (Foe.length) {
        if (!closeFoe) {
            closeFoe = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0) && !Memory.whiteList.includes(eCreep.owner.username))
            });
        }
        var foeDirection = creep.pos.getDirectionTo(closeFoe);
        var y = 0;
        var x = 0;
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

        return true;
    }

    return didRanged;
}

function attackInvader(creep) {
    var Foe = undefined;
    var closeFoe = undefined;
    var didRanged = false;
    let eCore = undefined;

    if (_.sum(creep.carry) <= 40) {
        creep.drop(RESOURCE_ENERGY);
    }

    closeFoe = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
        filter: (eCreep) => (!Memory.whiteList.includes(eCreep.owner.username) && eCreep.owner.username != "Source Keeper")
    });
    Foe = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
        filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0 || eCreep.getActiveBodyparts(HEAL) > 0) && !Memory.whiteList.includes(eCreep.owner.username))
    });
    eCore = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: (eStruct) => (eStruct.owner.username == 'Invader')
    })

    if (Foe.length > 1) {
        Foe.sort(targetHeal);
        creep.rangedMassAttack();
        didRanged = true;
    } else if (Foe.length) {
        if (creep.rangedAttack(Foe[0]) == OK) {
            didRanged = true;
        }
    } else {
        if (creep.rangedAttack(closeFoe) == OK) {
            didRanged = true;
        }
    }

    if (!didRanged && eCore && creep.rangedAttack(eCore) == OK) {
        didRanged = true;
    }

    if (creep.hits < creep.hitsMax) {
        creep.heal(creep);
    } else {
        var hurtAlly = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
            filter: (thisCreep) => thisCreep.hits < thisCreep.hitsMax
        });
        if (hurtAlly.length > 0) {
            if (creep.pos.getRangeTo(hurtAlly[0]) > 1 && !didRanged) {
                creep.rangedHeal(hurtAlly[0]);
            } else {
                creep.heal(hurtAlly[0]);
            }
        }
    }

    var SKCheck = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
        filter: (eCreep) => (eCreep.owner.username == "Source Keeper")
    });
    if (SKCheck.length) {
        var foeDirection = creep.pos.getDirectionTo(SKCheck[0]);
        var y = 0;
        var x = 0;
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
        return true;
    } else if (closeFoe) {
        if (Foe.length) {
            creep.travelTo(Foe[0], {
                maxRooms: 1
            });
        } else {
            creep.travelTo(closeFoe, {
                maxRooms: 1
            });
        }

        return true;
    } else if (eCore) {
        creep.travelTo(eCore, {
            maxRooms: 1
        });

        return true;
    } else {
        return false;
    }
}

function targetHeal(a, b) {
    if (a.getActiveBodyparts(HEAL) > b.getActiveBodyparts(HEAL))
        return -1;
    if (a.getActiveBodyparts(HEAL) < b.getActiveBodyparts(HEAL))
        return 1;
    return 0;
}

module.exports = creep_farMinerSK;