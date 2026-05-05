/* Ragnarok Idle — game data */

const JOBS = {
  Novice: {
    name: 'Novice', emoji: '🧑',
    base: { hp: 40, sp: 10, atk: 1, matk: 1, def: 0, hit: 5, flee: 5, crit: 1, aspd: 1.0 },
    grow: { hpPerVit: 5, hpPerLv: 4, spPerInt: 1.5, spPerLv: 1, atkPerStr: 1, matkPerInt: 1.2 },
    advances: ['Swordman', 'Mage', 'Archer', 'Acolyte', 'Thief', 'Merchant'],
    skills: ['basic_attack'],
  },
  Swordman: {
    name: 'Swordman', emoji: '⚔',
    base: { hp: 80, sp: 15, atk: 5, matk: 0, def: 4, hit: 8, flee: 6, crit: 2, aspd: 1.1 },
    grow: { hpPerVit: 8, hpPerLv: 9, spPerInt: 1.0, spPerLv: 1, atkPerStr: 1.4, matkPerInt: 0.5 },
    advances: ['Knight', 'Crusader'],
    skills: ['basic_attack', 'bash', 'magnum_break', 'endure'],
  },
  Mage: {
    name: 'Mage', emoji: '🧙',
    base: { hp: 50, sp: 40, atk: 1, matk: 6, def: 1, hit: 5, flee: 5, crit: 1, aspd: 0.95 },
    grow: { hpPerVit: 4, hpPerLv: 5, spPerInt: 2.5, spPerLv: 2, atkPerStr: 0.5, matkPerInt: 1.8 },
    advances: ['Wizard', 'Sage'],
    skills: ['basic_attack', 'fire_bolt', 'cold_bolt', 'lightning_bolt'],
  },
  Archer: {
    name: 'Archer', emoji: '🏹',
    base: { hp: 60, sp: 18, atk: 4, matk: 0, def: 2, hit: 12, flee: 8, crit: 4, aspd: 1.2 },
    grow: { hpPerVit: 6, hpPerLv: 7, spPerInt: 1.2, spPerLv: 1, atkPerStr: 0.8, matkPerInt: 0.5, atkPerDex: 1.0 },
    advances: ['Hunter', 'Bard'],
    skills: ['basic_attack', 'double_strafe', 'arrow_shower', 'owls_eye'],
  },
  Acolyte: {
    name: 'Acolyte', emoji: '✚',
    base: { hp: 55, sp: 30, atk: 2, matk: 4, def: 2, hit: 6, flee: 6, crit: 2, aspd: 1.0 },
    grow: { hpPerVit: 6, hpPerLv: 6, spPerInt: 2.0, spPerLv: 2, atkPerStr: 0.6, matkPerInt: 1.4 },
    advances: ['Priest', 'Monk'],
    skills: ['basic_attack', 'heal', 'holy_light', 'blessing'],
  },
  Thief: {
    name: 'Thief', emoji: '🗡',
    base: { hp: 60, sp: 15, atk: 4, matk: 0, def: 2, hit: 9, flee: 12, crit: 6, aspd: 1.25 },
    grow: { hpPerVit: 6, hpPerLv: 7, spPerInt: 1.2, spPerLv: 1, atkPerStr: 1.1, matkPerInt: 0.4 },
    advances: ['Assassin', 'Rogue'],
    skills: ['basic_attack', 'double_attack', 'envenom', 'steal'],
  },
  Merchant: {
    name: 'Merchant', emoji: '⚖',
    base: { hp: 70, sp: 18, atk: 4, matk: 0, def: 3, hit: 7, flee: 6, crit: 2, aspd: 1.05 },
    grow: { hpPerVit: 7, hpPerLv: 8, spPerInt: 1.2, spPerLv: 1, atkPerStr: 1.1, matkPerInt: 0.5 },
    advances: ['Blacksmith', 'Alchemist'],
    skills: ['basic_attack', 'mammonite', 'discount', 'overcharge'],
  },
  // 2nd jobs
  Knight: {
    name: 'Knight', emoji: '🛡', tier: 2,
    base: { hp: 140, sp: 25, atk: 12, matk: 0, def: 8, hit: 12, flee: 9, crit: 3, aspd: 1.15 },
    grow: { hpPerVit: 11, hpPerLv: 14, spPerInt: 1.0, spPerLv: 1, atkPerStr: 1.8, matkPerInt: 0.5 },
    advances: [],
    skills: ['basic_attack', 'bash', 'magnum_break', 'endure', 'bowling_bash', 'two_hand_quicken'],
  },
  Crusader: {
    name: 'Crusader', emoji: '🛡', tier: 2,
    base: { hp: 130, sp: 35, atk: 10, matk: 4, def: 10, hit: 11, flee: 8, crit: 3, aspd: 1.1 },
    grow: { hpPerVit: 12, hpPerLv: 13, spPerInt: 1.4, spPerLv: 1.5, atkPerStr: 1.5, matkPerInt: 0.9 },
    advances: [],
    skills: ['basic_attack', 'bash', 'endure', 'holy_cross', 'shield_boomerang'],
  },
  Wizard: {
    name: 'Wizard', emoji: '🪄', tier: 2,
    base: { hp: 80, sp: 90, atk: 2, matk: 16, def: 2, hit: 8, flee: 7, crit: 2, aspd: 1.0 },
    grow: { hpPerVit: 5, hpPerLv: 8, spPerInt: 3.5, spPerLv: 3, atkPerStr: 0.5, matkPerInt: 2.6 },
    advances: [],
    skills: ['basic_attack', 'fire_bolt', 'cold_bolt', 'lightning_bolt', 'fire_ball', 'meteor_storm'],
  },
  Sage: {
    name: 'Sage', emoji: '📜', tier: 2,
    base: { hp: 90, sp: 70, atk: 4, matk: 12, def: 4, hit: 10, flee: 8, crit: 2, aspd: 1.05 },
    grow: { hpPerVit: 6, hpPerLv: 9, spPerInt: 3.0, spPerLv: 2, atkPerStr: 0.7, matkPerInt: 2.2 },
    advances: [],
    skills: ['basic_attack', 'fire_bolt', 'cold_bolt', 'lightning_bolt', 'soul_burn'],
  },
  Hunter: {
    name: 'Hunter', emoji: '🏹', tier: 2,
    base: { hp: 110, sp: 35, atk: 11, matk: 0, def: 5, hit: 18, flee: 12, crit: 7, aspd: 1.3 },
    grow: { hpPerVit: 8, hpPerLv: 11, spPerInt: 1.5, spPerLv: 1, atkPerStr: 1.0, matkPerInt: 0.5, atkPerDex: 1.4 },
    advances: [],
    skills: ['basic_attack', 'double_strafe', 'arrow_shower', 'owls_eye', 'beast_bane', 'falcon_assault'],
  },
  Bard: {
    name: 'Bard', emoji: '🎵', tier: 2,
    base: { hp: 100, sp: 50, atk: 8, matk: 4, def: 4, hit: 14, flee: 10, crit: 5, aspd: 1.2 },
    grow: { hpPerVit: 7, hpPerLv: 10, spPerInt: 2.0, spPerLv: 1.5, atkPerStr: 0.9, matkPerInt: 0.8, atkPerDex: 1.0 },
    advances: [],
    skills: ['basic_attack', 'double_strafe', 'owls_eye', 'song_of_lutie', 'bragis_poem'],
  },
  Priest: {
    name: 'Priest', emoji: '✨', tier: 2,
    base: { hp: 110, sp: 70, atk: 4, matk: 10, def: 5, hit: 9, flee: 8, crit: 3, aspd: 1.05 },
    grow: { hpPerVit: 9, hpPerLv: 11, spPerInt: 2.8, spPerLv: 2, atkPerStr: 0.7, matkPerInt: 2.0 },
    advances: [],
    skills: ['basic_attack', 'heal', 'holy_light', 'blessing', 'aspersio', 'turn_undead'],
  },
  Monk: {
    name: 'Monk', emoji: '👊', tier: 2,
    base: { hp: 130, sp: 50, atk: 14, matk: 6, def: 6, hit: 12, flee: 10, crit: 4, aspd: 1.2 },
    grow: { hpPerVit: 10, hpPerLv: 12, spPerInt: 1.8, spPerLv: 1.5, atkPerStr: 1.6, matkPerInt: 1.2 },
    advances: [],
    skills: ['basic_attack', 'heal', 'blessing', 'iron_fist', 'asura_strike'],
  },
  Assassin: {
    name: 'Assassin', emoji: '🔪', tier: 2,
    base: { hp: 110, sp: 30, atk: 13, matk: 0, def: 5, hit: 16, flee: 22, crit: 12, aspd: 1.4 },
    grow: { hpPerVit: 8, hpPerLv: 11, spPerInt: 1.4, spPerLv: 1, atkPerStr: 1.5, matkPerInt: 0.4 },
    advances: [],
    skills: ['basic_attack', 'double_attack', 'envenom', 'sonic_blow', 'grimtooth'],
  },
  Rogue: {
    name: 'Rogue', emoji: '🦝', tier: 2,
    base: { hp: 105, sp: 35, atk: 11, matk: 0, def: 5, hit: 15, flee: 18, crit: 8, aspd: 1.35 },
    grow: { hpPerVit: 8, hpPerLv: 10, spPerInt: 1.5, spPerLv: 1.2, atkPerStr: 1.3, matkPerInt: 0.5 },
    advances: [],
    skills: ['basic_attack', 'double_attack', 'envenom', 'steal', 'back_stab', 'gangsters_paradise'],
  },
  Blacksmith: {
    name: 'Blacksmith', emoji: '🔨', tier: 2,
    base: { hp: 130, sp: 30, atk: 13, matk: 0, def: 6, hit: 11, flee: 7, crit: 3, aspd: 1.15 },
    grow: { hpPerVit: 10, hpPerLv: 13, spPerInt: 1.4, spPerLv: 1, atkPerStr: 1.7, matkPerInt: 0.5 },
    advances: [],
    skills: ['basic_attack', 'mammonite', 'discount', 'overcharge', 'hammerfall', 'adrenaline_rush'],
  },
  Alchemist: {
    name: 'Alchemist', emoji: '⚗', tier: 2,
    base: { hp: 115, sp: 50, atk: 9, matk: 6, def: 5, hit: 10, flee: 8, crit: 3, aspd: 1.1 },
    grow: { hpPerVit: 9, hpPerLv: 11, spPerInt: 2.0, spPerLv: 1.5, atkPerStr: 1.2, matkPerInt: 1.4 },
    advances: [],
    skills: ['basic_attack', 'mammonite', 'discount', 'acid_terror', 'demonstration'],
  },
};

