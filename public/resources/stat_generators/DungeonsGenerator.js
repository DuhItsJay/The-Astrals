const weights = require('../../resources/constants/weight').dungeonsWeight
const DungeonsExperience = require('../../resources/constants/leveling').dungeoneering_xp
const time = require('../../resources/utils/time')

let level50Experience = 569809640

  function hasDungeonData(dungeons) {
    return (
      dungeons != undefined &&
      dungeons.player_classes != undefined &&
      dungeons.dungeon_types != undefined &&
      dungeons.dungeon_types.catacombs != undefined &&
      dungeons.dungeon_types.catacombs.experience != undefined &&
      dungeons.dungeon_types.catacombs.tier_completions != undefined
    )
  }

  function buildDungeonTypeProperties(type, dungeon, masterDungeon) {
    const dungeon_xp = dungeon.experience || 0
    
    const level = calculateLevel(dungeon_xp)


    const dungeonResult = {
      level: level,
      experience: dungeon_xp,
      ...calculateWeight(type, level, dungeon_xp),
      highest_tier_completed: dungeon.highest_tier_completed,
      times_played: formatDungeonStatsGroup(dungeon.times_played),
      tier_completions: formatDungeonStatsGroup(dungeon.tier_completions),
      best_score: formatDungeonStatsGroup(dungeon.best_score),
      fastest_time: formatDungeonStatsGroup(dungeon.fastest_time),
      fastest_time_s_plus: formatDungeonStatsGroup(dungeon.fastest_time_s_plus),
      mobs_killed: formatDungeonStatsGroup(dungeon.mobs_killed),
      most_mobs_killed: formatDungeonStatsGroup(dungeon.most_mobs_killed),

      master_mode: {
        highest_tier_completed: masterDungeon?.highest_tier_completed || 0,
        tier_completions: formatDungeonStatsGroup(masterDungeon?.tier_completions),
        best_score: formatDungeonStatsGroup(masterDungeon?.best_score),
        fastest_time: formatDungeonStatsGroup(masterDungeon?.fastest_time),
        fastest_time_s_plus: formatDungeonStatsGroup(masterDungeon?.fastest_time_s_plus),
        mobs_killed: formatDungeonStatsGroup(masterDungeon?.mobs_killed),
        most_mobs_killed: formatDungeonStatsGroup(masterDungeon?.most_mobs_killed),
      }
    }

    dungeonResult.best_score = formatDungeonScores(dungeonResult.best_score)
    dungeonResult.fastest_time = formatDungeonsTime(dungeonResult.fastest_time)
    dungeonResult.fastest_time_s_plus = formatDungeonsTime(dungeonResult.fastest_time_s_plus)

    dungeonResult.master_mode.best_score = formatDungeonScores(dungeonResult.master_mode.best_score)
    dungeonResult.master_mode.fastest_time = formatDungeonsTime(dungeonResult.master_mode.fastest_time)
    dungeonResult.master_mode.fastest_time_s_plus = formatDungeonsTime(dungeonResult.master_mode.fastest_time_s_plus)

    return dungeonResult
  }

  function formatDungeonStatsGroup(group) {
    let result = {}

    if (group == undefined) {
      return result
    }

    for (let key of Object.keys(group)) {
      if (key == '0') {
        result['entrance'] = group[key]
      } else {
        result[`tier_${key}`] = group[key]
      }
    }

    return result
  }

  function formatDungeonScores(scores) {
    for (let key of Object.keys(scores)) {
      let value = scores[key]
      let score = 'C'

      if (value >= 300) {
        score = 'S+'
      } else if (value >= 270) {
        score = 'S'
      } else if (value >= 240) {
        score = 'A'
      } else if (value >= 175) {
        score = 'B'
      }

      scores[key] = {
        value,
        score,
      }
    }

    return scores
  }

  function formatDungeonsTime(times) {
    for (let key of Object.keys(times)) {
      let seconds = times[key] / 1000

      times[key] = {
        time: time.humanizeTime(seconds),
        seconds,
      }
    }

    return times
  }

  function generateClassProperties(type, playerClass) {
    if (playerClass == null) {
      playerClass = {}
    }

    const experience = playerClass.experience || 0
    const level = calculateLevel(experience)

    return {
      level: level,
      experience: experience,
      ...calculateWeight(type, level, experience),
    }
  }

  function calculateLevel(experience) {
    let level = 0

    for (let toRemove of DungeonsExperience) {
      experience -= toRemove
      if (experience < 0) {
        return level + (1 - (experience * -1) / toRemove)
      }
      level++
    }

    return Math.min(level, 50)
  }

  function calculateWeight(type, level, experience) {
    let percentageModifier = weights[type]

    // Calculates the base weight using the players level
    let base = Math.pow(level, 4.5) * percentageModifier

    // If the dungeon XP is below the requirements for a level 50 dungeon we'll
    // just return our weight right away.
    if (experience <= level50Experience) {
      return {
        weight: base,
        weight_overflow: 0,
      }
    }

    // Calculates the XP above the level 50 requirement, and the splitter
    // value, weight given past level 50 is given at 1/4 the rate.
    let remaining = experience - level50Experience
    let splitter = (4 * level50Experience) / base

    // Calculates the dungeon overflow weight and returns it to the weight object builder.
    return {
      weight: Math.floor(base),
      weight_overflow: Math.pow(remaining / splitter, 0.968),
    }
  }

  function sumWeights(dungeons, type) {
    return Object.keys(weights)
      .map(v => {
        return dungeons.classes.hasOwnProperty(v) ? dungeons.classes[v][type] : 0
      })
      .reduce((accumulator, current) => accumulator + current)
  }

module.exports = {
  name: 'dungeons',
  description: 'returns the given player weight stats for slayers',
  execute(profile) {
  
    const dungeonGroups = profile.dungeons

    const dungeons = {
      selected_class: dungeonGroups.selected_dungeon_class || 'None',
      weight: 0,
      weight_overflow: 0,
      //secrets_found: player.dungeons.secrets_found,
      classes: {
        healer: generateClassProperties('healer', dungeonGroups.player_classes.healer || 0),
        mage: generateClassProperties('mage', dungeonGroups.player_classes.mage || 0),
        berserker: generateClassProperties('berserk', dungeonGroups.player_classes.berserk || 0),
        archer: generateClassProperties('archer', dungeonGroups.player_classes.archer || 0),
        tank: generateClassProperties('tank', dungeonGroups.player_classes.tank || 0),
      },
      types: {
        catacombs: buildDungeonTypeProperties(
          'catacombs', 
          dungeonGroups.dungeon_types.catacombs, 
          dungeonGroups.dungeon_types.master_catacombs
          )
        },
      }
      
      dungeons.weight = sumWeights(dungeons, 'weight') + dungeons.types.catacombs.weight
      dungeons.weight_overflow = sumWeights(dungeons, 'weight_overflow') + dungeons.types.catacombs.weight_overflow

      if (profile.dungeons == undefined) {
          return dungeons
      }
      
      if (!hasDungeonData(dungeonGroups)) {
        return dungeons
      }

    return dungeons
  }
}