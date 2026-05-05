/* Ragnarok Idle — game logic */
(() => {
  'use strict';

  const SAVE_KEY = 'ragnarok_idle_save_v1';
  const TICK_MS = 100;

  const $ = (id) => document.getElementById(id);
  const el = (sel, root = document) => root.querySelector(sel);
  const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const irand = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---------------- State ----------------
  const defaultState = () => ({
    name: 'Adventurer',
    job: 'Novice',
    baseLv: 1,
    jobLv: 1,
    exp: 0,
    jexp: 0,
    statPoints: 0,
    skillPoints: 0,
    stats: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 },
    hp: 40, sp: 10, maxHp: 40, maxSp: 10,
    zeny: 50,
    skills: { basic_attack: 1 }, // skillId -> level
    inventory: {}, // itemId -> count
    equipment: { weapon: null, armor: null, accessory: null },
    mapId: 'prt_fild',
    auto: true,
    questsActive: {},   // id -> progress
    questsDone: {},     // id -> true
    killCounts: {},     // monsterId -> count
    lastTs: Date.now(),
    log: [],
  });

  let state = defaultState();
  let pendingJob = null;

  // ---------------- Derivations ----------------
  function jobDef() { return JOBS[state.job] || JOBS.Novice; }

  function aggregateEquipMods() {
    const acc = {};
    for (const slot of Object.keys(state.equipment)) {
      const id = state.equipment[slot];
      if (!id) continue;
      const item = ITEMS[id];
      if (!item || !item.mods) continue;
      for (const k of Object.keys(item.mods)) acc[k] = (acc[k] || 0) + item.mods[k];
    }
    return acc;
  }

  function passiveBonuses() {
    // Aggregate stat-buff from passive skills
    const out = {
      str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0,
      atkPct: 0, defPct: 0, aspdPct: 0, doubleAtk: 0,
      zenyPct: 0, lukPct: 0, discount: 0, maxHpFlat: 0, spRegenPct: 0,
    };
    for (const id of Object.keys(state.skills)) {
      const lv = state.skills[id];
      const sk = SKILLS[id];
      if (!sk || sk.type !== 'passive' || lv <= 0) continue;
      const v = (sk.scale || 0) * lv;
      switch (sk.stat) {
        case 'dex': out.dex += v; break;
        case 'sid': out.str += v; out.int += v; out.dex += v; break;
        case 'atkPct': out.atkPct += v; break;
        case 'defPct': out.defPct += v; break;
        case 'aspdPct': out.aspdPct += v; break;
        case 'doubleAtk': out.doubleAtk += v; break;
        case 'zenyPct': out.zenyPct += v; break;
        case 'lukPct': out.luk += v; break;
        case 'discount': out.discount += v; break;
        case 'maxHpFlat': out.maxHpFlat += v; break;
        case 'spRegenPct': out.spRegenPct += v; break;
      }
    }
    return out;
  }

  function effStats() {
    const s = { ...state.stats };
    const eq = aggregateEquipMods();
    const pa = passiveBonuses();
    for (const k of Object.keys(s)) s[k] += (eq[k] || 0) + Math.floor(pa[k] || 0);
    return s;
  }

  function computeDerived() {
    const j = jobDef();
    const s = effStats();
    const eq = aggregateEquipMods();
    const pa = passiveBonuses();
    const lv = state.baseLv;

    const baseHp = j.base.hp + (j.grow.hpPerVit * s.vit) + (j.grow.hpPerLv * (lv - 1));
    const baseSp = j.base.sp + (j.grow.spPerInt * s.int) + (j.grow.spPerLv * (lv - 1));
    const maxHp = Math.floor(baseHp + (eq.maxHp || 0) + (pa.maxHpFlat || 0));
    const maxSp = Math.floor(baseSp + (eq.maxSp || 0));

    const baseAtk = j.base.atk + (j.grow.atkPerStr || 1) * s.str + (j.grow.atkPerDex ? j.grow.atkPerDex * s.dex : 0);
    const atk = Math.floor((baseAtk + (eq.atk || 0)) * (1 + (pa.atkPct || 0)));
    const matk = Math.floor(j.base.matk + (j.grow.matkPerInt || 1) * s.int + (eq.matk || 0));
    const def = Math.floor((j.base.def + s.vit * 0.5 + (eq.def || 0)) * (1 + (pa.defPct || 0)));
    const hit = Math.floor(j.base.hit + s.dex * 0.8 + lv * 0.5 + (eq.hit || 0));
    const flee = Math.floor(j.base.flee + s.agi * 0.9 + lv * 0.5 + (eq.flee || 0));
    const crit = Math.max(1, Math.floor(j.base.crit + s.luk * 0.3 + (eq.crit || 0)));
    const aspd = (j.base.aspd + s.agi * 0.012 + s.dex * 0.004) * (1 + (pa.aspdPct || 0));

    return { maxHp, maxSp, atk, matk, def, hit, flee, crit, aspd, doubleAtk: pa.doubleAtk || 0,
             zenyPct: pa.zenyPct || 0, discount: pa.discount || 0, spRegenPct: pa.spRegenPct || 0 };
  }

  // ---------------- Combat ----------------
  let enemy = null;
  function spawnEnemy() {
    const map = MAPS.find(m => m.id === state.mapId) || MAPS[0];
    let monsterId;
    // Boss appears every 25 kills on a map (if defined)
    const mapKills = state.killCounts['_map_' + map.id] || 0;
    if (map.boss && mapKills > 0 && mapKills % 25 === 0) {
      monsterId = map.boss;
    } else {
      monsterId = pick(map.monsters);
    }
    const tpl = MONSTERS[monsterId];
    const lv = Math.max(1, map.minLv + irand(-1, 2));
    const scale = 1 + (map.minLv - 1) * 0.04;
    enemy = {
      id: monsterId,
      name: tpl.name,
      emoji: tpl.emoji,
      lv,
      maxHp: Math.floor(tpl.hp * scale),
      hp: Math.floor(tpl.hp * scale),
      atk: Math.floor(tpl.atk * scale),
      def: Math.floor(tpl.def * scale),
      exp: Math.floor(tpl.exp * scale),
      jexp: Math.floor(tpl.jexp * scale),
      zeny: tpl.zeny.map(v => Math.floor(v * scale)),
      drops: tpl.drops || [],
      boss: !!tpl.boss,
      attackTimer: 0,
      attackInterval: 1.4 + Math.random() * 0.6,
    };
    UI.renderEnemy();
    UI.spawnFx();
  }

  // damage formula
  function rollDamage(attacker, defender, opts = {}) {
    const isMagic = !!opts.magic;
    const power = opts.power || 1.0;
    const baseAtk = isMagic ? (attacker.matk || 0) : (attacker.atk || 0);
    const variance = rand(0.85, 1.15);
    let dmg = (baseAtk * power * variance) - (defender.def || 0) * (isMagic ? 0.25 : 0.85);
    if (dmg < 1) dmg = Math.max(1, Math.floor(baseAtk * 0.05));
    return Math.floor(Math.max(1, dmg));
  }

  function heroAttacks(skillId = 'basic_attack') {
    if (!enemy || enemy.hp <= 0) return;
    const d = computeDerived();
    const sk = SKILLS[skillId] || SKILLS.basic_attack;
    const skLv = state.skills[skillId] || 1;

    if (sk.sp && state.sp < sk.sp) {
      // fall back to basic attack
      return heroAttacks('basic_attack');
    }
    if (sk.zenyCost && state.zeny < sk.zenyCost) {
      return heroAttacks('basic_attack');
    }
    if (sk.sp) state.sp = Math.max(0, state.sp - sk.sp);
    if (sk.zenyCost) state.zeny = Math.max(0, state.zeny - sk.zenyCost);

    // Special: Asura Strike — spend all SP for huge damage
    if (skillId === 'asura_strike') {
      const burned = state.sp;
      state.sp = 0;
      const dmg = Math.floor((d.atk + d.matk) * (3 + skLv * 0.5) + burned * 4);
      enemy.hp -= dmg;
      UI.float(`${dmg}`, 'crit', 'enemy');
      log(`Asura Strike! ${dmg} damage.`, 'ok');
      UI.swing(); UI.hit();
      if (enemy.hp <= 0) onEnemyDead();
      return;
    }

    // Hit/Flee
    const hitChance = clamp(0.7 + (d.hit - (enemy.lv * 0.8)) / 100, 0.5, 0.99);
    if (Math.random() > hitChance) {
      UI.float('MISS', 'miss', 'enemy');
      return;
    }
    // Crit
    const isCrit = Math.random() * 100 < d.crit;
    let power = sk.power || 1;
    if (sk.scale && skLv > 0 && skillId !== 'basic_attack') power = (sk.power || 1) + sk.scale * (skLv - 1);
    const isMagic = sk.type === 'magic' || sk.type === 'heal';
    if (sk.type === 'heal') {
      const heal = Math.floor(d.matk * (sk.power || 4) * (1 + (skLv - 1) * (sk.scale || 0.5)));
      state.hp = Math.min(d.maxHp, state.hp + heal);
      UI.float(`+${heal}`, 'heal', 'hero');
      log(`${state.name} heals ${heal} HP.`, 'ok');
      return;
    }

    let dmg = rollDamage({ atk: d.atk, matk: d.matk }, { def: enemy.def }, { magic: isMagic, power });
    if (isCrit) dmg = Math.floor(dmg * 1.6);
    enemy.hp -= dmg;
    UI.swing();
    UI.hit();
    UI.float(`${dmg}`, isCrit ? 'crit' : 'dmg', 'enemy');

    // Double attack chance
    if (skillId === 'basic_attack' && d.doubleAtk > 0 && Math.random() < d.doubleAtk && enemy.hp > 0) {
      const d2 = rollDamage({ atk: d.atk, matk: d.matk }, { def: enemy.def }, { magic: false, power: 1 });
      enemy.hp -= d2;
      setTimeout(() => UI.float(`${d2}`, 'dmg', 'enemy'), 120);
    }

    if (enemy.hp <= 0) onEnemyDead();
  }

  function chooseHeroSkill() {
    const d = computeDerived();
    const ownedAttack = Object.keys(state.skills).filter(id => {
      const sk = SKILLS[id]; if (!sk) return false;
      if (sk.type === 'passive' || sk.type === 'heal' || sk.type === 'special') return false;
      const lv = state.skills[id] || 0; if (lv <= 0) return false;
      if (sk.sp && state.sp < sk.sp) return false;
      if (sk.zenyCost && state.zeny < sk.zenyCost) return false;
      return true;
    });
    // Heal if low and have it
    if (state.skills.heal > 0 && state.hp < d.maxHp * 0.4 && state.sp >= SKILLS.heal.sp) {
      return 'heal';
    }
    // Asura on bosses if available with full sp
    if (state.skills.asura_strike > 0 && enemy && enemy.boss && state.sp >= 60) return 'asura_strike';
    // Prefer the strongest attack (most power*scale*lv)
    let best = 'basic_attack';
    let bestScore = 0.9;
    for (const id of ownedAttack) {
      const sk = SKILLS[id];
      const lv = state.skills[id];
      const score = (sk.power || 1) + (sk.scale || 0) * (lv - 1);
      if (score > bestScore) { bestScore = score; best = id; }
    }
    return best;
  }

  function enemyAttacks(dt) {
    if (!enemy || enemy.hp <= 0 || state.hp <= 0) return;
    enemy.attackTimer += dt;
    if (enemy.attackTimer < enemy.attackInterval) return;
    enemy.attackTimer = 0;

    const d = computeDerived();
    const fleeChance = clamp((d.flee - (enemy.lv * 1.0)) / 200, 0.05, 0.6);
    if (Math.random() < fleeChance) {
      UI.float('MISS', 'miss', 'hero');
      return;
    }
    let dmg = rollDamage({ atk: enemy.atk }, { def: d.def }, {});
    state.hp -= dmg;
    UI.float(`${dmg}`, 'dmg', 'hero');
    if (state.hp <= 0) {
      state.hp = 0;
      log(`${state.name} fell in battle... reviving in town.`, 'bad');
      // Penalty: lose a bit of exp
      state.exp = Math.max(0, state.exp - Math.floor(expForBaseLevel(state.baseLv) * 0.02));
      setTimeout(() => {
        state.hp = computeDerived().maxHp;
        state.sp = computeDerived().maxSp;
        spawnEnemy();
        UI.renderAll();
      }, 1200);
    }
  }

  function onEnemyDead() {
    if (!enemy) return;
    const d = computeDerived();
    const expGain = enemy.exp;
    const jexpGain = enemy.jexp;
    const zenyBase = irand(enemy.zeny[0], enemy.zeny[1]);
    const zenyGain = Math.floor(zenyBase * (1 + (d.zenyPct || 0)));
    state.exp += expGain;
    state.jexp += jexpGain;
    state.zeny += zenyGain;
    log(`Defeated <b>${enemy.name}</b>! +${expGain} EXP, +${jexpGain} JEXP, +${zenyGain} z`, 'ok');
    UI.float(`+${expGain}`, 'exp', 'enemy');
    UI.float(`+${zenyGain}z`, 'zeny', 'enemy');

    // Drop loot
    for (const [itemId, chance] of (enemy.drops || [])) {
      const lukBoost = 1 + (effStats().luk * 0.001);
      if (Math.random() < chance * lukBoost) {
        addItem(itemId, 1);
        UI.float(`${ITEMS[itemId]?.name || itemId}!`, 'drop', 'enemy');
        log(`Looted <b>${ITEMS[itemId]?.name || itemId}</b>.`, 'info');
      }
    }

    // Track kill counts
    state.killCounts[enemy.id] = (state.killCounts[enemy.id] || 0) + 1;
    const map = MAPS.find(m => m.id === state.mapId);
    if (map) state.killCounts['_map_' + map.id] = (state.killCounts['_map_' + map.id] || 0) + 1;

    progressQuests();
    UI.dieEffect();
    const deadId = enemy.id;
    enemy = null;
    checkLevelUp();
    setTimeout(() => { spawnEnemy(); UI.renderAll(); }, 500);
  }

  function checkLevelUp() {
    let leveled = false;
    while (state.exp >= expForBaseLevel(state.baseLv)) {
      state.exp -= expForBaseLevel(state.baseLv);
      state.baseLv += 1;
      state.statPoints += 3 + Math.floor(state.baseLv / 10);
      leveled = true;
      log(`<b>Base Level Up!</b> You are now Lv ${state.baseLv}.`, 'ok');
      toast(`Level Up! Lv ${state.baseLv}`);
    }
    while (state.jexp >= expForJobLevel(state.jobLv)) {
      state.jexp -= expForJobLevel(state.jobLv);
      state.jobLv += 1;
      state.skillPoints += 1;
      leveled = true;
      log(`<b>Job Level Up!</b> Now Job Lv ${state.jobLv}.`, 'ok');
    }
    if (leveled) {
      // Refill on level up
      const d = computeDerived();
      state.hp = d.maxHp;
      state.sp = d.maxSp;
    }
    UI.renderJobChange();
  }

  // ---------------- Quests ----------------
  function progressQuests() {
    let updated = false;
    for (const q of QUESTS) {
      if (state.questsDone[q.id]) continue;
      if (!state.questsActive[q.id]) state.questsActive[q.id] = 0;
      const t = q.target;
      let progress = state.questsActive[q.id];
      if (t.type === 'kill') {
        if (enemy && enemy.id === t.monster) progress = Math.min(t.count, progress + 1);
      } else if (t.type === 'collect') {
        progress = Math.min(t.count, state.inventory[t.item] || 0);
      } else if (t.type === 'level') {
        progress = state.baseLv;
      }
      if (progress !== state.questsActive[q.id]) {
        state.questsActive[q.id] = progress;
        updated = true;
      }
    }
    if (updated) UI.renderQuests();
  }

  function claimQuest(qid) {
    const q = QUESTS.find(x => x.id === qid);
    if (!q || state.questsDone[qid]) return;
    let done = false;
    const t = q.target;
    if (t.type === 'kill' && (state.questsActive[qid] || 0) >= t.count) done = true;
    if (t.type === 'collect' && (state.inventory[t.item] || 0) >= t.count) {
      // consume items
      removeItem(t.item, t.count);
      done = true;
    }
    if (t.type === 'level' && state.baseLv >= t.value) done = true;
    if (!done) return;
    state.questsDone[qid] = true;
    const r = q.reward;
    if (r.exp) state.exp += r.exp;
    if (r.jexp) state.jexp += r.jexp;
    if (r.zeny) state.zeny += r.zeny;
    if (r.item) addItem(r.item, 1);
    log(`Quest complete: <b>${q.name}</b> — rewards granted.`, 'ok');
    toast(`Quest: ${q.name}!`);
    checkLevelUp();
    UI.renderAll();
  }

  // ---------------- Inventory / Shop ----------------
  function addItem(id, n = 1) {
    state.inventory[id] = (state.inventory[id] || 0) + n;
  }
  function removeItem(id, n = 1) {
    if (!state.inventory[id]) return false;
    state.inventory[id] -= n;
    if (state.inventory[id] <= 0) delete state.inventory[id];
    return true;
  }

  function buy(id) {
    const it = ITEMS[id];
    if (!it || !it.price) return;
    const d = computeDerived();
    const price = Math.max(1, Math.floor(it.price * (1 - (d.discount || 0))));
    if (state.zeny < price) { toast('Not enough Zeny'); return; }
    state.zeny -= price;
    addItem(id, 1);
    log(`Bought <b>${it.name}</b> for ${price} z.`, 'info');
    UI.renderAll();
  }

  function sell(id) {
    const it = ITEMS[id];
    if (!it || !it.sell) return;
    if (!removeItem(id, 1)) return;
    state.zeny += it.sell;
    log(`Sold <b>${it.name}</b> for ${it.sell} z.`, 'info');
    UI.renderAll();
  }

  function useItem(id) {
    const it = ITEMS[id];
    if (!it || it.type !== 'pot') return;
    const d = computeDerived();
    if (it.heal) state.hp = Math.min(d.maxHp, state.hp + it.heal);
    if (it.healSp) state.sp = Math.min(d.maxSp, state.sp + it.healSp);
    removeItem(id, 1);
    log(`Used <b>${it.name}</b>.`, 'info');
    UI.renderAll();
  }

  function equipItem(id) {
    const it = ITEMS[id]; if (!it || it.type !== 'equip') return;
    const slot = it.slot;
    const prev = state.equipment[slot];
    state.equipment[slot] = id;
    removeItem(id, 1);
    if (prev) addItem(prev, 1);
    log(`Equipped <b>${it.name}</b>.`, 'info');
    // Refill HP/SP after stat change to avoid weirdness
    const d = computeDerived();
    state.hp = Math.min(state.hp, d.maxHp);
    state.sp = Math.min(state.sp, d.maxSp);
    UI.renderAll();
  }

  function unequipSlot(slot) {
    const id = state.equipment[slot];
    if (!id) return;
    addItem(id, 1);
    state.equipment[slot] = null;
    UI.renderAll();
  }

  // ---------------- Stats / Skills ----------------
  function statCost(curr) {
    if (curr < 10) return 1;
    if (curr < 30) return 2;
    if (curr < 60) return 3;
    if (curr < 90) return 5;
    return 8;
  }

  function addStat(stat) {
    const cur = state.stats[stat];
    const cost = statCost(cur);
    if (state.statPoints < cost) { toast('Not enough Stat Points'); return; }
    state.statPoints -= cost;
    state.stats[stat] = cur + 1;
    UI.renderAll();
  }

  function levelSkill(id) {
    const sk = SKILLS[id]; if (!sk) return;
    const allowed = (jobDef().skills || []).includes(id);
    if (!allowed) { toast('Skill not available for class'); return; }
    if (sk.fixed) return;
    const cur = state.skills[id] || 0;
    if (cur >= sk.max) { toast('Max level'); return; }
    if (state.skillPoints < (sk.cost || 1)) { toast('Not enough Skill Points'); return; }
    state.skillPoints -= (sk.cost || 1);
    state.skills[id] = cur + 1;
    log(`Learned <b>${sk.name}</b> Lv ${cur + 1}.`, 'ok');
    UI.renderAll();
  }

  function jobChange() {
    const adv = jobDef().advances || [];
    if (adv.length === 0) { toast('Already at maximum class'); return; }
    if (state.jobLv < 10) { toast('Need Job Lv 10'); return; }
    // Simple: pick first advance for novice; for first job, prompt user
    let target = adv[0];
    if (state.job === 'Novice') {
      target = pendingJob || adv[0];
    } else if (adv.length > 1) {
      const choice = prompt(`Choose advanced class:\n${adv.map((a, i) => `${i + 1}. ${a}`).join('\n')}\nEnter 1-${adv.length}:`, '1');
      const idx = parseInt(choice, 10);
      if (isNaN(idx) || idx < 1 || idx > adv.length) return;
      target = adv[idx - 1];
    }
    state.job = target;
    state.jobLv = 1;
    state.jexp = 0;
    log(`<b>Class changed to ${target}!</b>`, 'ok');
    toast(`Now a ${target}!`);
    // Heal/refill
    const d = computeDerived();
    state.hp = d.maxHp; state.sp = d.maxSp;
    UI.renderAll();
  }

  // ---------------- Idle / Loop ----------------
  let lastSwingTimer = 0;
  let spRegenTimer = 0;
  let hpRegenTimer = 0;

  function tick(dtMs) {
    const dt = dtMs / 1000;

    // Spawn enemy if none
    if (!enemy) spawnEnemy();

    // Hero auto attack
    if (state.auto && enemy && enemy.hp > 0 && state.hp > 0) {
      const d = computeDerived();
      lastSwingTimer += dt;
      const swingTime = 1 / clamp(d.aspd, 0.4, 5);
      while (lastSwingTimer >= swingTime) {
        lastSwingTimer -= swingTime;
        const skId = chooseHeroSkill();
        heroAttacks(skId);
        if (!enemy || enemy.hp <= 0) break;
      }
    }

    // Enemy attacks
    enemyAttacks(dt);

    // Regen
    const d = computeDerived();
    hpRegenTimer += dt;
    if (hpRegenTimer >= 2.0) {
      hpRegenTimer = 0;
      const reg = Math.max(1, Math.floor(d.maxHp * 0.01) + Math.floor(effStats().vit * 0.2));
      state.hp = Math.min(d.maxHp, state.hp + reg);
    }
    spRegenTimer += dt;
    if (spRegenTimer >= 2.5) {
      spRegenTimer = 0;
      const reg = Math.max(1, Math.floor(d.maxSp * (0.02 + (d.spRegenPct || 0))) + Math.floor(effStats().int * 0.1));
      state.sp = Math.min(d.maxSp, state.sp + reg);
    }

    UI.updateBars();
  }

  function offlineCatchup() {
    const now = Date.now();
    let dt = (now - state.lastTs) / 1000;
    state.lastTs = now;
    if (dt < 5) return; // ignore tiny gaps
    dt = Math.min(dt, 12 * 3600); // cap at 12 hours
    // Simulate a simplified idle gain: estimate kills per second from current map
    const map = MAPS.find(m => m.id === state.mapId) || MAPS[0];
    const monsterId = map.monsters[0];
    const tpl = MONSTERS[monsterId];
    const scale = 1 + (map.minLv - 1) * 0.04;
    const d = computeDerived();
    const dps = Math.max(1, d.atk * d.aspd);
    const ehp = tpl.hp * scale * 1.2;
    const killsPerSec = clamp(dps / ehp, 0.05, 5);
    const kills = Math.floor(killsPerSec * dt * 0.6); // 60% efficiency offline
    if (kills <= 0) return;
    const expG = Math.floor(tpl.exp * scale * kills);
    const jexpG = Math.floor(tpl.jexp * scale * kills);
    const zenyG = Math.floor(((tpl.zeny[0] + tpl.zeny[1]) / 2) * scale * kills * (1 + (d.zenyPct || 0)));
    state.exp += expG; state.jexp += jexpG; state.zeny += zenyG;
    state.killCounts[monsterId] = (state.killCounts[monsterId] || 0) + kills;
    state.killCounts['_map_' + map.id] = (state.killCounts['_map_' + map.id] || 0) + kills;
    log(`<b>Offline progress</b>: ${formatTime(dt)} away. ~${kills} kills, +${expG} EXP, +${zenyG} z.`, 'info');
    toast(`Offline +${expG} EXP, +${zenyG}z`);
    checkLevelUp();
  }

  function formatTime(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // ---------------- UI ----------------
  const UI = {
    renderAll() {
      this.renderTop();
      this.renderChar();
      this.renderEnemy();
      this.renderMaps();
      this.renderSkills();
      this.renderInventory();
      this.renderShop();
      this.renderQuests();
      this.renderJobChange();
      this.updateBars();
    },
    renderTop() {
      $('zeny').textContent = state.zeny.toLocaleString();
      $('baseLv').textContent = state.baseLv;
      $('jobLv').textContent = state.jobLv;
      $('statPts').textContent = state.statPoints;
      $('skillPts').textContent = state.skillPoints;
    },
    renderChar() {
      const j = jobDef();
      $('charPortrait').textContent = j.emoji;
      $('charNameOut').textContent = state.name;
      $('charJobOut').textContent = j.name;
      const s = effStats();
      $('statStr').textContent = s.str;
      $('statAgi').textContent = s.agi;
      $('statVit').textContent = s.vit;
      $('statInt').textContent = s.int;
      $('statDex').textContent = s.dex;
      $('statLuk').textContent = s.luk;
      const d = computeDerived();
      $('cAtk').textContent = d.atk;
      $('cMatk').textContent = d.matk;
      $('cDef').textContent = d.def;
      $('cHit').textContent = d.hit;
      $('cFlee').textContent = d.flee;
      $('cCrit').textContent = d.crit + '%';
      $('cAspd').textContent = d.aspd.toFixed(2) + '/s';
      // Equipment
      $('eqWeapon').textContent = state.equipment.weapon ? ITEMS[state.equipment.weapon].name : '—';
      $('eqArmor').textContent = state.equipment.armor ? ITEMS[state.equipment.armor].name : '—';
      $('eqAccessory').textContent = state.equipment.accessory ? ITEMS[state.equipment.accessory].name : '—';
    },
    renderEnemy() {
      if (!enemy) return;
      $('enemySprite').textContent = enemy.emoji;
      $('enemyName').textContent = enemy.name + (enemy.boss ? ' ⚜' : '');
      $('enemyLv').textContent = `Lv ${enemy.lv}` + (enemy.boss ? ' · BOSS' : '');
    },
    spawnFx() {
      const sp = $('enemySprite');
      sp.classList.remove('dying');
      sp.classList.add('spawn');
      setTimeout(() => sp.classList.remove('spawn'), 350);
    },
    swing() {
      const h = $('heroSprite');
      h.classList.remove('swing'); void h.offsetWidth;
      h.classList.add('swing');
    },
    hit() {
      const e = $('enemySprite');
      e.classList.remove('hit'); void e.offsetWidth;
      e.classList.add('hit');
    },
    dieEffect() {
      const e = $('enemySprite');
      e.classList.add('dying');
    },
    float(text, kind, side) {
      const root = $('floaters');
      const div = document.createElement('div');
      div.className = `float ${kind}`;
      div.innerHTML = text;
      const arenaW = root.offsetWidth || 600;
      const x = side === 'enemy' ? arenaW - 90 + irand(-30, 30) : 80 + irand(-30, 30);
      const y = 90 + irand(-30, 30);
      div.style.left = x + 'px';
      div.style.top = y + 'px';
      root.appendChild(div);
      setTimeout(() => div.remove(), 900);
    },
    updateBars() {
      const d = computeDerived();
      const hpPct = clamp(state.hp / d.maxHp, 0, 1) * 100;
      const spPct = clamp(state.sp / d.maxSp, 0, 1) * 100;
      $('hpFill').style.width = hpPct + '%';
      $('spFill').style.width = spPct + '%';
      $('hpText').textContent = `${Math.floor(state.hp)}/${d.maxHp}`;
      $('spText').textContent = `${Math.floor(state.sp)}/${d.maxSp}`;
      const eNeed = expForBaseLevel(state.baseLv);
      const jNeed = expForJobLevel(state.jobLv);
      $('expFill').style.width = clamp(state.exp / eNeed, 0, 1) * 100 + '%';
      $('jexpFill').style.width = clamp(state.jexp / jNeed, 0, 1) * 100 + '%';
      $('expText').textContent = `EXP ${Math.floor(state.exp / eNeed * 100)}%`;
      $('jexpText').textContent = `JOB ${Math.floor(state.jexp / jNeed * 100)}%`;
      if (enemy) {
        const ePct = clamp(enemy.hp / enemy.maxHp, 0, 1) * 100;
        $('enemyHpFill').style.width = ePct + '%';
        $('enemyHpText').textContent = `${Math.max(0, Math.floor(enemy.hp))}/${enemy.maxHp}`;
      }
      $('zeny').textContent = state.zeny.toLocaleString();
      $('baseLv').textContent = state.baseLv;
      $('jobLv').textContent = state.jobLv;
      $('statPts').textContent = state.statPoints;
      $('skillPts').textContent = state.skillPoints;
    },
    renderMaps() {
      const wrap = $('mapTabs');
      wrap.innerHTML = '';
      for (const m of MAPS) {
        const b = document.createElement('button');
        b.textContent = m.name;
        const locked = state.baseLv < m.minLv;
        if (m.id === state.mapId) b.classList.add('active');
        if (locked) b.classList.add('locked');
        b.title = locked ? `Requires Lv ${m.minLv}` : `${m.name} (Lv ${m.minLv}+)`;
        b.onclick = () => {
          if (locked) { toast(`Need Lv ${m.minLv}`); return; }
          state.mapId = m.id;
          enemy = null;
          $('mapName').textContent = m.name;
          $('arena').dataset.biome = m.biome;
          UI.renderMaps();
        };
        wrap.appendChild(b);
      }
      const cur = MAPS.find(m => m.id === state.mapId) || MAPS[0];
      $('mapName').textContent = cur.name;
      $('arena').dataset.biome = cur.biome;
    },
    renderSkills() {
      const list = $('skillList');
      list.innerHTML = '';
      const allowed = (jobDef().skills || []);
      for (const id of allowed) {
        const sk = SKILLS[id]; if (!sk) continue;
        const lv = state.skills[id] || 0;
        const li = document.createElement('li');
        li.className = 'skill';
        if (sk.fixed) {
          li.innerHTML = `
            <div><div class="sk-name">${sk.name}</div><div class="sk-lvl">Lv ${Math.max(1, lv)}</div></div>
            <div></div>
            <div class="sk-desc">${sk.desc}</div>`;
        } else {
          li.innerHTML = `
            <div><div class="sk-name">${sk.name}</div><div class="sk-lvl">Lv ${lv}/${sk.max}${sk.sp ? ' · '+sk.sp+' SP' : ''}</div></div>
            <div><button data-skill="${id}" ${lv >= sk.max || state.skillPoints < (sk.cost || 1) ? 'disabled' : ''}>+ (${sk.cost || 1})</button></div>
            <div class="sk-desc">${sk.desc}</div>`;
        }
        list.appendChild(li);
      }
      els('button[data-skill]', list).forEach(b => {
        b.onclick = () => levelSkill(b.dataset.skill);
      });
    },
    renderInventory() {
      const list = $('invList');
      list.innerHTML = '';
      const ids = Object.keys(state.inventory);
      if (ids.length === 0) {
        list.innerHTML = `<li class="inv-item"><div class="iname">Empty</div><div></div><div class="idesc">Defeat monsters to find loot.</div></li>`;
      }
      for (const id of ids) {
        const it = ITEMS[id]; if (!it) continue;
        const cnt = state.inventory[id];
        const li = document.createElement('li');
        li.className = 'inv-item';
        const actions = [];
        if (it.type === 'pot') actions.push(`<button data-act="use" data-id="${id}">Use</button>`);
        if (it.type === 'equip') actions.push(`<button data-act="equip" data-id="${id}">Equip</button>`);
        if (it.sell) actions.push(`<button data-act="sell" data-id="${id}">Sell ${it.sell}z</button>`);
        li.innerHTML = `
          <div class="iname">${it.name} ×${cnt}</div>
          <div class="actions">${actions.join('')}</div>
          <div class="idesc">${it.desc}</div>`;
        list.appendChild(li);
      }
      els('button[data-act]', list).forEach(b => {
        b.onclick = () => {
          const id = b.dataset.id;
          if (b.dataset.act === 'use') useItem(id);
          else if (b.dataset.act === 'equip') equipItem(id);
          else if (b.dataset.act === 'sell') sell(id);
        };
      });
    },
    renderShop() {
      const list = $('shopList');
      list.innerHTML = '';
      const d = computeDerived();
      for (const s of SHOP) {
        if (state.baseLv < s.minLv) continue;
        const it = ITEMS[s.id];
        const price = Math.max(1, Math.floor(it.price * (1 - (d.discount || 0))));
        const can = state.zeny >= price;
        const li = document.createElement('li');
        li.className = 'shop-item' + (can ? '' : ' unaffordable');
        li.innerHTML = `
          <div class="iname">${it.name}</div>
          <div><span class="price">${price.toLocaleString()} z</span> <button data-buy="${s.id}" ${can ? '' : 'disabled'}>Buy</button></div>
          <div class="idesc">${it.desc}</div>`;
        list.appendChild(li);
      }
      els('button[data-buy]', list).forEach(b => b.onclick = () => buy(b.dataset.buy));
    },
    renderQuests() {
      const list = $('questList');
      list.innerHTML = '';
      for (const q of QUESTS) {
        const t = q.target;
        let cur = state.questsActive[q.id] || 0;
        let need = t.count || t.value || 1;
        if (t.type === 'collect') cur = state.inventory[t.item] || 0;
        if (t.type === 'level') cur = state.baseLv;
        const done = state.questsDone[q.id];
        const ready = !done && cur >= need;
        const li = document.createElement('li');
        li.className = 'quest-item' + (ready ? ' complete' : '');
        const reward = [
          q.reward.exp ? `${q.reward.exp} EXP` : null,
          q.reward.jexp ? `${q.reward.jexp} JEXP` : null,
          q.reward.zeny ? `${q.reward.zeny} z` : null,
          q.reward.item ? (ITEMS[q.reward.item]?.name || q.reward.item) : null,
        ].filter(Boolean).join(', ');
        li.innerHTML = `
          <div class="qname">${q.name}${done ? ' ✔' : ''}</div>
          <div>${ready && !done ? `<button data-claim="${q.id}">Claim</button>` : ''}</div>
          <div class="qprog">${q.desc} — ${Math.min(cur, need)}/${need} · Reward: ${reward}</div>`;
        list.appendChild(li);
      }
      els('button[data-claim]', list).forEach(b => b.onclick = () => claimQuest(b.dataset.claim));
    },
    renderJobChange() {
      const wrap = $('jobChange');
      const adv = jobDef().advances || [];
      if (adv.length > 0 && state.jobLv >= 10) {
        wrap.hidden = false;
        $('btnJobChange').textContent = 'Job Change → ' + (adv.length === 1 ? adv[0] : 'Choose...');
      } else {
        wrap.hidden = true;
      }
    },
  };

  // ---------------- Log / Toast ----------------
  function log(html, kind = '') {
    const list = $('battleLog');
    const li = document.createElement('li');
    li.innerHTML = `<span class="tag">[${new Date().toLocaleTimeString()}]</span> <span class="${kind}">${html}</span>`;
    list.insertBefore(li, list.firstChild);
    while (list.children.length > 60) list.removeChild(list.lastChild);
  }
  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }

  // ---------------- Save / Load ----------------
  function save() {
    state.lastTs = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      $('autosave').textContent = 'saved ' + new Date().toLocaleTimeString();
    } catch (e) {
      console.error(e);
    }
  }
  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      // Merge defaults to be safe
      state = Object.assign(defaultState(), parsed);
      // Preserve nested structures
      state.stats = Object.assign({ str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 }, parsed.stats || {});
      state.equipment = Object.assign({ weapon: null, armor: null, accessory: null }, parsed.equipment || {});
      state.inventory = parsed.inventory || {};
      state.skills = parsed.skills || { basic_attack: 1 };
      state.questsActive = parsed.questsActive || {};
      state.questsDone = parsed.questsDone || {};
      state.killCounts = parsed.killCounts || {};
      return true;
    } catch (e) {
      console.error('Load failed', e);
      return false;
    }
  }
  function reset() {
    if (!confirm('Erase your save and start over?')) return;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  // ---------------- Boot ----------------
  function showBoot(hasSave) {
    const overlay = $('boot-overlay');
    overlay.style.display = 'flex';
    if (hasSave) $('loadGame').hidden = false;
    let chosen = null;
    els('.job-btn').forEach(btn => {
      btn.onclick = () => {
        els('.job-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        chosen = btn.dataset.job;
        // Enable start when name + job selected
        const name = $('charName').value.trim();
        $('startGame').disabled = !(name.length > 0 && chosen);
      };
    });
    $('charName').addEventListener('input', () => {
      const name = $('charName').value.trim();
      $('startGame').disabled = !(name.length > 0 && chosen);
    });
    $('startGame').onclick = () => {
      state = defaultState();
      state.name = $('charName').value.trim() || 'Adventurer';
      // Begin as Novice; auto-prepare first job advancement target
      pendingJob = chosen;
      // Give the chosen job some baseline by setting it directly so the player feels powerful immediately
      state.job = chosen;
      // Recompute hp/sp baseline
      const d = computeDerived();
      state.hp = d.maxHp; state.sp = d.maxSp;
      // Starter gear
      addItem('red_potion', 5);
      if (['Swordman'].includes(chosen)) { addItem('dagger', 1); equipItem('dagger'); }
      else if (['Mage', 'Acolyte'].includes(chosen)) { addItem('rod', 1); equipItem('rod'); }
      else if (['Archer'].includes(chosen)) { addItem('dagger', 1); equipItem('dagger'); }
      else { addItem('dagger', 1); equipItem('dagger'); }
      addItem('cotton_shirt', 1); equipItem('cotton_shirt');
      overlay.style.display = 'none';
      startGame();
    };
    $('loadGame').onclick = () => {
      if (load()) {
        offlineCatchup();
        overlay.style.display = 'none';
        startGame();
      }
    };
  }

  function bindUI() {
    els('.plus').forEach(b => b.onclick = () => addStat(b.dataset.stat));
    $('btnAttack').onclick = () => {
      const skId = chooseHeroSkill();
      heroAttacks(skId);
      UI.updateBars();
    };
    $('btnAuto').onclick = () => {
      state.auto = !state.auto;
      $('btnAuto').textContent = '🔁 Auto: ' + (state.auto ? 'ON' : 'OFF');
      $('btnAuto').classList.toggle('on', state.auto);
    };
    $('btnRest').onclick = () => {
      const d = computeDerived();
      state.hp = d.maxHp; state.sp = d.maxSp;
      log('Rested at the inn. Fully restored.', 'info');
      UI.updateBars();
    };
    $('btnSave').onclick = () => { save(); toast('Saved.'); };
    $('btnReset').onclick = () => reset();
    $('btnJobChange').onclick = () => jobChange();
    els('.tab').forEach(t => {
      t.onclick = () => {
        els('.tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        els('.tab-body').forEach(b => b.classList.add('hidden'));
        $('tab-' + t.dataset.tab).classList.remove('hidden');
        UI.renderAll();
      };
    });
  }

  let loopId = null;
  let lastFrame = 0;
  function startGame() {
    bindUI();
    UI.renderAll();
    spawnEnemy();
    UI.renderAll();
    log(`Welcome to Midgard, <b>${state.name}</b>!`, 'ok');
    lastFrame = performance.now();
    if (loopId) clearInterval(loopId);
    loopId = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(250, now - lastFrame);
      lastFrame = now;
      tick(dt);
    }, TICK_MS);
    // autosave
    setInterval(save, 10000);
    window.addEventListener('beforeunload', save);
    // Document visibility — when returning, do offline catchup
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        offlineCatchup();
      } else {
        save();
      }
    });
  }

  // Init
  function init() {
    const has = !!localStorage.getItem(SAVE_KEY);
    showBoot(has);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