const SKILLS = {
  basic_attack: { name: 'Basic Attack', desc: 'Default melee/ranged attack.', max: 1, cost: 0, sp: 0, type: 'attack', power: 1.0, fixed: true },
  bash:         { name: 'Bash',          desc: 'Powerful strike. +30% per level.',     max: 10, cost: 1, sp: 8,  type: 'attack', power: 1.3, scale: 0.30 },
  magnum_break: { name: 'Magnum Break',  desc: 'Fire AoE; bonus damage by level.',     max: 10, cost: 1, sp: 12, type: 'attack', power: 1.4, scale: 0.20, element: 'fire' },
  endure:       { name: 'Endure',        desc: '+5% DEF per level (passive).',         max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'defPct', scale: 0.05 },
  fire_bolt:    { name: 'Fire Bolt',     desc: 'Magic projectile. +35%/lv.',           max: 10, cost: 1, sp: 10, type: 'magic',  power: 1.4, scale: 0.35, element: 'fire' },
  cold_bolt:    { name: 'Cold Bolt',     desc: 'Magic projectile. +35%/lv.',           max: 10, cost: 1, sp: 10, type: 'magic',  power: 1.4, scale: 0.35, element: 'water' },
  lightning_bolt:{name: 'Lightning Bolt', desc: 'Magic projectile. +35%/lv.',          max: 10, cost: 1, sp: 10, type: 'magic',  power: 1.4, scale: 0.35, element: 'wind' },
  fire_ball:    { name: 'Fire Ball',     desc: 'Heavy magic damage.',                  max: 10, cost: 1, sp: 25, type: 'magic',  power: 2.0, scale: 0.30, element: 'fire' },
  meteor_storm: { name: 'Meteor Storm',  desc: 'Massive magic AoE.',                   max: 10, cost: 2, sp: 60, type: 'magic',  power: 3.5, scale: 0.40, element: 'fire' },
  soul_burn:    { name: 'Soul Burn',     desc: 'Burn SP into damage.',                 max: 10, cost: 1, sp: 30, type: 'magic',  power: 2.0, scale: 0.25 },
  double_strafe:{ name: 'Double Strafe', desc: 'Two arrows. +25%/lv.',                 max: 10, cost: 1, sp: 12, type: 'attack', power: 1.6, scale: 0.25 },
  arrow_shower: { name: 'Arrow Shower',  desc: 'AoE arrows.',                          max: 10, cost: 1, sp: 15, type: 'attack', power: 1.4, scale: 0.20 },
  owls_eye:     { name: "Owl's Eye",      desc: '+1 DEX per level (passive).',          max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'dex', scale: 1 },
  beast_bane:   { name: 'Beast Bane',    desc: '+4% damage to all enemies (passive).', max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'atkPct', scale: 0.04 },
  falcon_assault:{name: 'Falcon Assault', desc: 'Falcon strikes for huge damage.',     max: 10, cost: 2, sp: 35, type: 'attack', power: 2.4, scale: 0.30 },
  heal:         { name: 'Heal',          desc: 'Restore HP based on INT (auto when low).', max: 10, cost: 1, sp: 14, type: 'heal',  power: 4, scale: 0.6 },
  holy_light:   { name: 'Holy Light',    desc: 'Holy magic damage.',                   max: 10, cost: 1, sp: 12, type: 'magic',  power: 1.5, scale: 0.30, element: 'holy' },
  blessing:     { name: 'Blessing',      desc: '+1 STR/INT/DEX per lv (passive).',     max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'sid', scale: 1 },
  aspersio:     { name: 'Aspersio',      desc: 'Holy enchant. +5% atk passive.',       max: 5,  cost: 2, sp: 0,  type: 'passive', stat: 'atkPct', scale: 0.05 },
  turn_undead:  { name: 'Turn Undead',   desc: 'Massive damage to Undead.',            max: 10, cost: 1, sp: 25, type: 'magic',  power: 2.0, scale: 0.30, element: 'holy' },
  iron_fist:    { name: 'Iron Fist',     desc: '+8% ATK per level (passive).',         max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'atkPct', scale: 0.08 },
  asura_strike: { name: 'Asura Strike',  desc: 'Spend all SP for huge damage.',        max: 5,  cost: 2, sp: 0,  type: 'special' },
  double_attack:{ name: 'Double Attack', desc: '+5% chance to hit twice / lv (passive).', max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'doubleAtk', scale: 0.05 },
  envenom:      { name: 'Envenom',       desc: 'Poison strike. +25%/lv.',              max: 10, cost: 1, sp: 12, type: 'attack', power: 1.5, scale: 0.25, element: 'poison' },
  steal:        { name: 'Steal',         desc: '+5% bonus zeny per kill / lv.',        max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'zenyPct', scale: 0.05 },
  sonic_blow:   { name: 'Sonic Blow',    desc: '8 quick strikes.',                     max: 10, cost: 2, sp: 30, type: 'attack', power: 3.0, scale: 0.30 },
  grimtooth:    { name: 'Grimtooth',     desc: 'Hidden strike. Bonus crit.',           max: 10, cost: 1, sp: 14, type: 'attack', power: 1.6, scale: 0.20 },
  back_stab:    { name: 'Back Stab',     desc: 'Hits behind. Big damage.',             max: 10, cost: 1, sp: 16, type: 'attack', power: 1.8, scale: 0.25 },
  gangsters_paradise: { name: "Gangster's Paradise", desc: '+8% LUK gain (passive).',  max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'lukPct', scale: 0.05 },
  mammonite:    { name: 'Mammonite',     desc: 'Spend zeny for damage.',               max: 10, cost: 1, sp: 6,  type: 'attack', power: 1.5, scale: 0.30, zenyCost: 100 },
  discount:     { name: 'Discount',      desc: '-3% shop prices per lv (passive).',    max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'discount', scale: 0.03 },
  overcharge:   { name: 'Overcharge',    desc: '+3% zeny per kill / lv.',              max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'zenyPct', scale: 0.03 },
  hammerfall:   { name: 'Hammerfall',    desc: 'Stun smash.',                          max: 10, cost: 1, sp: 14, type: 'attack', power: 1.6, scale: 0.20 },
  adrenaline_rush:{name: 'Adrenaline Rush',desc:'+4% ASPD per lv (passive).',          max: 5,  cost: 2, sp: 0,  type: 'passive', stat: 'aspdPct', scale: 0.04 },
  acid_terror:  { name: 'Acid Terror',   desc: 'Acid melts armor.',                    max: 10, cost: 1, sp: 18, type: 'attack', power: 1.8, scale: 0.25 },
  demonstration:{ name: 'Demonstration', desc: 'Throws a bottle bomb.',                max: 5,  cost: 2, sp: 30, type: 'attack', power: 2.4, scale: 0.30 },
  bowling_bash: { name: 'Bowling Bash',  desc: 'Strike rolls into multiple hits.',     max: 10, cost: 2, sp: 26, type: 'attack', power: 2.4, scale: 0.30 },
  two_hand_quicken:{name:'Two-Hand Quicken',desc:'+5% ASPD/lv (passive).',             max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'aspdPct', scale: 0.05 },
  holy_cross:   { name: 'Holy Cross',    desc: 'Holy strike.',                         max: 10, cost: 1, sp: 14, type: 'attack', power: 1.7, scale: 0.25, element: 'holy' },
  shield_boomerang:{name:'Shield Boomerang',desc:'Throw your shield.',                 max: 10, cost: 1, sp: 12, type: 'attack', power: 1.5, scale: 0.20 },
  song_of_lutie:{name: 'Song of Lutie',  desc: '+10 max HP per lv (passive).',         max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'maxHpFlat', scale: 10 },
  bragis_poem:  { name: "Bragi's Poem",   desc: '+3% SP regen per lv (passive).',      max: 10, cost: 1, sp: 0,  type: 'passive', stat: 'spRegenPct', scale: 0.03 },
};

