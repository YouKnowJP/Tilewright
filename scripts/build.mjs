import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const PUBLIC_FILES = Object.freeze(['src/adventure-opening.mjs','src/pip-card-dial.mjs','src/pip-card-dial-ui.mjs','src/pip-dial-finale.mjs','src/pip-turnstile.mjs','src/pip-turnstile-ui.mjs','src/pip-toll-house.mjs','src/pip-rendezvous.mjs','src/pip-meeting-house.mjs','src/pip-blueprint-meeting-ui.mjs','src/pip-rails.mjs','src/pip-rail-editor.mjs','src/pip-rail-house.mjs','src/pip-blueprint-rails.mjs','src/pip-blueprint-rails-ui.mjs','src/pip-counters.mjs','src/pip-counter-editor.mjs','src/pip-counter-house.mjs','src/pip-blueprint-counters.mjs','src/pip-blueprint-counters-ui.mjs','src/pip-vanes.mjs','src/pip-vane-editor.mjs','src/pip-wind-house.mjs','src/pip-blueprint-compass.mjs','src/pip-blueprint-compass-ui.mjs','src/pip-rests.mjs','src/pip-rest-editor.mjs','src/pip-rest-house.mjs','src/pip-blueprint-pacing.mjs','src/pip-drums.mjs','src/pip-drum-editor.mjs','src/pip-drum-house.mjs','src/pip-blueprint-timing.mjs','src/pip-blueprint-timing-ui.mjs','src/pip-weaves.mjs','src/pip-weave-house.mjs','src/pip-weave-editor.mjs','src/pip-blueprint-weaves.mjs','src/pip-blueprint-weaves-ui.mjs','src/pip-kilns.mjs','src/pip-kiln-editor.mjs','src/pip-kiln-house.mjs','src/pip-blueprint-formulas.mjs','src/pip-blueprint-formulas-ui.mjs','src/pip-mixers.mjs','src/pip-mixing-house.mjs','src/pip-blueprint-recipes.mjs','src/pip-blueprint-recipes-ui.mjs','src/pip-echoes.mjs','src/pip-echo-post.mjs','src/pip-blueprint-cards.mjs','src/pip-blueprint-cards-ui.mjs','src/pip-scales.mjs','src/pip-balancekeeper.mjs','src/pip-blueprint-power.mjs','src/pip-blueprint-power-ui.mjs','src/pip-tides.mjs','src/pip-tidekeeper.mjs','src/pip-tide-editor.mjs','src/pip-rainwright.mjs','src/pip-road-planner.mjs','src/pip-road-planner-ui.mjs','src/pip-controls.mjs','pip-home.css','src/pip-staged-hints.mjs','src/pip-home-model.mjs','src/pip-home-ui.mjs','src/pip-practice.mjs','src/pip-practice-ui.mjs','src/pip-sealkeeper.mjs','src/pip-collection-challenges.mjs','src/pip-bellkeeper.mjs','src/pip-collection-curator-ui.mjs','src/pip-lantern-workshop.mjs','src/pip-star-atlas.mjs','src/pip-collection-tools.mjs','src/pip-collection-poster.mjs','src/pip-clocktower.mjs','src/pip-collection-storage.mjs','src/pip-after-hours.mjs','src/pip-collections.mjs','src/pip-collections-ui.mjs','src/pip-canopy-fair.mjs','src/pip-blueprint-links.mjs','src/pip-blueprint-links-ui.mjs','src/pip-dawn-workshop.mjs','src/pip-garden-tools.mjs','src/pip-garden-tools-ui.mjs','src/pip-rehearsal.mjs','src/pip-rehearsal-ui.mjs','src/pip-night-mail.mjs','src/pip-duo.mjs','src/pip-duo-blueprints.mjs','src/pip-duo-storage.mjs','src/pip-duo-ui.mjs','src/pip-tinker.mjs','src/pip-studio-ui.mjs','src/pip-coach.mjs','src/pip-look.mjs','pip-studio.css','src/pip-gardens-worlds.mjs','src/workshop-blueprints.mjs','src/pip-freight.mjs','src/pip-foundry-worlds.mjs','src/pip-switchback-worlds.mjs','src/pip-glassworks-worlds.mjs','src/pip-prism-worlds.mjs','src/pip-orchard-worlds.mjs','src/pip-loom-worlds.mjs','src/pip-parcelworks-worlds.mjs','src/pip-atlas-worlds.mjs','src/pip-programs.mjs','src/pip-programs-ui.mjs','src/pip-orchestra-worlds.mjs','src/game-confirm.mjs','src/storybook-bookmarks.mjs','src/clockwork.mjs','src/clockwork-ui.mjs','src/clockwork-worlds.mjs','rights.html','LEGACY-MIT-LICENSE.txt','THIRD_PARTY_NOTICES.md','PRIVACY.md','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','src/saga-worlds.mjs','src/saga-clears.mjs','play.css','manifest.webmanifest','src/screen-mode.mjs','src/play-layout.mjs','wonders.css','src/adventure-wonders.mjs','src/adventure-clues-ui.mjs','src/workshop-wonders-ui.mjs','src/cartographer-worlds.mjs','src/cartographer-clears.mjs','src/player-text.mjs', 'src/browser-yield.mjs', 'src/traveler-wardrobe.mjs', 'traveler.css', 'src/traveler-art.mjs', 'src/traveler-ui.mjs', 'src/storybook-lanternfair.mjs', 'src/adventure-accessibility.mjs', 'src/storybook-welcome.mjs', 'accessibility.css', 'src/storybook-promise.mjs', 'src/trail-memories.mjs', 'src/workshop-assemblies.mjs', 'src/workshop-trailboard.mjs', 'src/adventure-reviews.mjs', 'src/adventure-review-ui.mjs', 'src/save-profiles.mjs', 'src/save-data.mjs', 'src/save-data-ui.mjs', 'dropdowns.css', 'src/game-dropdowns.mjs', 'index.html', 'style.css', 'adventure.css', 'front.css', 'controls.css', 'src/adventure-resume.mjs', 'src/adventure-rewind.mjs', 'src/adventure-controls.mjs', 'src/adventure-input.mjs', 'game-theme.css', 'workshop.css', 'storybook.css', 'trailhouse.css', 'src/trailhouse-content.mjs', 'src/trailhouse-model.mjs', 'src/trailhouse-art.mjs', 'src/trailhouse-ui.mjs', 'src/storybook-model.mjs', 'src/storybook-worlds.mjs', 'src/storybook-adventures.mjs', 'src/story-adventure-clears.mjs', 'src/storybook-ui.mjs', 'studio.css', 'training.css', 'src/training-checkpoint.mjs', 'src/training-model.mjs', 'src/training-ui.mjs', 'src/creator-guide.mjs', 'src/mapmaker-shell.mjs',
  'src/workshop-model.mjs', 'src/workshop-sharing.mjs', 'src/workshop-library.mjs', 'src/workshop-worlds.mjs', 'src/workshop-art.mjs', 'src/workshop-designer.mjs', 'src/workshop-ui.mjs', 'src/workshop-clears.mjs', 'src/workshop-afterhours.mjs', 'src/workshop-mastery.mjs', 'src/workshop-lab.mjs', 'src/workshop-lab-clears.mjs', 'icon.svg', 'LICENSE', 'src/adventure-journal.mjs', 'src/adventure-front.mjs', 'src/adventure-preferences.mjs', 'src/adventure-atlas-levels.mjs', 'src/adventure-horizon-levels.mjs', 'src/adventure-art.mjs', 'src/adventure-guild.mjs', 'src/adventure-tools.mjs',
  'src/bootstrap.mjs', 'src/app.mjs', 'src/model.mjs', 'src/sample.mjs', 'src/render.mjs', 'src/storage.mjs',
  'src/viewport.mjs', 'src/icons.mjs', 'src/operations.mjs', 'src/adventure.mjs', 'src/adventure-levels.mjs', 'src/adventure-mechanisms.mjs', 'src/adventure-intel.mjs', 'src/adventure-sluice-levels.mjs',
  'src/adventure-records.mjs', 'src/adventure-render.mjs', 'src/adventure-sound.mjs', 'src/adventure-ui.mjs', 'src/adventure-brain.mjs', 'src/adventure-tactics.mjs', 'src/adventure-perks.mjs', 'src/adventure-generator.mjs', 'src/adventure-journey.mjs', 'src/adventure-logbook.mjs', 'src/adventure-expedition-ui.mjs']);

