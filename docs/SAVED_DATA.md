# Your journeys, backups, and fresh starts

Choose the **named journey button** on the main menu or **Options → Saved data**
from the menu or a game. Refresh older open copies before managing journeys;
the separate-journey manager is available in **v0.24 and later**.

## Keep three separate adventures

Existing saves remain **First journey**, with no migration or erasure.
**Begin a new journey…** lets you name a fresh adventure while keeping the old
one. Each journey has its own story/Guild progress, latest trail, expeditions,
Lab seals, Storybooks, Trailhouse, training, personal worlds, terrain maps,
drafts, learned habits, and display/control options.

**Open journey** returns to its main menu; Continue resumes its saved trail.
All open game tabs in the same browser follow the selected journey. Switching
keeps persisted data; changes that could not be saved for this visit are not
carried over. Each journey uses the same browser storage quota.

Rename the current journey with **Rename**. On an inactive journey, **Manage**
offers its backup and confirmed removal. The active journey cannot be removed;
open another journey first. Three slots are available. Names can contain up to
32 characters and must be different. Profiles are local saves, with no accounts
or online synchronization.

## Keep a portable copy

**Download game backup** keeps the current journey’s saved data in a single
`lantern-trails-save.json` file. An inactive journey’s **Manage → Download backup**
keeps that journey instead. Download each journey separately to keep all three.
Names and the journey list are not part of the file. Changes that could not be
saved for this visit are not included. Keep each file somewhere you can find it.

**Restore game backup** lets you choose a file from this or another browser,
including an older v0.23 backup. Review its date and the named destination,
then choose **Replace data & restore**. This replaces only the current journey;
other journeys stay saved. To retain both versions, create a new journey first
and restore into that slot. Cancel leaves all saves unchanged.

Worlds and bests load using their normal validators; unfinished adventures still
use exact Continue. The file limit is **12 MB**. Individual adventure/Storybook
files belong in their usual import screens rather than the full-journey restore
screen. Localhost and the public website keep separate saves.

## Start with no saved progress

Choose **Start a fresh game…**, read the named journey confirmation, then choose
**Erase saves & start fresh**. The safe default is **Keep my current game**;
Escape and controller Back cancel. The game erases that journey’s progress,
creations, drafts, training, learned habits, and options, including older save
versions, then returns to the main menu. Its name and your other journeys remain.
Begin the first story or revisit Training camp; no old personal run resumes.

Other games/websites and downloaded files are untouched. This affects only the
current browser and device. An existing backup can restore erased data, so delete
unwanted downloaded files separately. Removing an inactive journey erases its
name and saved files; download its backup first if you might return.

## If a browser operation fails

The game verifies changes and attempts to restore the previous snapshot when
replacement or journey management fails. It reports failure instead of claiming
success. If the browser also refuses recovery writes, download the offered
**recovery backup** before reloading, then restore that journey file when saving
is available again. If removal failed, open the affected journey (or a new empty
slot if it is missing) before restoring its recovery file. This preserves the
other journeys. The recovery copy stays in the open tab until you leave.

Other open tabs refresh after save management, preventing stale progress from
recreating erased saves or overwriting another journey. Current browsers also
serialize management actions with a browser-wide lock. An interrupted update
shows a waiting screen with explicit recovery after a short delay. Recovery
reloads the latest available data without erasing additional player files.