// Monster drops are tuples: [itemId, chance].
// Boss monsters also have a `guaranteed` array picked from on every kill.
const MONSTERS = {
  poring:   { name: 'Poring',     emoji: '🍡', hp: 18, atk: 4, def: 0, exp: 6, jexp: 4, zeny: [2, 6], race: 'plant', drops: [['jellopy', 0.8], ['empty_bottle', 0.2], ['apple', 0.05], ['red_potion', 0.04], ['poring_card', 0.001]] },
  fabre:    { name: 'Fabre',      emoji: '🐛', hp: 30, atk: 6, def: 1, exp: 9, jexp: 6, zeny: [3, 8], race: 'insect', drops: [['fluff', 0.6], ['feather', 0.15], ['red_herb', 0.2], ['fabre_card', 0.001]] },
  lunatic:  { name: 'Lunatic',    emoji: '🐰', hp: 22, atk: 5, def: 0, exp: 7, jexp: 5, zeny: [2, 5], race: 'beast', drops: [['four_leaf_clover', 0.02], ['carrot', 0.4], ['feather', 0.1]] },
  pupa:     { name: 'Pupa',       emoji: '🥚', hp: 50, atk: 0, def: 4, exp: 14, jexp: 10, zeny: [4, 10], race: 'insect', drops: [['chrysalis', 0.7], ['fluff', 0.3]] },
  willow:   { name: 'Willow',     emoji: '🌳', hp: 60, atk: 9, def: 3, exp: 18, jexp: 12, zeny: [5, 12], race: 'plant', drops: [['resin', 0.5], ['branch', 0.2], ['yellow_herb', 0.15]] },
  picky:    { name: 'Picky',      emoji: '🐥', hp: 40, atk: 8, def: 1, exp: 16, jexp: 10, zeny: [4, 11], race: 'brute', drops: [['feather', 0.4], ['yellow_herb', 0.15], ['meat', 0.05]] },
  rocker:   { name: 'Rocker',     emoji: '🦗', hp: 80, atk: 12, def: 2, exp: 26, jexp: 18, zeny: [8, 18], race: 'insect', drops: [['grasshoppers_leg', 0.5], ['insect_feeler', 0.05], ['main_gauche', 0.005]] },
  thief_bug:{ name: 'Thief Bug',  emoji: '🪲', hp: 110, atk: 16, def: 3, exp: 38, jexp: 25, zeny: [10, 22], race: 'insect', drops: [['chrysalis', 0.4], ['insect_feeler', 0.25], ['thief_bug_card', 0.001]] },
  hornet:   { name: 'Hornet',     emoji: '🐝', hp: 95, atk: 20, def: 2, exp: 36, jexp: 22, zeny: [12, 24], race: 'insect', drops: [['honey', 0.3], ['bee_sting', 0.4], ['orange_potion', 0.04]] },
  wolf:     { name: 'Wolf',       emoji: '🐺', hp: 160, atk: 28, def: 4, exp: 65, jexp: 40, zeny: [18, 36], race: 'beast', drops: [['monsters_feed', 0.3], ['mantle', 0.05], ['meat', 0.25], ['jur', 0.005]] },
  orc_warrior:{ name: 'Orc Warrior', emoji: '🪓', hp: 320, atk: 42, def: 8, exp: 140, jexp: 80, zeny: [40, 80], race: 'demihuman', drops: [['orcish_voucher', 0.3], ['steel', 0.1], ['battle_axe', 0.005], ['rough_oridecon', 0.04]] },
  goblin:   { name: 'Goblin',     emoji: '👺', hp: 280, atk: 38, def: 6, exp: 120, jexp: 70, zeny: [35, 70], race: 'demihuman', drops: [['scell', 0.3], ['oridecon', 0.02], ['iron', 0.1], ['goblin_card', 0.001]] },
  zombie:   { name: 'Zombie',     emoji: '🧟', hp: 220, atk: 32, def: 5, exp: 95, jexp: 60, zeny: [25, 55], race: 'undead', drops: [['decayed_nail', 0.4], ['sticky_mucus', 0.2], ['zombie_card', 0.001]] },
  skeleton: { name: 'Skeleton',   emoji: '💀', hp: 240, atk: 36, def: 7, exp: 110, jexp: 70, zeny: [30, 60], race: 'undead', drops: [['skel_bone', 0.5], ['short_sword', 0.01], ['skeleton_card', 0.001]] },
  munak:    { name: 'Munak',      emoji: '👻', hp: 420, atk: 55, def: 8, exp: 220, jexp: 130, zeny: [60, 120], race: 'undead', drops: [['munak_doll', 0.02], ['talisman', 0.2], ['white_herb', 0.2]] },
  bongun:   { name: 'Bongun',     emoji: '🧛', hp: 450, atk: 60, def: 9, exp: 230, jexp: 140, zeny: [70, 130], race: 'undead', drops: [['fancy_flower', 0.02], ['talisman', 0.2], ['katana', 0.005]] },
  isis:     { name: 'Isis',       emoji: '🐍', hp: 700, atk: 90, def: 12, exp: 420, jexp: 240, zeny: [120, 240], race: 'demon', drops: [['scell', 0.3], ['isis_doll', 0.01], ['rough_elunium', 0.05], ['rosary', 0.005]] },
  pasana:   { name: 'Pasana',     emoji: '🔥', hp: 800, atk: 110, def: 15, exp: 520, jexp: 290, zeny: [150, 280], race: 'demon', drops: [['burning_heart', 0.2], ['oridecon', 0.05], ['claymore', 0.005]] },
  mummy:    { name: 'Mummy',      emoji: '🪦', hp: 900, atk: 130, def: 18, exp: 620, jexp: 340, zeny: [180, 320], race: 'undead', drops: [['rotten_bandage', 0.5], ['oridecon', 0.05], ['saints_robe', 0.005]] },
  marin:    { name: 'Marin',      emoji: '❄', hp: 600, atk: 80, def: 10, exp: 360, jexp: 200, zeny: [100, 200], race: 'plant', drops: [['ice_cream', 0.2], ['stem', 0.4], ['white_herb', 0.15]] },
  raydric:  { name: 'Raydric',    emoji: '🗡', hp: 1400, atk: 180, def: 22, exp: 1100, jexp: 600, zeny: [320, 540], race: 'demihuman', drops: [['elunium', 0.05], ['raydric_card', 0.003], ['gakkung_bow', 0.004], ['mithril_armor', 0.002]] },
  baphomet_jr:{name: 'Baphomet Jr.', emoji: '😈', hp: 1800, atk: 220, def: 25, exp: 1500, jexp: 800, zeny: [420, 700], race: 'demon', drops: [['little_horn', 0.2], ['oridecon', 0.1], ['flamberge', 0.005], ['ghostring_card', 0.0008]] },
  // Bosses — `guaranteed` always drops one of these per kill, in addition to rolling normal drops
  poporing:{ name: 'Poporing',    emoji: '🟢', hp: 1200, atk: 100, def: 15, exp: 1400, jexp: 800, zeny: [400, 700], race: 'plant', boss: true, guaranteed: ['oridecon', 'rough_oridecon', 'yellow_potion'], drops: [['poporing_card', 0.02], ['oridecon', 0.3], ['ring', 0.1]] },
  eddga:   { name: 'Eddga',       emoji: '🐯', hp: 4000, atk: 280, def: 40, exp: 6000, jexp: 3200, zeny: [1500, 2500], race: 'beast', boss: true, guaranteed: ['tiger_skin', 'elunium', 'rough_elunium'], drops: [['eddga_card', 0.02], ['tiger_skin', 0.5], ['elunium', 0.6], ['claymore', 0.1], ['bunny_band', 0.05]] },
  osiris:  { name: 'Osiris',      emoji: '🏺', hp: 6000, atk: 380, def: 50, exp: 9000, jexp: 4800, zeny: [2400, 3600], race: 'undead', boss: true, guaranteed: ['oridecon', 'crown'], drops: [['osiris_card', 0.02], ['crown', 0.3], ['oridecon', 1], ['archmage_staff', 0.05], ['rosary', 0.2]] },
  baphomet:{ name: 'Baphomet',    emoji: '🐐', hp: 9500, atk: 520, def: 65, exp: 14000, jexp: 7500, zeny: [3500, 5500], race: 'demon', boss: true, guaranteed: ['ring_of_muscle', 'emperium'], drops: [['baphomet_card', 0.02], ['ring_of_muscle', 0.4], ['mithril_armor', 0.1], ['flamberge', 0.2], ['emperium', 0.3]] },
};