export const GENERATED_FILES=Object.freeze(['.tilewright-build.json','RELEASE.md','release.json']);

export async function build(destination = path.join(ROOT, 'dist')) {
  destination = path.resolve(destination);
  let existing;
  try { existing = await readdir(destination); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const marker = '.tilewright-build.json';
  if (existing?.length) {
    let owned = false;
    try { owned = JSON.parse(await readFile(path.join(destination, marker), 'utf8')).project === 'tilewright'; }
    catch { /* Never replace a directory that is not a Tilewright build. */ }
    if (!owned) throw new Error('Choose an empty directory or an existing Tilewright build.');
  }
  await mkdir(path.dirname(destination), { recursive: true });
  const staging = await mkdtemp(path.join(path.dirname(destination), '.tilewright-build-'));
  try {
    for (const file of PUBLIC_FILES) {
      await mkdir(path.dirname(path.join(staging, file)), { recursive: true });
      await cp(path.join(ROOT, file), path.join(staging, file));
    }
    const { version } = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
    const indexPath=path.join(staging,'index.html');
    const index=await readFile(indexPath,'utf8');
    await writeFile(indexPath,index.replace(/(<span\b[^>]*\bdata-release-version[^>]*>)[^<]*(<\/span>)/,`$1v${version}$2`));
    let sourceCommit=null;try{sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
    await writeFile(path.join(staging,'release.json'),JSON.stringify({project:'tilewright',version,repository:'https://github.com/YouKnowJP/Tilewright',playURL:'https://youknowjp.github.io/Tilewright/',sourceCommit,sourceVisibility:'public',legacyBaseline:'c1c7534e4641e0385293af004d1c5c7346e0a920',license:'SEE LICENSE IN LICENSE'},null,2)+'\n');
    await writeFile(path.join(staging, marker), JSON.stringify({ project: 'tilewright', version, files: PUBLIC_FILES }, null, 2) + '\n');
    await writeFile(path.join(staging, 'RELEASE.md'), `# Tilewright ${version}\n\nServe this directory over HTTP (not file://). No installation or external services required.\n\nFor example: python3 -m http.server 4174 --bind 127.0.0.1\n\nOpen http://127.0.0.1:4174. Choose Play adventures or open http://127.0.0.1:4174/#play for Lantern Trails.\n\nAdventure bests use a separate browser save. Maps are saved in this browser's storage; export JSON for durable backups.\n\nFree personal play; see LICENSE, LEGACY-MIT-LICENSE.txt and THIRD_PARTY_NOTICES.md. Earlier MIT permissions remain effective. Source: https://github.com/YouKnowJP/Tilewright\n`);
    if (existing) await rm(destination, { recursive: true });
    await rename(staging, destination);
    return { destination, version, files: [...PUBLIC_FILES, ...GENERATED_FILES] };
  } catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`Tilewright ${result.version}: ${result.files.length} files built in ${result.destination}`);
}
