# Ragnarok Idle

An endless idle adventure in Midgard, played in your browser. A fan tribute to the world of Ragnarok Online — porings, skills, jobs, dungeons, bosses, cards and all.

> Pure HTML/CSS/JS — no build step, no server. Open `index.html` and play.

## Features

- **Pick from 6 starting classes** — Swordman, Mage, Archer, Acolyte, Thief, Merchant. Each has unique stats, ASPD and skill trees.
- **Job change at Job Lv 10** to a 2nd-tier class such as Knight, Wizard, Hunter, Priest, Assassin, Blacksmith, and more.
- **Auto-combat with idle progression** — auto-pick the strongest available skill, manage SP, and keep grinding even while you do other things.
- **Offline catch-up** — close the tab, come back later, and collect EXP and zeny earned while you were away (capped at 12 hours, 60% efficiency).
- **Stat allocation** — STR / AGI / VIT / INT / DEX / LUK with classic RO-style scaling.
- **Skill tree** — class-specific actives & passives (Bash, Fire Bolt, Double Strafe, Heal, Asura Strike, etc.).
- **Multiple maps** with biomes and level gates: Prontera Field, Geffen Field, Payon Dungeon, Orc Dungeon, Amatsu Cave, Morroc Pyramids, Lutie, Glast Heim.
- **Bosses every 25 kills** on maps with a designated MVP — Poporing, Eddga, Osiris, Baphomet — with rare drops including cards.
- **Inventory, equipment, Kafra shop, quests** — buy, sell, equip gear; complete quest objectives for big rewards.
- **Local save** to `localStorage`, autosaves every 10s and on tab close.

## How to play

Just open `index.html` in any modern browser. On first launch:

1. Type a character name.
2. Pick a starting class.
3. Click **Begin Adventure**.

Auto-attack is on by default. Allocate stat points each level, learn skills with skill points, and travel to harder maps when you out-level the current one. At Job Lv 10, click **Job Change!** to advance to a 2nd-tier class.

## Files

- `index.html` — UI markup
- `styles.css` — retro fantasy theme
- `data.js` — jobs, skills, monsters, maps, items, shop, quests
- `game.js` — combat, idle loop, persistence, UI rendering

## Notes / disclaimers

This is a fan-made tribute. Trademarks belong to Gravity Co., Ltd. No assets from the original game are used; emojis stand in for sprites.