const MAPS = [
  { id: 'prt_fild', name: 'Prontera Field', biome: 'field', minLv: 1,  monsters: ['poring', 'lunatic', 'fabre', 'pupa'], boss: null },
  { id: 'gef_fild', name: 'Geffen Field',   biome: 'field', minLv: 8,  monsters: ['willow', 'picky', 'fabre', 'rocker'], boss: 'poporing' },
  { id: 'pyr_dun',  name: 'Payon Dungeon',  biome: 'dungeon', minLv: 15, monsters: ['thief_bug', 'zombie', 'skeleton'], boss: null },
  { id: 'orc_dun',  name: 'Orc Dungeon',    biome: 'dungeon', minLv: 22, monsters: ['orc_warrior', 'goblin', 'hornet', 'wolf'], boss: null },
  { id: 'pyr_fld',  name: 'Payon Forest',   biome: 'field', minLv: 18, monsters: ['hornet', 'wolf', 'rocker', 'willow'], boss: 'eddga' },
  { id: 'amatsu',   name: 'Amatsu Cave',    biome: 'undead', minLv: 28, monsters: ['munak', 'bongun', 'zombie', 'skeleton'], boss: null },
  { id: 'morroc',   name: 'Morroc Pyramids',biome: 'desert',  minLv: 35, monsters: ['isis', 'pasana', 'mummy'], boss: 'osiris' },
  { id: 'lutie',    name: 'Lutie Snowfield',biome: 'ice',     minLv: 30, monsters: ['marin'], boss: null },
  { id: 'glast',    name: 'Glast Heim',     biome: 'undead',  minLv: 50, monsters: ['raydric', 'baphomet_jr', 'mummy'], boss: 'baphomet' },
];

// Rarity tiers (drives color, "new!" toast, sort priority).
// junk=common gray, common=white, uncommon=green, rare=blue, epic=purple, legendary=gold, mythic=red
const RARITY = {
  junk:      { name: 'Junk',      color: '#8e8aa3', toast: false, glow: 0   },
  common:    { name: 'Common',    color: '#e6e6e6', toast: false, glow: 0   },
  uncommon:  { name: 'Uncommon',  color: '#6efc7c', toast: false, glow: 6   },
  rare:      { name: 'Rare',      color: '#5aa9e6', toast: true,  glow: 10  },
  epic:      { name: 'Epic',      color: '#b186ff', toast: true,  glow: 14  },
  legendary: { name: 'Legendary', color: '#f6c453', toast: true,  glow: 18  },
  mythic:    { name: 'Mythic',    color: '#ff6a6a', toast: true,  glow: 22  },
};

