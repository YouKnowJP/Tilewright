# A longer way through Lantern Trails

Open **Play adventures → Start an expedition**. All expedition modes are
available immediately. Story missions and playing your painted map remain
available in the same game.

## Choose a run

| Mode | What to expect |
| --- | --- |
| Journey | Choose three, six, or nine legs. Finish each mission, choose an upgrade and a route at camp, then face a final Watcher crossing. |
| Single contract | One complete generated mission. Useful for learning a mission family, chasing a clean score, or trying another oath. |
| Daily trail | Five legs using the current UTC date, Trail rules, and no oath. Camp and route choices still change the journey. There is no online leaderboard. |

A seed accepts 1–32 letters, numbers, spaces, or hyphens. Spaces become hyphens
and capitals become lowercase. **Surprise me** chooses a new seed. Reuse the
same seed, mode, route choices, difficulty, oath, upgrades, and action history
to reproduce the same world and decisions. A different route changes later
maps. A fresh expedition starts its own movement learner; that learner carries
across legs and retries without changing campaign memory.

Regions include **Foxglove Wood**, **Rainmoss Fen**, **The Quiet Archive**, and
**Amber Hollow**. Each map connects rooms through a generated maze with loops,
side-room treasure, cover, healing, supplies, and timed ember crossings. Later
legs have larger maps and more hunters. Nemesis adds a reinforcement, longer
hazard windows, faster pursuit, and fewer starting resources.

## Six kinds of mission

| Mission | Your objective and decisions |
| --- | --- |
| Lost lights | Find three scattered lanterns and reach the distant beacon. Choose an exploration order and preserve supplies. |
| Signal heist | Ask the guide for the shuffled bell order, ring the three relays, cross the signal gate, and restore its light. Wrong notes raise an alarm. |
| Keeper rescue | Find the brass key, restore every lantern, return for the keeper, and lead them to the home beacon. |
| Singing relic | Find the key and light, retrieve the relic with **E**, and carry it home. Its song attracts hunters. **X / Set relic down** creates a false lead; pick it up again with **E**. Delivery is automatic at the home beacon. |
| Hidden hoard | Recover every coin and the hidden light. The exit checks the actual coin count. |
| Watcher crossing | The final leg of a journey or daily trail: open an ordered signal lock, restore lanterns, and evade a Watcher whose phases and marked sweeps intensify. |

Talk to the guide at the start of each leg. Their clue is retained in the
journal, and their decoy/shield choice grants a resource once. **Scout hint**
points toward outstanding prerequisites and objectives. Rescue companions
follow safely and cannot be damaged. Required treasure and relic delivery are
shown in the quest checklist; optional coins still improve ordinary scores.

## Build a kit at camp

After a leg, choose **Make camp**. One heart is restored before departure;
remaining health, decoys, and shields carry forward, each capped at three.
Choose one of two offered upgrades, or **Rest and restock** for an extra heart,
decoy, and shield immediately. Upgrades last for this expedition and cannot be
duplicated. A nine-leg journey has eight camps, enough to collect all eight.

| Upgrade | Effect |
| --- | --- |
| Quiet boots | Dash noise fades after one turn instead of three. |
| Spring soles | Walking and waiting restore two energy. |
| Woven ward | Shields last four turns, including activation. |
| Lantern nectar | Lighting a lantern restores a heart. |
| Deep pockets | An extra decoy and shield at each new leg, within the three-charge cap. |
| Scout glass | A wider revealed circle around the player. |
| Second wind | One extra protected turn after damage. |
| Echo lantern | Decoys distract enemies for seven following turns. |

Choose the next route independently of the upgrade. **Sheltered** has fewer
hunters and grants an extra shield at departure. **Perilous** adds hunters and
embers, earning 150 extra points if you finish the leg. Camp cards preview the
actual region, mission, and hunter count. Cancel or Escape leaves progress
unchanged. The camp scrolls on phones while departure buttons stay visible.

## Oaths and personal goals

| Oath | Restriction | Bonus per completed leg |
| --- | --- | ---: |
| Open trail | Every ability available | 0 |
| Treasure oath | Every coin required on every leg | 150 |
| Measured steps | Dashes disabled | 175 |
| Unwarded | Shields disabled | 200 |

Oaths apply to both keyboard and touch controls. They cannot be changed halfway
through a run. Select rules in the expedition form; the story Rules selector
is disabled during an expedition.

Each leg earns the normal mission score plus its route/oath bonuses. Finishing
earns `max(0, 300 + 100 × legs − 100 × retries)` extra points. The logbook keeps
12 achievement badges, cumulative exploration totals, four-region progress,
and up to 32 completed-run personal bests. Bests distinguish seed, mode, length,
difficulty, and oath. Upgrades reset for a new run; badges are achievements,
not required unlocks or permanent combat advantages.

## Stop, resume, recover

The game checkpoints meaningful actions, including dialogue choices, after each
input. Reload, open the expedition hub, and select **Resume expedition** or
**Return to camp**. Switching to story, a painted map, or Create retains the
checkpoint. Starting or importing another expedition asks before replacing an
unfinished run. One expedition checkpoint is kept at a time.

**Export checkpoint** downloads a separate JSON backup. **Import checkpoint**
verifies its version, bounds, action replay, and state fingerprint before
replacement. An invalid import retains the existing expedition. Expedition
backups are different from editor map JSON. Save them before clearing browser
data or changing origin/port. Browser storage failures display an export warning;
play and exporting the current in-memory run remain available.

**Retry / R** restarts only the current unfinished leg, using its starting kit.
Previous wins, camp upgrades, and learned movement habits remain. A completed
leg cannot be restarted to farm its credit. A lost leg can also be saved and
resumed. **Forget learned habits** resets this expedition's movement counts;
it does not erase the route, goals, kit, badges, or campaign profile.

New backups use rules version 0.6.0; genuine 0.5.0 backups are verified and
migrated when loaded. Journals allow 8,192 meaningful
inputs per leg and imports allow 220 KB; ordinary verified legs take 23–207
turns. Past the journal limit, continue to the next camp to start a fresh
checkpoint. Warnings report unavailable saves. Logbook duplicate-credit tokens
are bounded to the most recent 512 entries; a retained finish token also covers expired leg tokens. Importing an old
completed backup after its finish token expires can credit it again. Scores and fingerprints are local recovery
tools, not competition security or cloud synchronization.

## Try different approaches

- Learn a short Trail journey, then repeat its seed with a different branch.
- Try a nine-leg voyage and combine quieter dashes with longer-lived decoys.
- Use Measured steps to make cover, energy timing, and safe waiting matter.
- Try Unwarded Nemesis for crossings that rely on movement and misdirection.
- Finish a Treasure oath journey to explore side rooms you previously skipped.
- Return for the next UTC daily trail; it does not replace a suspended run
  without confirmation.

The [QA record](QA.md) reports tested seeds, full runs, recovery cases, and
browser limits. Generated connectivity checks and winning fixtures cannot
establish that every possible seed or strategy has been played or that every
player will find the difficulty enjoyable. Actual play feedback remains useful.
