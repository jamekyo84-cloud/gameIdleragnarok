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
    discovered: {},     // itemId -> true (first time looted)
    lootLog: [],        // recent loot entries [{id, n, t}]
    shopCat: 'pots',
    sellJunk: false,    // auto-sell junk on pickup
    // P2W
    cash: 0,            // Kafra Coins
    totalSpent: 0,      // Kafra Coins ever bought (for stats / VIP whale tier)
    vipUntil: 0,        // ms timestamp; 0 = no VIP
    buffs: {},          // buffId -> expiryTs (ms)
    cashCat: 'buffs',
    pityCount: 0,       // gacha pity counter
    gachaHistory: [],   // last 30 pulls [{id, t, rarity}]
    lastDailyTs: 0,     // last daily reward claim
    // Admin
    admin: false,       // unlocked by triple-clicking logo or ?admin=1
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

  // ---------------- Buffs / VIP ----------------
  function isVip() { return state.vipUntil && Date.now() < state.vipUntil; }
  function buffActive(id) {
    return state.buffs && state.buffs[id] && state.buffs[id] > Date.now();
  }
  // Returns multipliers: { exp, drop, zeny, aspd }
  function buffMultipliers() {
    const m = { exp: 1, drop: 1, zeny: 1, aspd: 1 };
    // Equip-based percentage bonuses
    const eq = aggregateEquipMods();
    if (eq.expPctBonus) m.exp *= 1 + eq.expPctBonus;
    if (eq.zenyPctBonus) m.zeny *= 1 + eq.zenyPctBonus;
    // Active buffs
    if (buffActive('exp_scroll_2x')) m.exp *= 2;
    if (buffActive('battle_manual')) m.exp *= 1.5;
    if (buffActive('drop_scroll_2x')) m.drop *= 2;
    if (buffActive('bubble_gum'))    m.drop *= 2;
    if (buffActive('zeny_scroll_2x'))m.zeny *= 2;
    // VIP
    if (isVip()) {
      m.exp  *= 1.5;
      m.drop *= 1.3;
      m.zeny *= 1.2;
    }
    // Admin god-mode boosts (also flag-driven from admin menu)
    if (state.admin && state.adminBoost) {
      m.exp *= 10; m.drop *= 5; m.zeny *= 10;
    }
    return m;
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
    const mult = buffMultipliers();
    const expGain = Math.floor(enemy.exp * mult.exp);
    const jexpGain = Math.floor(enemy.jexp * mult.exp);
    const zenyBase = irand(enemy.zeny[0], enemy.zeny[1]);
    const zenyGain = Math.floor(zenyBase * (1 + (d.zenyPct || 0)) * mult.zeny);
    state.exp += expGain;
    state.jexp += jexpGain;
    state.zeny += zenyGain;
    log(`Defeated <b>${enemy.name}</b>! +${expGain} EXP, +${jexpGain} JEXP, +${zenyGain} z`, 'ok');
    UI.float(`+${expGain}`, 'exp', 'enemy');
    UI.float(`+${zenyGain}z`, 'zeny', 'enemy');

    // Boss guaranteed drop slot
    if (enemy.boss) {
      const tpl = MONSTERS[enemy.id];
      const guaranteed = tpl && tpl.guaranteed;
      if (guaranteed && guaranteed.length) {
        const gid = pick(guaranteed);
        addItem(gid, 1, { fromDrop: true });
        const it = ITEMS[gid];
        const r = RARITY[it?.rarity || 'common'];
        UI.float(`★ ${it?.name || gid}!`, 'drop', 'enemy', r?.color);
        log(`<b>${enemy.name}</b> dropped <b style="color:${r?.color}">${it?.name || gid}</b>! (boss bonus)`, 'ok');
      }
    }
    // Random drops (LUK boosts proc rate slightly)
    const lukBoost = 1 + (effStats().luk * 0.0015);
    const dropMult = mult.drop;
    for (const [itemId, chance] of (enemy.drops || [])) {
      if (Math.random() < chance * lukBoost * dropMult) {
        addItem(itemId, 1, { fromDrop: true });
        const it = ITEMS[itemId];
        const r = RARITY[it?.rarity || 'common'];
        UI.float(`${it?.name || itemId}!`, 'drop', 'enemy', r?.color);
        const rareTag = r && (r.name === 'Rare' || r.name === 'Epic' || r.name === 'Legendary' || r.name === 'Mythic') ? ` <em style="color:${r.color}">[${r.name}]</em>` : '';
        log(`Looted <b style="color:${r?.color}">${it?.name || itemId}</b>${rareTag}.`, 'info');
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
  function addItem(id, n = 1, opts = {}) {
    const it = ITEMS[id];
    if (!it) return;
    const isFirstTime = !state.discovered[id];
    // Auto-sell junk if enabled and from drop
    if (opts.fromDrop && state.sellJunk && it.rarity === 'junk' && it.sell) {
      state.zeny += it.sell * n;
      state.discovered[id] = true;
      pushLoot(id, n, true);
      return;
    }
    state.inventory[id] = (state.inventory[id] || 0) + n;
    state.discovered[id] = true;
    if (opts.fromDrop) {
      pushLoot(id, n, false);
      const r = RARITY[it.rarity || 'common'];
      if (r && r.toast) {
        toast(`★ ${it.name} (${r.name})`);
      } else if (isFirstTime) {
        toast(`New: ${it.name}`);
      }
    }
  }
  function removeItem(id, n = 1) {
    if (!state.inventory[id]) return false;
    state.inventory[id] -= n;
    if (state.inventory[id] <= 0) delete state.inventory[id];
    return true;
  }
  function pushLoot(id, n, sold) {
    state.lootLog.unshift({ id, n, sold, t: Date.now() });
    if (state.lootLog.length > 30) state.lootLog.length = 30;
  }

  function buy(id, n = 1) {
    const it = ITEMS[id];
    if (!it || !it.price) return;
    const d = computeDerived();
    const price = Math.max(1, Math.floor(it.price * (1 - (d.discount || 0))));
    const total = price * n;
    if (state.zeny < total) { toast('Not enough Zeny'); return; }
    state.zeny -= total;
    addItem(id, n);
    log(`Bought <b>${it.name}</b>${n > 1 ? ' ×'+n : ''} for ${total.toLocaleString()} z.`, 'info');
    UI.renderAll();
  }
  function sellAllJunk() {
    let total = 0, count = 0;
    for (const id of Object.keys(state.inventory)) {
      const it = ITEMS[id];
      if (!it || it.rarity !== 'junk' || !it.sell) continue;
      const n = state.inventory[id];
      total += it.sell * n;
      count += n;
      delete state.inventory[id];
    }
    if (total > 0) {
      state.zeny += total;
      log(`Sold all junk: ${count} items for <b>${total.toLocaleString()} z</b>.`, 'ok');
      toast(`+${total.toLocaleString()} z`);
    } else {
      toast('No junk to sell');
    }
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
    if (!it) return;
    if (it.type === 'pot') {
      const d = computeDerived();
      if (it.heal) state.hp = Math.min(d.maxHp, state.hp + it.heal);
      if (it.healSp) state.sp = Math.min(d.maxSp, state.sp + it.healSp);
      removeItem(id, 1);
      log(`Used <b>${it.name}</b>.`, 'info');
      UI.renderAll();
      return;
    }
    if (it.type === 'voucher') {
      useVoucher(id);
      return;
    }
  }

  function useVoucher(id) {
    const it = ITEMS[id];
    if (!it || (state.inventory[id] || 0) <= 0) return;
    let consumed = true;
    const now = Date.now();
    switch (id) {
      case 'vip_card_7d':
        state.vipUntil = Math.max(state.vipUntil, now) + 7 * 24 * 3600 * 1000;
        log('VIP activated for <b>7 days</b>! +50% EXP, +30% drop, +20% zeny.', 'ok');
        toast('VIP active for 7 days');
        break;
      case 'vip_card_30d':
        state.vipUntil = Math.max(state.vipUntil, now) + 30 * 24 * 3600 * 1000;
        log('VIP activated for <b>30 days</b>!', 'ok');
        toast('VIP active for 30 days');
        break;
      case 'exp_scroll_2x':
        state.buffs[id] = Math.max(state.buffs[id] || 0, now) + 60 * 60 * 1000;
        log('EXP x2 active for 1 hour.', 'ok'); break;
      case 'drop_scroll_2x':
        state.buffs[id] = Math.max(state.buffs[id] || 0, now) + 60 * 60 * 1000;
        log('Drop x2 active for 1 hour.', 'ok'); break;
      case 'zeny_scroll_2x':
        state.buffs[id] = Math.max(state.buffs[id] || 0, now) + 60 * 60 * 1000;
        log('Zeny x2 active for 1 hour.', 'ok'); break;
      case 'bubble_gum':
        state.buffs[id] = Math.max(state.buffs[id] || 0, now) + 30 * 60 * 1000;
        log('Bubble Gum: drop x2 for 30 minutes.', 'ok'); break;
      case 'battle_manual':
        state.buffs[id] = Math.max(state.buffs[id] || 0, now) + 30 * 60 * 1000;
        log('Battle Manual: EXP x1.5 for 30 minutes.', 'ok'); break;
      case 'full_restore': {
        const d = computeDerived();
        state.hp = d.maxHp; state.sp = d.maxSp;
        log('Fully restored.', 'ok'); break;
      }
      case 'bloody_branch': {
        // Force-spawn a random boss
        const bosses = Object.keys(MONSTERS).filter(k => MONSTERS[k].boss);
        const bid = pick(bosses);
        forceSpawnBoss(bid);
        break;
      }
      case 'reset_stone': {
        let total = 0;
        for (const k of Object.keys(state.stats)) {
          const cur = state.stats[k];
          // refund based on cumulative cost
          for (let i = 1; i < cur; i++) total += statCost(i);
          state.stats[k] = 1;
        }
        state.statPoints += total;
        log(`Stat reset! Refunded <b>${total}</b> stat points.`, 'ok');
        break;
      }
      case 'skill_reset': {
        let total = 0;
        for (const sid of Object.keys(state.skills)) {
          const sk = SKILLS[sid];
          if (!sk || sk.fixed) continue;
          const lv = state.skills[sid] || 0;
          total += lv * (sk.cost || 1);
          state.skills[sid] = 0;
          if (sid === 'basic_attack') state.skills[sid] = 1;
        }
        state.skillPoints += total;
        log(`Skill reset! Refunded <b>${total}</b> skill points.`, 'ok');
        break;
      }
      default: consumed = false;
    }
    if (consumed) removeItem(id, 1);
    UI.renderAll();
  }

  function forceSpawnBoss(bossId) {
    const tpl = MONSTERS[bossId];
    if (!tpl) return;
    enemy = null;
    // Build a boss enemy without map scaling
    const map = MAPS.find(m => m.id === state.mapId) || MAPS[0];
    const scale = 1 + (map.minLv - 1) * 0.04;
    enemy = {
      id: bossId, name: tpl.name, emoji: tpl.emoji,
      lv: Math.max(1, map.minLv + 5),
      maxHp: Math.floor(tpl.hp * scale),
      hp: Math.floor(tpl.hp * scale),
      atk: Math.floor(tpl.atk * scale),
      def: Math.floor(tpl.def * scale),
      exp: Math.floor(tpl.exp * scale),
      jexp: Math.floor(tpl.jexp * scale),
      zeny: tpl.zeny.map(v => Math.floor(v * scale)),
      drops: tpl.drops || [],
      boss: true,
      attackTimer: 0,
      attackInterval: 1.4 + Math.random() * 0.6,
    };
    UI.renderEnemy();
    UI.spawnFx();
    log(`A <b>${tpl.name}</b> appeared!`, 'bad');
    toast(`Boss: ${tpl.name}!`);
  }

  // ---------------- Cash shop / Top-up / Gacha ----------------
  function topUp(packId) {
    const p = CASH_TOPUP.find(x => x.id === packId);
    if (!p) return;
    const total = p.coins + p.bonus;
    state.cash += total;
    state.totalSpent += p.coins;
    log(`💎 Top-up: <b>${p.name}</b> — +${total} Kafra Coins (incl. ${p.bonus} bonus).`, 'ok');
    toast(`+${total} 💎 Kafra Coins`);
    UI.renderAll();
  }

  function buyCash(id) {
    const item = CASH_SHOP.find(x => x.id === id);
    if (!item) return;
    if (state.cash < item.cost) { toast('Not enough Kafra Coins'); return; }
    state.cash -= item.cost;
    addItem(id, 1);
    const it = ITEMS[id];
    log(`💎 Purchased <b>${it.name}</b> for ${item.cost} 💎.`, 'ok');
    toast(`+ ${it.name}`);
    UI.renderAll();
  }

  function gachaPull(times = 1) {
    const cost = times === 10 ? GACHA.cost10 : GACHA.cost * times;
    if (state.cash < cost) { toast('Not enough Kafra Coins'); return; }
    state.cash -= cost;
    const totalWeight = GACHA.pool.reduce((s, [_, w]) => s + w, 0);
    const results = [];
    for (let i = 0; i < times; i++) {
      let drop;
      state.pityCount += 1;
      // Pity: every Nth pull guarantees a legendary or higher
      if (state.pityCount >= GACHA.pity) {
        const legendaries = GACHA.pool.filter(([id, _]) => {
          const it = ITEMS[id]; return it && (it.rarity === 'legendary' || it.rarity === 'mythic');
        });
        const total = legendaries.reduce((s, [, w]) => s + w, 0);
        let r = Math.random() * total;
        for (const [id, w] of legendaries) { r -= w; if (r <= 0) { drop = id; break; } }
        if (!drop) drop = legendaries[0][0];
        state.pityCount = 0;
      } else {
        let r = Math.random() * totalWeight;
        for (const [id, w] of GACHA.pool) {
          r -= w;
          if (r <= 0) { drop = id; break; }
        }
        if (!drop) drop = GACHA.pool[0][0];
        const it = ITEMS[drop];
        if (it && (it.rarity === 'legendary' || it.rarity === 'mythic')) {
          state.pityCount = 0;
        }
      }
      addItem(drop, 1);
      const it = ITEMS[drop];
      const r = RARITY[it?.rarity || 'common'];
      results.push({ id: drop, name: it?.name || drop, rarity: it?.rarity || 'common', color: r?.color });
      state.gachaHistory.unshift({ id: drop, t: Date.now(), rarity: it?.rarity || 'common' });
    }
    if (state.gachaHistory.length > 50) state.gachaHistory.length = 50;
    UI.showGachaResult(results);
    UI.renderAll();
  }

  function claimDaily() {
    const now = Date.now();
    if (state.lastDailyTs && now - state.lastDailyTs < DAILY_COOLDOWN_MS) {
      const remain = DAILY_COOLDOWN_MS - (now - state.lastDailyTs);
      toast(`Next daily in ${formatTime(remain / 1000)}`);
      return;
    }
    state.lastDailyTs = now;
    state.cash += DAILY_REWARD.coins;
    log(`🎁 ${DAILY_REWARD.label}`, 'ok');
    toast(`+${DAILY_REWARD.coins} 💎 Daily reward!`);
    UI.renderAll();
  }

  // ---------------- Admin (cheats) ----------------
  const Admin = {
    unlock() { state.admin = true; toast('Admin mode unlocked'); UI.renderAll(); UI.renderAdmin(); },
    lock()   { state.admin = false; UI.renderAll(); UI.renderAdmin(); },
    addZeny(n) { state.zeny += n; log(`[ADMIN] +${n.toLocaleString()} z`, 'info'); UI.renderAll(); },
    addCash(n) { state.cash += n; log(`[ADMIN] +${n} 💎`, 'info'); UI.renderAll(); },
    addExp(n)  { state.exp += n; checkLevelUp(); log(`[ADMIN] +${n} EXP`, 'info'); UI.renderAll(); },
    addJexp(n) { state.jexp += n; checkLevelUp(); log(`[ADMIN] +${n} JEXP`, 'info'); UI.renderAll(); },
    addStat(n) { state.statPoints += n; log(`[ADMIN] +${n} stat pts`, 'info'); UI.renderAll(); },
    addSkill(n){ state.skillPoints += n; log(`[ADMIN] +${n} skill pts`, 'info'); UI.renderAll(); },
    setLevel(lv) {
      lv = clamp(parseInt(lv, 10) || 1, 1, 200);
      state.baseLv = lv;
      state.statPoints += lv * 4;
      const d = computeDerived(); state.hp = d.maxHp; state.sp = d.maxSp;
      log(`[ADMIN] Set Lv ${lv}`, 'info'); UI.renderAll();
    },
    setJobLv(lv) {
      lv = clamp(parseInt(lv, 10) || 1, 1, 50);
      state.jobLv = lv;
      state.skillPoints += lv;
      log(`[ADMIN] Set Job Lv ${lv}`, 'info'); UI.renderAll();
    },
    becomeJob(j) {
      if (!JOBS[j]) { toast('Unknown job'); return; }
      state.job = j;
      const d = computeDerived(); state.hp = d.maxHp; state.sp = d.maxSp;
      log(`[ADMIN] Class -> ${j}`, 'info'); UI.renderAll();
    },
    giveAllPremium() {
      for (const id of Object.keys(CASH_ITEMS_DEF)) addItem(id, 1);
      log('[ADMIN] Granted all premium items.', 'info'); UI.renderAll();
    },
    giveAllCards() {
      for (const id of Object.keys(ITEMS)) {
        if (id.endsWith('_card')) addItem(id, 1);
      }
      log('[ADMIN] Granted all cards.', 'info'); UI.renderAll();
    },
    fillHpSp() { const d = computeDerived(); state.hp = d.maxHp; state.sp = d.maxSp; UI.updateBars(); },
    godBoost(on) {
      state.adminBoost = !!on;
      log(`[ADMIN] God boost ${on ? 'ON' : 'OFF'}`, 'info'); UI.renderAdmin();
    },
    grantVip(days) {
      const d = parseInt(days, 10) || 7;
      state.vipUntil = Math.max(state.vipUntil, Date.now()) + d * 24 * 3600 * 1000;
      log(`[ADMIN] +${d} days VIP`, 'info'); UI.renderAll();
    },
    spawnBoss(id) {
      if (!MONSTERS[id] || !MONSTERS[id].boss) { toast('Pick a valid boss'); return; }
      forceSpawnBoss(id);
    },
    giveItem(id, n) {
      if (!ITEMS[id]) { toast('Unknown item id'); return; }
      addItem(id, n || 1); log(`[ADMIN] +${n||1} ${ITEMS[id].name}`, 'info'); UI.renderAll();
    },
    killEnemy() {
      if (enemy) { enemy.hp = 0; onEnemyDead(); }
    },
    wipeSave() {
      if (!confirm('Wipe save and reload?')) return;
      localStorage.removeItem(SAVE_KEY); location.reload();
    },
  };
  // Expose for console access too
  window.Admin = Admin;

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
    const mult = buffMultipliers();
    const expG = Math.floor(tpl.exp * scale * kills * mult.exp);
    const jexpG = Math.floor(tpl.jexp * scale * kills * mult.exp);
    const zenyG = Math.floor(((tpl.zeny[0] + tpl.zeny[1]) / 2) * scale * kills * (1 + (d.zenyPct || 0)) * mult.zeny);
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
      this.renderCash();
      this.renderLoot();
      this.renderQuests();
      this.renderJobChange();
      this.renderAdmin();
      this.updateBars();
    },
    renderTop() {
      $('zeny').textContent = state.zeny.toLocaleString();
      $('cash').textContent = (state.cash || 0).toLocaleString();
      $('baseLv').textContent = state.baseLv;
      $('jobLv').textContent = state.jobLv;
      $('statPts').textContent = state.statPoints;
      $('skillPts').textContent = state.skillPoints;
      const vipBadge = $('vipBadge');
      if (vipBadge) {
        if (isVip()) {
          vipBadge.hidden = false;
          $('vipRemain').textContent = formatTime((state.vipUntil - Date.now()) / 1000);
        } else {
          vipBadge.hidden = true;
        }
      }
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
    float(text, kind, side, color) {
      const root = $('floaters');
      const div = document.createElement('div');
      div.className = `float ${kind}`;
      div.innerHTML = text;
      if (color) div.style.color = color;
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
      $('cash').textContent = (state.cash || 0).toLocaleString();
      $('baseLv').textContent = state.baseLv;
      $('jobLv').textContent = state.jobLv;
      $('statPts').textContent = state.statPoints;
      $('skillPts').textContent = state.skillPoints;
      const vipBadge = $('vipBadge');
      if (vipBadge) {
        if (isVip()) {
          vipBadge.hidden = false;
          $('vipRemain').textContent = formatTime((state.vipUntil - Date.now()) / 1000);
        } else {
          vipBadge.hidden = true;
        }
      }
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
      const tools = $('invTools');
      if (tools) {
        const junkCount = ids.filter(id => (ITEMS[id]?.rarity === 'junk')).length;
        tools.innerHTML = `
          <button id="btnSellJunk" class="ghost small" ${junkCount === 0 ? 'disabled' : ''}>Sell All Junk (${junkCount})</button>
          <label class="auto-junk"><input type="checkbox" id="chkSellJunk" ${state.sellJunk ? 'checked' : ''}/> Auto-sell junk</label>
        `;
        const btn = $('btnSellJunk'); if (btn) btn.onclick = () => sellAllJunk();
        const chk = $('chkSellJunk'); if (chk) chk.onchange = () => { state.sellJunk = chk.checked; toast(state.sellJunk ? 'Auto-selling junk on pickup' : 'Auto-sell off'); };
      }
      if (ids.length === 0) {
        list.innerHTML = `<li class="inv-item"><div class="iname">Empty</div><div></div><div class="idesc">Defeat monsters to find loot.</div></li>`;
        return;
      }
      // Sort: equip > pot > loot, then by rarity desc, then name
      const rarityOrder = ['mythic','legendary','epic','rare','uncommon','common','junk'];
      const typeOrder = { equip: 0, pot: 1, loot: 2 };
      ids.sort((a, b) => {
        const ia = ITEMS[a], ib = ITEMS[b];
        const ta = typeOrder[ia.type] ?? 9, tb = typeOrder[ib.type] ?? 9;
        if (ta !== tb) return ta - tb;
        const ra = rarityOrder.indexOf(ia.rarity || 'common');
        const rb = rarityOrder.indexOf(ib.rarity || 'common');
        if (ra !== rb) return ra - rb;
        return (ia.name || '').localeCompare(ib.name || '');
      });
      for (const id of ids) {
        const it = ITEMS[id]; if (!it) continue;
        const cnt = state.inventory[id];
        const r = RARITY[it.rarity || 'common'];
        const li = document.createElement('li');
        li.className = 'inv-item';
        li.dataset.rarity = it.rarity || 'common';
        const actions = [];
        if (it.type === 'pot') actions.push(`<button data-act="use" data-id="${id}">Use</button>`);
        if (it.type === 'equip') {
          const equipped = Object.values(state.equipment).includes(id);
          if (!equipped) actions.push(`<button data-act="equip" data-id="${id}">Equip</button>`);
        }
        if (it.sell) actions.push(`<button data-act="sell" data-id="${id}">Sell ${it.sell}z</button>`);
        li.innerHTML = `
          <div class="iname" style="color:${r.color}">${it.name} <span class="x">×${cnt}</span> <span class="rarity-tag" style="color:${r.color};border-color:${r.color}">${r.name}</span></div>
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
      // Categories tabs
      const catWrap = $('shopCats');
      if (catWrap) {
        catWrap.innerHTML = '';
        for (const c of SHOP_CATEGORIES) {
          const b = document.createElement('button');
          b.textContent = c.name;
          b.className = 'shop-cat' + (state.shopCat === c.id ? ' active' : '');
          b.onclick = () => { state.shopCat = c.id; UI.renderShop(); };
          catWrap.appendChild(b);
        }
      }
      const list = $('shopList');
      list.innerHTML = '';
      const d = computeDerived();
      const items = SHOP.filter(s => (s.cat || 'pots') === state.shopCat);
      let any = false;
      for (const s of items) {
        if (state.baseLv < s.minLv) continue;
        any = true;
        const it = ITEMS[s.id];
        const r = RARITY[it.rarity || 'common'];
        const price = Math.max(1, Math.floor(it.price * (1 - (d.discount || 0))));
        const can1 = state.zeny >= price;
        const can10 = state.zeny >= price * 10;
        const showX10 = it.type === 'pot';
        const li = document.createElement('li');
        li.className = 'shop-item' + (can1 ? '' : ' unaffordable');
        li.dataset.rarity = it.rarity || 'common';
        li.innerHTML = `
          <div class="iname" style="color:${r.color}">${it.name} <span class="rarity-tag" style="color:${r.color};border-color:${r.color}">${r.name}</span></div>
          <div class="buy-actions">
            <span class="price">${price.toLocaleString()} z</span>
            <button data-buy="${s.id}" data-n="1" ${can1 ? '' : 'disabled'}>Buy</button>
            ${showX10 ? `<button data-buy="${s.id}" data-n="10" ${can10 ? '' : 'disabled'} title="${(price*10).toLocaleString()} z">×10</button>` : ''}
          </div>
          <div class="idesc">${it.desc}${d.discount ? ` <em class="discount">(-${Math.round(d.discount*100)}%)</em>` : ''}</div>`;
        list.appendChild(li);
      }
      if (!any) {
        list.innerHTML = `<li class="shop-item"><div class="iname">Locked</div><div></div><div class="idesc">Level up to unlock more goods in this category.</div></li>`;
      }
      els('button[data-buy]', list).forEach(b => b.onclick = () => buy(b.dataset.buy, parseInt(b.dataset.n, 10) || 1));
    },
    renderLoot() {
      const list = $('lootList');
      if (!list) return;
      list.innerHTML = '';
      if (!state.lootLog.length) {
        list.innerHTML = `<li class="loot-entry"><div>No loot yet.</div></li>`;
        return;
      }
      for (const e of state.lootLog) {
        const it = ITEMS[e.id]; if (!it) continue;
        const r = RARITY[it.rarity || 'common'];
        const li = document.createElement('li');
        li.className = 'loot-entry';
        const time = new Date(e.t).toLocaleTimeString();
        li.innerHTML = `<span class="loot-time">${time}</span> <span style="color:${r.color}">${it.name}${e.n > 1 ? ' ×'+e.n : ''}</span> <span class="loot-rarity" style="color:${r.color}">[${r.name}]</span> ${e.sold ? `<em class="loot-sold">auto-sold ${it.sell * e.n}z</em>` : ''}`;
        list.appendChild(li);
      }
    },
    renderCash() {
      const balance = $('cashBalance'); if (balance) balance.textContent = state.cash.toLocaleString();
      const vip = $('vipStatus');
      if (vip) {
        if (isVip()) {
          const remain = state.vipUntil - Date.now();
          vip.innerHTML = `<span class="vip-on">👑 VIP active · ${formatTime(remain / 1000)} left</span>`;
        } else {
          vip.textContent = 'No VIP';
        }
      }
      // Buff list
      const buffWrap = $('buffList');
      if (buffWrap) {
        buffWrap.innerHTML = '';
        const active = [];
        if (isVip()) active.push({ name: '👑 VIP', remain: state.vipUntil - Date.now(), color: '#f6c453' });
        for (const id of Object.keys(state.buffs || {})) {
          if (state.buffs[id] && state.buffs[id] > Date.now()) {
            const it = ITEMS[id];
            active.push({ name: it ? it.name : id, remain: state.buffs[id] - Date.now(), color: '#b186ff' });
          }
        }
        if (active.length === 0) {
          buffWrap.innerHTML = `<div class="buff-empty">No buffs active.</div>`;
        } else {
          for (const b of active) {
            const div = document.createElement('div');
            div.className = 'buff-pill';
            div.style.borderColor = b.color;
            div.style.color = b.color;
            div.innerHTML = `<b>${b.name}</b> <span>${formatTime(b.remain / 1000)}</span>`;
            buffWrap.appendChild(div);
          }
        }
      }
      // Categories
      const cats = $('cashCats');
      if (cats) {
        cats.innerHTML = '';
        for (const c of CASH_CATEGORIES) {
          const b = document.createElement('button');
          b.textContent = c.name;
          b.className = 'shop-cat' + (state.cashCat === c.id ? ' active' : '');
          b.onclick = () => { state.cashCat = c.id; UI.renderCash(); };
          cats.appendChild(b);
        }
      }
      const list = $('cashList');
      if (!list) return;
      list.innerHTML = '';
      if (state.cashCat === 'gacha') {
        const g = document.createElement('li');
        g.className = 'shop-item gacha-card';
        const pity = state.pityCount || 0;
        g.innerHTML = `
          <div class="iname">🎰 Mythic Gacha</div>
          <div class="buy-actions">
            <button data-gacha="1" class="primary" ${state.cash < GACHA.cost ? 'disabled' : ''}>Pull ×1 (${GACHA.cost} 💎)</button>
            <button data-gacha="10" class="primary" ${state.cash < GACHA.cost10 ? 'disabled' : ''}>Pull ×10 (${GACHA.cost10} 💎)</button>
          </div>
          <div class="idesc">
            Chance for Excalibur, Valkyrie Armor, Megingjörð, Brisingamen, MVP cards.<br>
            Pity: <b>${pity}</b>/${GACHA.pity} — guaranteed legendary at pity.
          </div>`;
        list.appendChild(g);
        // Recent pulls
        if (state.gachaHistory.length) {
          const hist = document.createElement('li');
          hist.className = 'gacha-history';
          hist.innerHTML = `<div class="iname">Recent Pulls</div><div></div>
            <div class="idesc">${state.gachaHistory.slice(0, 12).map(h => {
              const it = ITEMS[h.id]; const r = RARITY[h.rarity || 'common'];
              return `<span style="color:${r.color}">${it ? it.name : h.id}</span>`;
            }).join(' · ')}</div>`;
          list.appendChild(hist);
        }
        els('button[data-gacha]', list).forEach(b => b.onclick = () => gachaPull(parseInt(b.dataset.gacha, 10)));
      } else {
        const items = CASH_SHOP.filter(s => s.cat === state.cashCat);
        for (const s of items) {
          const it = ITEMS[s.id];
          if (!it) continue;
          const r = RARITY[it.rarity || 'common'];
          const can = state.cash >= s.cost;
          const li = document.createElement('li');
          li.className = 'shop-item' + (can ? '' : ' unaffordable');
          li.dataset.rarity = it.rarity || 'common';
          li.innerHTML = `
            <div class="iname" style="color:${r.color}">${it.name} <span class="rarity-tag" style="color:${r.color};border-color:${r.color}">${r.name}</span></div>
            <div class="buy-actions">
              <span class="price cash-price">${s.cost.toLocaleString()} 💎</span>
              <button data-cashbuy="${s.id}" ${can ? '' : 'disabled'}>Buy</button>
            </div>
            <div class="idesc">${it.desc}</div>`;
          list.appendChild(li);
        }
        els('button[data-cashbuy]', list).forEach(b => b.onclick = () => buyCash(b.dataset.cashbuy));
      }
    },
    renderTopUp() {
      const list = $('topupList');
      if (!list) return;
      list.innerHTML = '';
      for (const p of CASH_TOPUP) {
        const li = document.createElement('li');
        li.className = 'topup-item';
        li.innerHTML = `
          <div class="topup-name">${p.name} <span class="topup-price">${p.label}</span></div>
          <div class="topup-coins">+${p.coins.toLocaleString()} 💎 ${p.bonus ? `<em>+${p.bonus.toLocaleString()} bonus</em>` : ''}</div>
          <button class="primary" data-topup="${p.id}">Buy</button>`;
        list.appendChild(li);
      }
      els('button[data-topup]', list).forEach(b => b.onclick = () => {
        topUp(b.dataset.topup);
        $('topupModal').hidden = true;
      });
    },
    showGachaResult(results) {
      const wrap = $('gachaResult');
      if (!wrap) return;
      wrap.innerHTML = '';
      for (const r of results) {
        const div = document.createElement('div');
        div.className = `gacha-card-result rarity-${r.rarity}`;
        div.style.borderColor = r.color;
        div.innerHTML = `<div class="g-name" style="color:${r.color}">${r.name}</div><div class="g-rarity" style="color:${r.color}">${RARITY[r.rarity]?.name || r.rarity}</div>`;
        wrap.appendChild(div);
      }
      $('gachaModal').hidden = false;
    },
    renderAdmin() {
      const tabBtn = $('adminTabBtn');
      if (tabBtn) tabBtn.hidden = !state.admin;
      const body = $('adminBody');
      if (!body) return;
      if (!state.admin) { body.innerHTML = '<p>Locked. Click the logo 3× or open with <code>?admin=1</code>.</p>'; return; }
      const jobOptions = Object.keys(JOBS).map(j => `<option ${state.job === j ? 'selected' : ''}>${j}</option>`).join('');
      const bossOptions = Object.keys(MONSTERS).filter(k => MONSTERS[k].boss).map(k => `<option value="${k}">${MONSTERS[k].name}</option>`).join('');
      body.innerHTML = `
        <div class="admin-grid">
          <div class="admin-section">
            <h4>Currency</h4>
            <div class="row"><button data-cmd="zeny1k">+1,000 z</button><button data-cmd="zeny100k">+100,000 z</button><button data-cmd="zeny10m">+10,000,000 z</button></div>
            <div class="row"><button data-cmd="cash100">+100 💎</button><button data-cmd="cash1k">+1,000 💎</button><button data-cmd="cash100k">+100,000 💎</button></div>
          </div>
          <div class="admin-section">
            <h4>Progression</h4>
            <div class="row"><button data-cmd="exp">+1 Lv EXP</button><button data-cmd="jexp">+1 Lv JEXP</button><button data-cmd="stat">+10 stat pts</button><button data-cmd="skill">+5 skill pts</button></div>
            <div class="row"><label>Set Lv: <input type="number" id="adminSetLv" value="${state.baseLv}" min="1" max="200" style="width:80px"/></label> <button data-cmd="setLv">Apply</button></div>
            <div class="row"><label>Job: <select id="adminJob">${jobOptions}</select></label> <button data-cmd="setJob">Change</button></div>
          </div>
          <div class="admin-section">
            <h4>VIP & Buffs</h4>
            <div class="row"><button data-cmd="vip7">+7d VIP</button><button data-cmd="vip30">+30d VIP</button><button data-cmd="vipOff">Clear VIP</button></div>
            <div class="row"><button data-cmd="godBoost" id="btnGodBoost" class="${state.adminBoost ? 'primary' : 'ghost'}">God Boost: ${state.adminBoost ? 'ON' : 'OFF'}</button> <span class="hint">×10 EXP, ×5 drop, ×10 zeny</span></div>
          </div>
          <div class="admin-section">
            <h4>Items</h4>
            <div class="row"><button data-cmd="allPremium">Give all premium gear</button><button data-cmd="allCards">Give all cards</button></div>
            <div class="row">
              <input type="text" id="adminItemId" placeholder="item id (e.g. oridecon)" style="flex:1"/>
              <input type="number" id="adminItemN" value="1" min="1" style="width:60px"/>
              <button data-cmd="giveItem">Give</button>
            </div>
          </div>
          <div class="admin-section">
            <h4>Combat</h4>
            <div class="row"><button data-cmd="kill">Insta-kill enemy</button><button data-cmd="heal">Full restore</button></div>
            <div class="row"><label>Boss: <select id="adminBoss">${bossOptions}</select></label> <button data-cmd="spawnBoss">Spawn</button></div>
          </div>
          <div class="admin-section danger">
            <h4>Danger Zone</h4>
            <div class="row"><button data-cmd="lock" class="ghost">Lock admin</button><button data-cmd="wipe" class="ghost danger">Wipe save</button></div>
          </div>
        </div>
      `;
      els('button[data-cmd]', body).forEach(b => b.onclick = () => onAdminCmd(b.dataset.cmd));
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
    // Top-up modal + Daily reward + Gacha re-pull
    const btnTopUp = $('btnTopUp');
    if (btnTopUp) btnTopUp.onclick = () => { UI.renderTopUp(); $('topupModal').hidden = false; };
    const btnDaily = $('btnDaily');
    if (btnDaily) btnDaily.onclick = () => claimDaily();
    els('[data-close-modal]').forEach(b => b.onclick = () => { const m = $(b.dataset.closeModal); if (m) m.hidden = true; });
    els('.modal-backdrop').forEach(bg => bg.addEventListener('click', (e) => { if (e.target === bg) bg.hidden = true; }));
    const g1 = $('btnGacha1Again'); if (g1) g1.onclick = () => { $('gachaModal').hidden = true; gachaPull(1); };
    const g10 = $('btnGacha10Again'); if (g10) g10.onclick = () => { $('gachaModal').hidden = true; gachaPull(10); };
    // Logo: triple-click to unlock admin
    let logoClicks = 0; let logoTimer = 0;
    const logo = el('.brand .logo');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.onclick = () => {
        logoClicks += 1;
        clearTimeout(logoTimer);
        logoTimer = setTimeout(() => logoClicks = 0, 600);
        if (logoClicks >= 3) {
          logoClicks = 0;
          if (state.admin) {
            Admin.lock(); toast('Admin locked');
          } else {
            Admin.unlock();
          }
        }
      };
    }
  }

  function onAdminCmd(cmd) {
    switch (cmd) {
      case 'zeny1k': Admin.addZeny(1000); break;
      case 'zeny100k': Admin.addZeny(100000); break;
      case 'zeny10m': Admin.addZeny(10000000); break;
      case 'cash100': Admin.addCash(100); break;
      case 'cash1k': Admin.addCash(1000); break;
      case 'cash100k': Admin.addCash(100000); break;
      case 'exp': Admin.addExp(expForBaseLevel(state.baseLv)); break;
      case 'jexp': Admin.addJexp(expForJobLevel(state.jobLv)); break;
      case 'stat': Admin.addStat(10); break;
      case 'skill': Admin.addSkill(5); break;
      case 'setLv': Admin.setLevel($('adminSetLv').value); break;
      case 'setJob': Admin.becomeJob($('adminJob').value); break;
      case 'vip7': Admin.grantVip(7); break;
      case 'vip30': Admin.grantVip(30); break;
      case 'vipOff': state.vipUntil = 0; UI.renderAll(); break;
      case 'godBoost': Admin.godBoost(!state.adminBoost); break;
      case 'allPremium': Admin.giveAllPremium(); break;
      case 'allCards': Admin.giveAllCards(); break;
      case 'giveItem': Admin.giveItem($('adminItemId').value.trim(), parseInt($('adminItemN').value, 10) || 1); break;
      case 'kill': Admin.killEnemy(); break;
      case 'heal': Admin.fillHpSp(); break;
      case 'spawnBoss': Admin.spawnBoss($('adminBoss').value); break;
      case 'lock': Admin.lock(); break;
      case 'wipe': Admin.wipeSave(); break;
    }
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
    // Auto-enable admin via ?admin=1
    if (location.search.includes('admin=1')) {
      // Wait for game to start
      const tryEnable = () => { if (state && state.name) { state.admin = true; UI.renderAdmin && UI.renderAdmin(); } else setTimeout(tryEnable, 500); };
      setTimeout(tryEnable, 500);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