const ITEMS = {
  // Consumables
  red_potion:    { name: 'Red Potion',    desc: 'Restore 50 HP.',      type: 'pot', heal: 50, price: 50, sell: 8, rarity: 'common' },
  orange_potion: { name: 'Orange Potion', desc: 'Restore 200 HP.',     type: 'pot', heal: 200, price: 200, sell: 30, rarity: 'common' },
  yellow_potion: { name: 'Yellow Potion', desc: 'Restore 600 HP.',     type: 'pot', heal: 600, price: 700, sell: 90, rarity: 'uncommon' },
  white_potion:  { name: 'White Potion',  desc: 'Restore 1500 HP.',    type: 'pot', heal: 1500, price: 1800, sell: 240, rarity: 'uncommon' },
  blue_potion:   { name: 'Blue Potion',   desc: 'Restore 60 SP.',      type: 'pot', healSp: 60, price: 600, sell: 80, rarity: 'uncommon' },
  green_potion:  { name: 'Green Potion',  desc: 'Cure status, +20 HP.',type: 'pot', heal: 20, price: 100, sell: 14, rarity: 'common' },
  awakening_potion:{name:'Awakening Potion',desc:'Restore 200 SP.',    type: 'pot', healSp: 200, price: 2400, sell: 320, rarity: 'rare' },
  berserk_potion:{ name: 'Berserk Potion',desc: 'Restore 600 SP.',     type: 'pot', healSp: 600, price: 5600, sell: 800, rarity: 'rare' },
  meat:          { name: 'Meat',          desc: 'Restore 80 HP.',      type: 'pot', heal: 80, price: 0, sell: 22, rarity: 'common' },
  apple:         { name: 'Apple',         desc: 'Restore 35 HP.',      type: 'pot', heal: 35, price: 60, sell: 8, rarity: 'common' },
  // Loot
  jellopy:       { name: 'Jellopy',       desc: 'Sticky goo from Poring.', type: 'loot', sell: 6,  rarity: 'junk' },
  empty_bottle:  { name: 'Empty Bottle',  desc: 'Could be useful.',    type: 'loot', sell: 4,  rarity: 'junk' },
  fluff:         { name: 'Fluff',         desc: 'Cottony lint.',       type: 'loot', sell: 8,  rarity: 'junk' },
  feather:       { name: 'Feather',       desc: 'Light as air.',       type: 'loot', sell: 12, rarity: 'common' },
  carrot:        { name: 'Carrot',        desc: 'Crunchy snack.',      type: 'pot', heal: 25, sell: 6,  rarity: 'junk' },
  four_leaf_clover:{name:'Four Leaf Clover',desc:'Brings luck.',       type: 'loot', sell: 1500, rarity: 'legendary' },
  chrysalis:     { name: 'Chrysalis',     desc: 'Empty cocoon.',       type: 'loot', sell: 14, rarity: 'common' },
  resin:         { name: 'Resin',         desc: 'Sticky tree sap.',    type: 'loot', sell: 18, rarity: 'common' },
  branch:        { name: 'Tree Branch',   desc: 'A sturdy stick.',     type: 'loot', sell: 22, rarity: 'common' },
  yellow_herb:   { name: 'Yellow Herb',   desc: 'Restore 30 HP.',      type: 'pot', heal: 30, sell: 12, rarity: 'common' },
  red_herb:      { name: 'Red Herb',      desc: 'Restore 18 HP.',      type: 'pot', heal: 18, sell: 5,  rarity: 'common' },
  white_herb:    { name: 'White Herb',    desc: 'Restore 60 HP.',      type: 'pot', heal: 60, sell: 28, rarity: 'common' },
  grasshoppers_leg:{name:"Grasshopper's Leg",desc:'Crunchy.',          type: 'loot', sell: 26, rarity: 'common' },
  insect_feeler: { name: 'Insect Feeler', desc: 'Antennae.',           type: 'loot', sell: 34, rarity: 'common' },
  honey:         { name: 'Honey',         desc: 'Sweet.',              type: 'loot', sell: 60, rarity: 'uncommon' },
  bee_sting:     { name: 'Bee Sting',     desc: 'Sharp.',              type: 'loot', sell: 30, rarity: 'common' },
  monsters_feed: { name: "Monster's Feed",desc: 'Animal food.',        type: 'loot', sell: 40, rarity: 'common' },
  mantle:        { name: 'Mantle',        desc: 'Warm cape material.', type: 'loot', sell: 130, rarity: 'uncommon' },
  orcish_voucher:{ name: 'Orcish Voucher',desc: 'Coupon of orcs.',     type: 'loot', sell: 90, rarity: 'uncommon' },
  steel:         { name: 'Steel',         desc: 'Refined metal.',      type: 'loot', sell: 220, rarity: 'uncommon' },
  iron_ore:      { name: 'Iron Ore',      desc: 'Smelting material.',  type: 'loot', sell: 80,  rarity: 'common' },
  iron:          { name: 'Iron',          desc: 'Refined iron.',       type: 'loot', sell: 180, rarity: 'uncommon' },
  scell:         { name: 'Scell',         desc: 'A scale.',            type: 'loot', sell: 40, rarity: 'common' },
  oridecon:      { name: 'Oridecon',      desc: 'Refines weapons.',    type: 'loot', sell: 1500, rarity: 'rare' },
  elunium:       { name: 'Elunium',       desc: 'Refines armor.',      type: 'loot', sell: 1500, rarity: 'rare' },
  decayed_nail:  { name: 'Decayed Nail',  desc: 'Eww.',                type: 'loot', sell: 50, rarity: 'common' },
  sticky_mucus:  { name: 'Sticky Mucus',  desc: 'Yuck.',               type: 'loot', sell: 70, rarity: 'common' },
  skel_bone:     { name: 'Skel-Bone',     desc: 'Bony.',               type: 'loot', sell: 65, rarity: 'common' },
  munak_doll:    { name: 'Munak Doll',    desc: 'Rare doll.',          type: 'loot', sell: 1800, rarity: 'epic' },
  fancy_flower:  { name: 'Fancy Flower',  desc: 'Pretty bloom.',       type: 'loot', sell: 800, rarity: 'rare' },
  talisman:      { name: 'Talisman',      desc: 'Holy charm.',         type: 'loot', sell: 100, rarity: 'uncommon' },
  isis_doll:     { name: 'Isis Doll',     desc: 'Rare collectible.',   type: 'loot', sell: 2400, rarity: 'epic' },
  burning_heart: { name: 'Burning Heart', desc: 'Hot to touch.',       type: 'loot', sell: 220, rarity: 'uncommon' },
  rotten_bandage:{ name: 'Rotten Bandage',desc: 'Smelly.',             type: 'loot', sell: 90, rarity: 'common' },
  ice_cream:     { name: 'Ice Cream',     desc: 'Cool treat. +200 HP', type: 'pot', heal: 200, sell: 60, rarity: 'uncommon' },
  stem:          { name: 'Stem',          desc: 'Plant stem.',         type: 'loot', sell: 50, rarity: 'common' },
  little_horn:   { name: 'Little Horn',   desc: 'Demon horn.',         type: 'loot', sell: 350, rarity: 'uncommon' },
  tiger_skin:    { name: 'Tiger Skin',    desc: 'Boss material.',      type: 'loot', sell: 1200, rarity: 'rare' },
  crown:         { name: 'Crown',         desc: "King's headwear.",    type: 'loot', sell: 2500, rarity: 'epic' },
  ring_of_muscle:{ name: 'Ring of Muscle',desc: '+5 STR ring.',        type: 'equip', slot: 'accessory', mods: { str: 5 }, sell: 5000, rarity: 'epic' },
  rough_oridecon:{ name: 'Rough Oridecon',desc: 'Refine weapon (raw).',type: 'loot', sell: 300, rarity: 'uncommon' },
  rough_elunium: { name: 'Rough Elunium', desc: 'Refine armor (raw).', type: 'loot', sell: 300, rarity: 'uncommon' },
  emperium:      { name: 'Emperium',      desc: 'Sacred guild stone.', type: 'loot', sell: 8000, rarity: 'legendary' },
  // Cards (rare drops)
  poring_card:   { name: 'Poring Card',   desc: 'Card: +10 LUK if equipped.', type: 'loot', sell: 4000, rarity: 'rare' },
  fabre_card:    { name: 'Fabre Card',    desc: 'Card: +1 VIT, +100 HP.',     type: 'loot', sell: 4500, rarity: 'rare' },
  thief_bug_card:{ name: 'Thief Bug Card',desc: 'Card: +1 AGI.',              type: 'loot', sell: 4000, rarity: 'rare' },
  skeleton_card: { name: 'Skeleton Card', desc: 'Card: +9 ATK.',              type: 'loot', sell: 6000, rarity: 'rare' },
  zombie_card:   { name: 'Zombie Card',   desc: 'Card: +20% HP regen.',       type: 'loot', sell: 5500, rarity: 'rare' },
  goblin_card:   { name: 'Goblin Card',   desc: 'Card: +5 ATK vs Brute.',     type: 'loot', sell: 5000, rarity: 'rare' },
  poporing_card: { name: 'Poporing Card', desc: '+10% poison resist. (decor)', type: 'loot', sell: 8000, rarity: 'epic' },
  raydric_card:  { name: 'Raydric Card',  desc: 'Legendary card!',     type: 'loot', sell: 30000, rarity: 'legendary' },
  eddga_card:    { name: 'Eddga Card',    desc: 'Boss card!',          type: 'loot', sell: 25000, rarity: 'legendary' },
  osiris_card:   { name: 'Osiris Card',   desc: 'Boss card!',          type: 'loot', sell: 28000, rarity: 'legendary' },
  baphomet_card: { name: 'Baphomet Card', desc: 'Mythic card!',        type: 'loot', sell: 50000, rarity: 'mythic' },
  ghostring_card:{ name: 'Ghostring Card',desc: 'Mythic card!',        type: 'loot', sell: 48000, rarity: 'mythic' },

  // Equipment — Weapons
  dagger:        { name: 'Dagger',        desc: '+5 ATK.',  type: 'equip', slot: 'weapon', mods: { atk: 5 },  price: 200, sell: 30, rarity: 'common' },
  short_sword:   { name: 'Short Sword',   desc: '+12 ATK.', type: 'equip', slot: 'weapon', mods: { atk: 12 }, price: 800, sell: 120, rarity: 'common' },
  main_gauche:   { name: 'Main Gauche',   desc: '+10 ATK, +1 AGI.', type: 'equip', slot: 'weapon', mods: { atk: 10, agi: 1 }, price: 1200, sell: 160, rarity: 'uncommon' },
  long_sword:    { name: 'Long Sword',    desc: '+25 ATK.', type: 'equip', slot: 'weapon', mods: { atk: 25 }, price: 3000, sell: 380, rarity: 'uncommon' },
  great_sword:   { name: 'Great Sword',   desc: '+50 ATK.', type: 'equip', slot: 'weapon', mods: { atk: 50 }, price: 9500, sell: 1100, rarity: 'rare' },
  claymore:      { name: 'Claymore',      desc: '+70 ATK, +5 STR.', type: 'equip', slot: 'weapon', mods: { atk: 70, str: 5 }, price: 16000, sell: 2000, rarity: 'rare' },
  flamberge:     { name: 'Flamberge',     desc: '+90 ATK, +5% crit.', type: 'equip', slot: 'weapon', mods: { atk: 90, crit: 5 }, price: 30000, sell: 3500, rarity: 'epic' },
  bow:           { name: 'Bow',           desc: '+18 ATK, +3 DEX.', type: 'equip', slot: 'weapon', mods: { atk: 18, dex: 3 }, price: 1500, sell: 200, rarity: 'uncommon' },
  composite_bow: { name: 'Composite Bow', desc: '+45 ATK, +6 DEX.', type: 'equip', slot: 'weapon', mods: { atk: 45, dex: 6 }, price: 6500, sell: 700, rarity: 'rare' },
  gakkung_bow:   { name: 'Gakkung Bow',   desc: '+75 ATK, +8 DEX.', type: 'equip', slot: 'weapon', mods: { atk: 75, dex: 8 }, price: 22000, sell: 2600, rarity: 'epic' },
  rod:           { name: 'Rod',           desc: '+8 MATK.', type: 'equip', slot: 'weapon', mods: { matk: 8 }, price: 200, sell: 30, rarity: 'common' },
  wand:          { name: 'Wand',          desc: '+18 MATK, +1 INT.', type: 'equip', slot: 'weapon', mods: { matk: 18, int: 1 }, price: 1200, sell: 150, rarity: 'uncommon' },
  wizard_staff:  { name: 'Wizard Staff',  desc: '+30 MATK, +3 INT.', type: 'equip', slot: 'weapon', mods: { matk: 30, int: 3 }, price: 4000, sell: 500, rarity: 'rare' },
  archmage_staff:{ name: 'Archmage Staff',desc: '+70 MATK, +5 INT.', type: 'equip', slot: 'weapon', mods: { matk: 70, int: 5 }, price: 18000, sell: 2200, rarity: 'epic' },
  staff_of_thunder:{name:'Staff of Thunder',desc:'+100 MATK, +8 INT.',type:'equip', slot: 'weapon', mods: { matk: 100, int: 8 }, price: 42000, sell: 5000, rarity: 'legendary' },
  katana:        { name: 'Katana',        desc: '+30 ATK, +3 AGI.', type: 'equip', slot: 'weapon', mods: { atk: 30, agi: 3 }, price: 4500, sell: 550, rarity: 'rare' },
  jur:           { name: 'Jur',           desc: '+22 ATK, +4 LUK.', type: 'equip', slot: 'weapon', mods: { atk: 22, luk: 4 }, price: 3200, sell: 400, rarity: 'rare' },
  battle_axe:    { name: 'Battle Axe',    desc: '+38 ATK.', type: 'equip', slot: 'weapon', mods: { atk: 38 }, price: 5400, sell: 650, rarity: 'rare' },
  cotton_shirt:  { name: 'Cotton Shirt',  desc: '+4 DEF.',  type: 'equip', slot: 'armor', mods: { def: 4 }, price: 300, sell: 40, rarity: 'common' },
  leather_armor: { name: 'Leather Armor', desc: '+12 DEF.', type: 'equip', slot: 'armor', mods: { def: 12 }, price: 1500, sell: 200, rarity: 'uncommon' },
  chain_mail:    { name: 'Chain Mail',    desc: '+25 DEF, +20 max HP.', type: 'equip', slot: 'armor', mods: { def: 25, maxHp: 20 }, price: 5500, sell: 700, rarity: 'rare' },
  full_plate:    { name: 'Full Plate',    desc: '+45 DEF, +60 max HP.', type: 'equip', slot: 'armor', mods: { def: 45, maxHp: 60 }, price: 18000, sell: 2200, rarity: 'epic' },
  mithril_armor: { name: 'Mithril Armor', desc: '+60 DEF, +120 max HP, +2 AGI.', type: 'equip', slot: 'armor', mods: { def: 60, maxHp: 120, agi: 2 }, price: 36000, sell: 4500, rarity: 'legendary' },
  silk_robe:     { name: 'Silk Robe',     desc: '+8 DEF, +15 SP.', type: 'equip', slot: 'armor', mods: { def: 8, maxSp: 15 }, price: 1200, sell: 150, rarity: 'uncommon' },
  saints_robe:   { name: 'Saint Robe',    desc: '+22 DEF, +40 SP.', type: 'equip', slot: 'armor', mods: { def: 22, maxSp: 40 }, price: 7500, sell: 950, rarity: 'rare' },
  pantie:        { name: 'Pantie',        desc: '+8 DEF, +5 FLEE.', type: 'equip', slot: 'armor', mods: { def: 8, flee: 5 }, price: 1200, sell: 150, rarity: 'uncommon' },
  thief_clothes: { name: 'Thief Clothes', desc: '+12 DEF, +3 AGI.', type: 'equip', slot: 'armor', mods: { def: 12, agi: 3 }, price: 4500, sell: 600, rarity: 'rare' },
  ring:          { name: 'Ring',          desc: '+1 STR/INT.', type: 'equip', slot: 'accessory', mods: { str: 1, int: 1 }, price: 1500, sell: 200, rarity: 'uncommon' },
  earring:       { name: 'Earring',       desc: '+2 INT.', type: 'equip', slot: 'accessory', mods: { int: 2 }, price: 2500, sell: 350, rarity: 'uncommon' },
  glove:         { name: 'Glove',         desc: '+2 DEX.', type: 'equip', slot: 'accessory', mods: { dex: 2 }, price: 2500, sell: 350, rarity: 'uncommon' },
  belt:          { name: 'Belt',          desc: '+2 STR.', type: 'equip', slot: 'accessory', mods: { str: 2 }, price: 2500, sell: 350, rarity: 'uncommon' },
  clip:          { name: 'Clip',          desc: '+10 SP.', type: 'equip', slot: 'accessory', mods: { maxSp: 10 }, price: 3500, sell: 500, rarity: 'uncommon' },
  rosary:        { name: 'Rosary',        desc: '+3 INT, +5 LUK.', type: 'equip', slot: 'accessory', mods: { int: 3, luk: 5 }, price: 4800, sell: 600, rarity: 'rare' },
  brooch:        { name: 'Brooch',        desc: '+4 AGI.', type: 'equip', slot: 'accessory', mods: { agi: 4 }, price: 3800, sell: 480, rarity: 'rare' },
  red_glasses:   { name: 'Red Glasses',   desc: '+3 LUK, +2% crit.', type: 'equip', slot: 'accessory', mods: { luk: 3, crit: 2 }, price: 5200, sell: 650, rarity: 'rare' },
  bunny_band:    { name: 'Bunny Band',    desc: '+2 LUK, very fluffy.', type: 'equip', slot: 'accessory', mods: { luk: 2 }, sell: 1800, rarity: 'epic' },
};

