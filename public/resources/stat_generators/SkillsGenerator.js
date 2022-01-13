const skillGroups = require('../../resources/constants/weight').skillWeight
const experienceGroup = require('../../resources/constants/leveling').leveling_xp

let level50SkillExp = 55172425
let level60SkillExp = 111672425

const skills = ['mining', 'foraging', 'enchanting', 'farming', 'combat', 'fishing', 'alchemy', 'taming']

function calculateSkillWeight(skillGroup, level, experience) {
    if (skillGroup.exponent == undefined || skillGroup.divider == undefined) {
      return {
        weight: 0,
        weight_overflow: 0,
      }
    }

    // Gets the XP required to max out the skill.
    let maxSkillLevelXP = skillGroup.maxLevel == 60 ? level60SkillExp : level50SkillExp

    // Calculates the base weight using the players level, if the players level
    // is 50/60 we'll round off their weight to get a nicer looking number.
    let base = Math.pow(level * 10, 0.5 + skillGroup.exponent + level / 100) / 1250
    if (experience > maxSkillLevelXP) {
      base = Math.round(base)
    }

    // If the skill XP is below the requirements for a level 50/60 skill we'll
    // just return our weight to the weight object builder right away.
    if (experience <= maxSkillLevelXP) {
      return {
        weight: base,
        weight_overflow: 0,
      }
    }

    // Calculates the skill overflow weight and returns it to the weight object builder.
    return {
      weight: base,
      weight_overflow: Math.pow((experience - maxSkillLevelXP) / skillGroup.divider, 0.968),
    }
  }
  
function xp_sum(skillGroup) {
    var totalxp = 0
    for (var skill in skillGroup) {
        totalxp += skill
    }
    return totalxp
}

function calculateSkillLevel(experience, maxLevel) {
    let level = 0

    for (let toRemove of experienceGroup) {
      experience -= toRemove
      if (experience < 0) {
        return Math.min(level + (1 - (experience * -1) / toRemove), maxLevel)
      }
      level++
    }

    return Math.min(level, maxLevel)
  }
  
function calculateSkillProperties(type, experience) {
    const skillGroup = skillGroups[type]

    const level = calculateSkillLevel(experience, skillGroup.maxLevel)

    var obj = {
      level: level,
      experience: experience,
      ...calculateSkillWeight(skillGroup, level, experience)
    }

    return obj
}

function sumWeights(skills_info, type) {
  return Object.keys(skillGroups)
    .map(v => skills_info.skills[v][type])
    .reduce((accumulator, current) => accumulator + current)
}

module.exports = {
  name: 'skills',
  description: 'returns the given player weight stats for skills',
  execute(profile) {
        
    let experiences = {
        mining: profile.experience_skill_mining,
        foraging: profile.experience_skill_foraging,
        enchanting: profile.experience_skill_enchanting,
        farming: profile.experience_skill_farming,
        combat: profile.experience_skill_combat,
        fishing: profile.experience_skill_fishing,
        alchemy: profile.experience_skill_alchemy,
        taming: profile.experience_skill_taming
    }
    
    for (var n in experiences) {
      if (typeof experiences[n] != 'number') {
        experiences[n] = 0
      }
    }

    if (xp_sum(experiences) == 0) {
        msg.channel.send('Please enable API tracking in your hypixel settings!')
    }
    else {
      const skills_info = {
        skill_average: 0,
        weight: 0,
        weight_overflow: 0,
        skills : {
          mining: calculateSkillProperties('mining', experiences['mining'] || 0),
          foraging: calculateSkillProperties('foraging', experiences['foraging'] || 0),
          enchanting: calculateSkillProperties('enchanting', experiences['enchanting'] || 0),
          farming: calculateSkillProperties('farming', experiences['farming'] || 0),
          combat: calculateSkillProperties('combat', experiences['combat'] || 0),
          fishing: calculateSkillProperties('fishing', experiences['fishing'] || 0),
          alchemy: calculateSkillProperties('alchemy', experiences['alchemy'] || 0),
          taming: calculateSkillProperties('taming', experiences['taming'] || 0)
        }

      }
      skills_info.skill_average = sumWeights(skills_info, 'level')/8
      skills_info.weight = sumWeights(skills_info, 'weight')
      skills_info.weight_overflow = sumWeights(skills_info, 'weight_overflow')

      return skills_info
    }
  }
}