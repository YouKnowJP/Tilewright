# Privacy

Tilewright / Lantern Trails runs in the browser with no game account, game
backend, advertising SDK, analytics SDK, or remote save service. Progress,
preferences, learned movement counts, creator drafts, and worlds remain in
this browser's local storage. The game's adaptive opponents use local counters;
there is no remote AI inference or upload of thought processes.

Pip workshop drafts, verified solutions, personal bests, invention displays and
Pip appearance choices also stay in local storage, separately for each journey.
Duo story drafts, player-created adventures, reusable blueprints and duo displays (including night-post locker/cargo rules and blueprint maker notes) use a separate journey-scoped local save. Shared duo projects include dialogue, author credit, programs, board layout and an optional verified solution; blueprint files include their author, notes and parts.

Blueprint connection previews and space searches run entirely in the browser. Searching moves the local cursor; connection choices enter a saved or shared piece only when you keep, update, download or place it. There is no automatic upload or player-tracking service.

Adventure collection assembly, up to eight saved collections, chapter setups, paused test positions and verified clears are stored locally for each journey under `tilewright.pip-collections.v1`. Full journey backups, switching and fresh-start controls include them. They do not sync automatically across devices. Collection files/codes contain the chapters you choose, their project data and optional creator routes, maker credits and story notes. Copying a code/link or downloading a file is explicit; nothing is uploaded automatically. Opening a chapter uses the existing journey-scoped project draft and best records. Personal chapter progress is excluded from shared collection files/codes/links and illustrated posters. Collection garden remixes and route verification run locally. The last eight chapter-tool Undo snapshots stay in memory for the visit. Poster downloads contain authored map previews, chapter and collection maker credits, goals, and optional creator-route labels; small hosted collections may include their full playable PC1 link. Nothing is uploaded automatically. Unreadable saves are preserved for explicit recovery downloads; full shelves and failed writes show a warning without uploading anything.
Lantern switch states and creator-route checks run on this device. Paused collection tests reconstruct remembered power from the saved project and tick count; no interaction trace is sent to a server. Variant sets and one-chapter downloads use authored project data and exclude personal collection progress. These features use the existing journey save keys and full backups.

Route rehearsals and their event frames are computed on this device and are not uploaded. Inspecting a completed route can record a verified clear and personal best in the selected journey; the rehearsal timeline itself stays in memory.
Workshop feedback is a voluntary local download, with the challenge ID, solution
metrics, selected difficulty feedback and the comment you type. It includes no
journey backup or account identifier and is never sent automatically. Public
community suggestions are submitted manually through GitHub Issues; nothing is
uploaded just by building or sharing a project.

Exported backup/world/Storybook/Pip project files stay where you save them. Sharing a play
link, code, or file intentionally discloses its included world data to the
recipient. Do not put personal or sensitive information into shared worlds.

The official game is hosted by GitHub Pages. GitHub receives normal website
requests, including IP addresses, under its own [privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
Opening GitHub issue/profile links leaves the game. Bug reports and public
repository contributions are public unless submitted through a private channel.

The old and new public game paths use the same `youknowjp.github.io` origin and
unchanged save keys. Saves are shared across those paths in the same browser;
a move to another origin/browser/device requires an exported backup. Clearing
site data can erase local progress. Use Options → Saved data for backups,
restoration, separate journeys, and a fresh start. No player data is uploaded
by the repository migration.

Timed bell countdowns are reconstructed from the saved test position inside the existing local collection journal. Curator exports include chosen authored chapters and maker credits, with no personal setups, clears or countdown saves. No new storage key or network service is added.

Optional collection goals are authored PC2 metadata. Personal bonus ribbons are derived from verified local clears and remain in the existing journey collection journal. Shared collections/posters exclude personal results, current setups and retry positions. No new storage key, tracking or network service is added.

Adventure Home reads existing local drafts, verified bests and collection progress. Selecting a story keeps its draft as the most recently used duo setup in the existing journal. Tiny practice gardens have separate in-memory state and do not save practice results, change adventure progress or upload anything. Save keys, backup formats and profile boundaries remain unchanged.