// Each entry: { id, minLv, cat: 'pots' | 'weapons' | 'armor' | 'accessories' }
const SHOP = [
  // Potions / consumables
  { id: 'red_potion',   minLv: 1,  cat: 'pots' },
  { id: 'green_potion', minLv: 1,  cat: 'pots' },
  { id: 'apple',        minLv: 1,  cat: 'pots' },
  { id: 'orange_potion',minLv: 8,  cat: 'pots' },
  { id: 'blue_potion',  minLv: 10, cat: 'pots' },
  { id: 'yellow_potion',minLv: 25, cat: 'pots' },
  { id: 'awakening_potion', minLv: 28, cat: 'pots' },
  { id: 'white_potion', minLv: 45, cat: 'pots' },
  { id: 'berserk_potion', minLv: 50, cat: 'pots' },
  // Weapons
  { id: 'dagger',       minLv: 1,  cat: 'weapons' },
  { id: 'rod',          minLv: 1,  cat: 'weapons' },
  { id: 'short_sword',  minLv: 5,  cat: 'weapons' },
  { id: 'wand',         minLv: 6,  cat: 'weapons' },
  { id: 'bow',          minLv: 8,  cat: 'weapons' },
  { id: 'main_gauche',  minLv: 10, cat: 'weapons' },
  { id: 'long_sword',   minLv: 15, cat: 'weapons' },
  { id: 'wizard_staff', minLv: 18, cat: 'weapons' },
  { id: 'composite_bow',minLv: 22, cat: 'weapons' },
  { id: 'jur',          minLv: 18, cat: 'weapons' },
  { id: 'katana',       minLv: 22, cat: 'weapons' },
  { id: 'battle_axe',   minLv: 25, cat: 'weapons' },
  { id: 'great_sword',  minLv: 30, cat: 'weapons' },
  { id: 'claymore',     minLv: 36, cat: 'weapons' },
  { id: 'archmage_staff',minLv: 38, cat: 'weapons' },
  { id: 'gakkung_bow',  minLv: 40, cat: 'weapons' },
  { id: 'flamberge',    minLv: 45, cat: 'weapons' },
  { id: 'staff_of_thunder', minLv: 55, cat: 'weapons' },
  // Armor
  { id: 'cotton_shirt', minLv: 1,  cat: 'armor' },
  { id: 'leather_armor',minLv: 8,  cat: 'armor' },
  { id: 'silk_robe',    minLv: 10, cat: 'armor' },
  { id: 'pantie',       minLv: 12, cat: 'armor' },
  { id: 'chain_mail',   minLv: 22, cat: 'armor' },
  { id: 'thief_clothes',minLv: 26, cat: 'armor' },
  { id: 'saints_robe',  minLv: 30, cat: 'armor' },
  { id: 'full_plate',   minLv: 35, cat: 'armor' },
  { id: 'mithril_armor',minLv: 50, cat: 'armor' },
  // Accessories
  { id: 'ring',         minLv: 12, cat: 'accessories' },
  { id: 'earring',      minLv: 16, cat: 'accessories' },
  { id: 'glove',        minLv: 16, cat: 'accessories' },
  { id: 'belt',         minLv: 16, cat: 'accessories' },
  { id: 'clip',         minLv: 20, cat: 'accessories' },
  { id: 'brooch',       minLv: 24, cat: 'accessories' },
  { id: 'rosary',       minLv: 28, cat: 'accessories' },
  { id: 'red_glasses',  minLv: 32, cat: 'accessories' },
];

