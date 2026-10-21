# Garden-Pop continuation instructions

When the user says **continue**, read [CONTINUE.md](CONTINUE.md) before editing. Show the three images in [docs/preview-gallery.md](docs/preview-gallery.md) first, as the user requested, and explain which is a concept versus an actual game capture.

The latest user instruction is to **save this checkpoint for local VS Code work**. Do not publish to Project 0 as part of saving or merely opening this repository. Resume the paused Stage 2/background work when the user asks to continue; follow that turn's instructions about implementation and publication.

The 20-column continuous game and existing animal models/rules must be preserved. The street display and account avatar are separate and must not be modified by the background/Stage 2 task. Never commit Project 0 keys, GitHub credentials, `.env`, `.local`, or environment proxy credentials.

Canonical game source is `src/experience/`. `npm run build` synchronizes it to `public/experience/`; the experience manifest and assets live in `public/experience/`. Project 0 receives the readable package, not `dist/`. Read the handoff's testing/publication notes before running deployment scripts.
