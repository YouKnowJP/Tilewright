# Design notes: readable choices and recoverable puzzles

These references informed the v0.6 refinement; their artwork, maps, characters,
and code are not bundled in Tilewright.

Matthew Davis’s [Into the Breach design postmortem, GDC 2019](https://media.gdcvault.com/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf)
connects tactical decisions with readable enemy information and discusses the
sharp boundary between a difficult puzzle and an impossible one (slides
7, 13, 29–30, and 46). Tilewright applies that direction through a free next-turn
forecast, existing committed hunter markers, and previews of valve effects.
The new missions change routes and objectives instead of merely adding enemies.

The [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)
encourage contextual help, reminders of objectives and controls, accessible
interaction targets, and alternatives to gesture-dependent actions. Tilewright
retains buttons and keyboard alternatives to swipes, records every spoken
keeper’s advice, offers a selectable nearby action, and keeps forecast/dialogue
reading outside the turn clock. These changes are not a claim of accessibility
certification or completed screen-reader/device validation.

The sluice saga uses reversible controls with a specific safety rule: a crossing
cannot close beneath a player, companion, crate, or enemy. Valve previews list
the affected crossings and ember cells. A failed setting change consumes no
turn or item. Coin trades are optional, spend only unspent coins, retain collected
quest credit, and cannot sell a parcel whose supplies are already full.

Verification combines deliberately unsuccessful actions, full clean winning
routes, save migration, generated-map checks, exploratory input sequences, and
browser navigation/layout tests. The [QA record](QA.md) distinguishes that
coverage from untested devices and actual player enjoyment or difficulty studies.

The v0.7 atlas expansion applies these existing principles to nine distinct
authored maps: route reversal, quiet walking circuits, shield-free treasure
recovery, four-note locks, and convoy delivery. The extra difficulty comes from
combining readable goals and limited resources. Every new choice branch has a
clean public-action witness on both rule sets; those witnesses establish
playability, not a measured difficulty curve or long-term player enjoyment.

The illustrated atlas groups the growing mission list into six regions and
lets players begin any chapter. Palette changes and worn paths make places
recognizable without changing collision. Threat colors retain their meanings
across regions. Rule banners explain constraints before a failed action, and
the small-screen board shrinks on those missions to retain usable controls.
Optional field goals suggest a second route without blocking completion.

The v0.8 [research notes](RESEARCH.md) connect primary developer sources to
Guild specialists, energy-competing waystone routes, readable consequences,
and optional commendations. See the [Guild guide](GUILD.md) for shipped rules.