const SHOP_CATEGORIES = [
  { id: 'pots',        name: 'Potions' },
  { id: 'weapons',     name: 'Weapons' },
  { id: 'armor',       name: 'Armor' },
  { id: 'accessories', name: 'Accessories' },
];

const QUESTS = [
  { id: 'q_porings',   name: 'Poring Hunter',     desc: 'Defeat 10 Porings.',          target: { type: 'kill', monster: 'poring', count: 10 },  reward: { exp: 30, jexp: 20, zeny: 200 } },
  { id: 'q_jellopy',   name: 'Sticky Business',   desc: 'Collect 15 Jellopy.',          target: { type: 'collect', item: 'jellopy', count: 15 }, reward: { exp: 50, jexp: 30, zeny: 400 } },
  { id: 'q_fabres',    name: 'Caterpillar Cull',  desc: 'Defeat 15 Fabres.',           target: { type: 'kill', monster: 'fabre', count: 15 },   reward: { exp: 80, jexp: 50, zeny: 600 } },
  { id: 'q_orc',       name: 'Orcish Trouble',    desc: 'Defeat 10 Orc Warriors.',     target: { type: 'kill', monster: 'orc_warrior', count: 10 }, reward: { exp: 600, jexp: 380, zeny: 4000 } },
  { id: 'q_skeletons', name: 'Cleansing Payon',   desc: 'Defeat 20 Skeletons.',        target: { type: 'kill', monster: 'skeleton', count: 20 },  reward: { exp: 1500, jexp: 800, zeny: 5000 } },
  { id: 'q_eddga',     name: "Hunt of Eddga",      desc: 'Slay the boss Eddga.',        target: { type: 'kill', monster: 'eddga', count: 1 },     reward: { exp: 8000, jexp: 4000, zeny: 25000, item: 'oridecon' } },
  { id: 'q_osiris',    name: 'Pyramid Pharaoh',   desc: 'Defeat Osiris in the pyramids.', target: { type: 'kill', monster: 'osiris', count: 1 }, reward: { exp: 15000, jexp: 7500, zeny: 50000, item: 'elunium' } },
  { id: 'q_lvl30',     name: 'Apprentice Hero',   desc: 'Reach Base Level 30.',        target: { type: 'level', value: 30 }, reward: { exp: 1000, jexp: 600, zeny: 5000 } },
  { id: 'q_lvl50',     name: 'Veteran Hero',      desc: 'Reach Base Level 50.',        target: { type: 'level', value: 50 }, reward: { exp: 8000, jexp: 4000, zeny: 30000 } },
  { id: 'q_baphomet',  name: 'Slayer of Demons',  desc: 'Defeat the Demon Lord Baphomet.', target: { type: 'kill', monster: 'baphomet', count: 1 }, reward: { exp: 50000, jexp: 25000, zeny: 200000, item: 'baphomet_card' } },
];

// EXP curve: similar feel to RO with diminishing scaling
function expForBaseLevel(lv) {
  return Math.floor(50 * Math.pow(lv, 1.7) + 30 * lv);
}
function expForJobLevel(lv) {
  return Math.floor(40 * Math.pow(lv, 1.65) + 25 * lv);
}

// ----------------------------------------------------------------
// PAY-TO-WIN: Cash shop, top-up packages, gacha, VIP
// (this is a fan game with a pretend currency — no real billing)
// ----------------------------------------------------------------

