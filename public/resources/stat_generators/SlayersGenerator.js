const weights = require('../../resources/constants/weight').slayerWeight
const SlayerExperience = require('../../resources/constants/leveling').slayer_xp

function getTotalCoinsSpentOnSlayers(slayers) {
  let totalCoins = 0

  for (let type of Object.keys(slayers)) {
    const slayer = slayers[type]

    totalCoins += (slayer.boss_kills_tier_0 || 0) * 100
    totalCoins += (slayer.boss_kills_tier_1 || 0) * 2000
    totalCoins += (slayer.boss_kills_tier_2 || 0) * 10000
    totalCoins += (slayer.boss_kills_tier_3 || 0) * 50000
    totalCoins += (slayer.boss_kills_tier_4 || 0) * 100000
  }

  return totalCoins
}

function calculateTotalCombinedSlayerExperience(slayers) {
  let totalXp = 0

  for (let type of Object.keys(slayers)) {
    totalXp += slayers[type].xp || 0
  }

  return totalXp
}

function generateSlayerStatsResponse(type, slayer) {
  if (slayer == null) {
    slayer = {}
  }

  const experience = typeof slayer.xp == 'number' ?  slayer.xp: 0

  return {
    level: calculateSlayerLevel(experience),
    experience: experience,
    ...calculateWeight(type, experience),
    kills: {
      tier_1: slayer.boss_kills_tier_0 || 0,
      tier_2: slayer.boss_kills_tier_1 || 0,
      tier_3: slayer.boss_kills_tier_2 || 0,
      tier_4: slayer.boss_kills_tier_3 || 0,
      tier_5: slayer.boss_kills_tier_4 || 0,
    },
  }
}

function calculateSlayerLevel(experience) {
  for(level = 0; level < Object.keys(SlayerExperience).length; level++) {
    let requirement = SlayerExperience[level + 1]

    if (experience < requirement) {
      let lastRequirement = level == 0 ? 0 : SlayerExperience[level - 1]

      return level + (experience - lastRequirement) / (requirement - lastRequirement)
    }
  }
  return 9
}

function calculateWeight(type, experience) {
  const slayerWeight = weights[type]

  if (experience <= 1000000) {
    return {
      weight: experience == 0 ? 0 : experience / slayerWeight.divider,
      weight_overflow: 0,
    }
  }

  let base = 1000000 / slayerWeight.divider
  let remaining = experience - 1000000

  let modifier = slayerWeight.modifier
  let overflow = 0

  while (remaining > 0) {
    let left = Math.min(remaining, 1000000)

    overflow += Math.pow(left / (slayerWeight.divider * (1.5 + modifier)), 0.942)
    modifier += slayerWeight.modifier
    remaining -= left
  }

  return {
    weight: base,
    weight_overflow: overflow,
  }
}

function sumWeights(slayers, type) {
  return Object.keys(weights)
    .map(v => slayers.bosses[v][type])
    .reduce((accumulator, current) => accumulator + current)
}

module.exports = {
  name: 'slayers',
  description: 'returns the given player weight stats for slayers',
  execute(profile) {

    const slayers = {
      total_coins_spent: getTotalCoinsSpentOnSlayers(profile.slayer_bosses),
      total_experience: calculateTotalCombinedSlayerExperience(profile.slayer_bosses),
      weight: 0,
      weight_overflow: 0,
      bosses: {
        zombie: generateSlayerStatsResponse('zombie', profile.slayer_bosses.zombie || null),
        spider: generateSlayerStatsResponse('spider', profile.slayer_bosses.spider || null),
        wolf: generateSlayerStatsResponse('wolf', profile.slayer_bosses.wolf || null),
        enderman: generateSlayerStatsResponse('enderman', profile.slayer_bosses.enderman || null),
      },
    }
    slayers.weight = sumWeights(slayers, 'weight')
    slayers.weight_overflow = sumWeights(slayers, 'weight_overflow')
    
    return slayers
  }
}