// Premium equipment available only via Cash Shop or gacha. These are
// stronger than craftable gear of the same tier on purpose.
const CASH_ITEMS_DEF = {
  vip_card_7d:   { name: 'VIP Card (7 Days)', desc: '+50% EXP, +30% drop, +20% zeny while active.', type: 'voucher', rarity: 'legendary' },
  vip_card_30d:  { name: 'VIP Card (30 Days)',desc: '+50% EXP, +30% drop, +20% zeny while active.', type: 'voucher', rarity: 'legendary' },
  exp_scroll_2x: { name: 'EXP Scroll x2 (1h)', desc: 'Doubles EXP gain for 1 hour.', type: 'voucher', rarity: 'rare' },
  drop_scroll_2x:{ name: 'Drop Scroll x2 (1h)', desc: 'Doubles drop chance for 1 hour.', type: 'voucher', rarity: 'rare' },
  zeny_scroll_2x:{ name: 'Zeny Scroll x2 (1h)', desc: 'Doubles zeny earned for 1 hour.', type: 'voucher', rarity: 'rare' },
  bubble_gum:    { name: 'Bubble Gum (30m)',  desc: 'Doubles drop chance for 30 minutes.', type: 'voucher', rarity: 'rare' },
  battle_manual: { name: 'Battle Manual (30m)', desc: 'x1.5 EXP & JEXP for 30 minutes.', type: 'voucher', rarity: 'rare' },
  bloody_branch: { name: 'Bloody Branch',     desc: 'Summons a random boss right now.', type: 'voucher', rarity: 'epic' },
  reset_stone:   { name: 'Stat Reset Stone',  desc: 'Refunds all stat points.', type: 'voucher', rarity: 'epic' },
  skill_reset:   { name: 'Skill Reset Stone', desc: 'Refunds all skill points.', type: 'voucher', rarity: 'epic' },
  full_restore:  { name: 'Full Restore',      desc: 'Refill HP/SP instantly.', type: 'voucher', rarity: 'common' },
  // Premium equipment
  excalibur:     { name: 'Excalibur',         desc: '+200 ATK, +10 STR, +5% crit. (Cash)', type: 'equip', slot: 'weapon', mods: { atk: 200, str: 10, crit: 5 }, sell: 0, rarity: 'mythic' },
  staff_of_destruction: { name: 'Staff of Destruction', desc: '+200 MATK, +15 INT, +50 SP. (Cash)', type: 'equip', slot: 'weapon', mods: { matk: 200, int: 15, maxSp: 50 }, sell: 0, rarity: 'mythic' },
  valk_armor:    { name: 'Valkyrie Armor',    desc: '+120 DEF, +300 HP, +5 to all stats. (Cash)', type: 'equip', slot: 'armor', mods: { def: 120, maxHp: 300, str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5 }, sell: 0, rarity: 'mythic' },
  meginjard:     { name: "Megingjörð",        desc: '+40 STR, +200 max HP. Belt of giants. (Cash)', type: 'equip', slot: 'accessory', mods: { str: 40, maxHp: 200 }, sell: 0, rarity: 'mythic' },
  brisingamen:   { name: 'Brisingamen',       desc: '+6 to all stats, +200 SP. (Cash)', type: 'equip', slot: 'accessory', mods: { str: 6, agi: 6, vit: 6, int: 6, dex: 6, luk: 6, maxSp: 200 }, sell: 0, rarity: 'mythic' },
  golden_axe:    { name: 'Golden Axe',        desc: '+150 ATK, +20% zeny gain. (Cash)', type: 'equip', slot: 'weapon', mods: { atk: 150, zenyPctBonus: 0.20 }, sell: 0, rarity: 'legendary' },
  angel_wings:   { name: 'Angel Wings',       desc: '+30 DEF, +20% EXP gain. (Cash)', type: 'equip', slot: 'armor', mods: { def: 30, expPctBonus: 0.20, maxHp: 100 }, sell: 0, rarity: 'legendary' },
};

// Merge premium items into the master ITEMS table so equip/inventory work seamlessly.
for (const k of Object.keys(CASH_ITEMS_DEF)) ITEMS[k] = Object.assign({ cash: true }, CASH_ITEMS_DEF[k]);

// Top-up packages — simulated currency purchase (NOT real money).
const CASH_TOPUP = [
  { id: 'starter',  name: 'Starter Pouch',     coins: 100,    bonus: 0,    label: '$0.99'  },
  { id: 'small',    name: 'Adventurer Pouch',  coins: 500,    bonus: 50,   label: '$4.99'  },
  { id: 'medium',   name: 'Knight Chest',      coins: 1200,   bonus: 200,  label: '$9.99'  },
  { id: 'large',    name: 'Lord Chest',        coins: 2800,   bonus: 700,  label: '$19.99' },
  { id: 'mega',     name: 'Valkyrie Chest',    coins: 7500,   bonus: 2500, label: '$49.99' },
  { id: 'whale',    name: 'God Chest',         coins: 16000,  bonus: 6000, label: '$99.99' },
];

// Cash shop catalog — costs are in Kafra Coins (cash).
const CASH_SHOP = [
  // Buffs / boosters
  { id: 'battle_manual', cost: 60,    cat: 'buffs' },
  { id: 'bubble_gum',    cost: 80,    cat: 'buffs' },
  { id: 'exp_scroll_2x', cost: 120,   cat: 'buffs' },
  { id: 'drop_scroll_2x',cost: 150,   cat: 'buffs' },
  { id: 'zeny_scroll_2x',cost: 100,   cat: 'buffs' },
  { id: 'full_restore',  cost: 5,     cat: 'buffs' },
  { id: 'bloody_branch', cost: 50,    cat: 'buffs' },
  { id: 'reset_stone',   cost: 200,   cat: 'buffs' },
  { id: 'skill_reset',   cost: 200,   cat: 'buffs' },
  // VIP
  { id: 'vip_card_7d',   cost: 350,   cat: 'vip' },
  { id: 'vip_card_30d',  cost: 1200,  cat: 'vip' },
  // Premium gear
  { id: 'angel_wings',   cost: 1500,  cat: 'gear' },
  { id: 'golden_axe',    cost: 1800,  cat: 'gear' },
  { id: 'meginjard',     cost: 3500,  cat: 'gear' },
  { id: 'brisingamen',   cost: 4200,  cat: 'gear' },
  { id: 'excalibur',     cost: 6000,  cat: 'gear' },
  { id: 'staff_of_destruction', cost: 6000, cat: 'gear' },
  { id: 'valk_armor',    cost: 8500,  cat: 'gear' },
];

const CASH_CATEGORIES = [
  { id: 'buffs', name: 'Buffs & Scrolls' },
  { id: 'vip',   name: 'VIP' },
  { id: 'gear',  name: 'Premium Gear' },
  { id: 'gacha', name: 'Gacha 🎰' },
];

// Gacha — single & 10-pull. Probabilities sum need not be 1; engine renormalizes.
const GACHA = {
  cost: 100,        // per pull
  cost10: 900,      // 10-pull (10% off)
  pity: 50,         // 1 guaranteed legendary every 50 pulls
  pool: [
    // [itemId, weight, isFeatured]
    // common (junk loot)
    ['red_potion', 200],
    ['orange_potion', 150],
    ['yellow_potion', 80],
    ['white_potion', 30],
    ['blue_potion', 60],
    ['oridecon', 40],
    ['elunium', 40],
    // rare
    ['rosary', 25],
    ['brooch', 25],
    ['red_glasses', 22],
    ['claymore', 18],
    ['gakkung_bow', 18],
    ['katana', 18],
    ['saints_robe', 16],
    // epic
    ['flamberge', 8],
    ['archmage_staff', 8],
    ['mithril_armor', 6],
    ['bunny_band', 4],
    ['ring_of_muscle', 3],
    // legendary cash gear
    ['angel_wings', 0.8],
    ['golden_axe', 0.8],
    // mythic
    ['excalibur', 0.18],
    ['staff_of_destruction', 0.18],
    ['valk_armor', 0.12],
    ['meginjard', 0.10],
    ['brisingamen', 0.10],
    ['baphomet_card', 0.06],
    ['ghostring_card', 0.06],
  ],
};

// Daily login rewards for Kafra Coins (free for everyone every 20h)
const DAILY_REWARD = { coins: 25, label: 'Daily Login: +25 Kafra Coins' };
const DAILY_COOLDOWN_MS = 20 * 3600 * 1000;
