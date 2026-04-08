# NFT Massacre

NFT Massacre is a chaotic wallet-powered browser game where your collectibles stop being quiet JPEGs and start becoming NPCs you can chase, punch, and terrorize in a 3D arena.

For hackathon purposes, this project is framed as a Solana-first GameFi concept with a multichain prototype already running in the browser.

- your wallet becomes the enemy roster
- your collectibles become in-game characters
- your onchain identity becomes gameplay
- your bag becomes content

In other words: this is emotional asset management.

## The Pitch

Most NFT apps ask you to admire your collection.

NFT Massacre asks a better question:

What if your wallet contents spawned into a game world and you had to deal with them personally?

This repo contains the core playable prototype:

- a first-person 3D web experience
- wallet-driven NFT ingestion
- multichain wallet support for Ethereum and Solana
- NFT-based NPC spawning
- target selection, panic behavior, and combat interactions
- a wallet inspection view for fungible tokens and NFTs

The result is a silly but strong GameFi loop: connect identity, inventory, and action into one immediate experience.

## Why This Fits A Solana Hackathon

Solana is a strong fit for this direction because the idea gets better when:

- wallet reads are fast
- assets are cheap to use in gameplay
- progression and rewards can be onchain without becoming a gas-funded comedy sketch
- social identity, collectibles, and game state can plug into the same ecosystem

The hackathon framing is simple:

- read wallet assets
- turn assets into game actors
- let players fight, rank, or transform their own collections
- add rewards, badges, or progression on Solana

Today, this repo already proves the funniest and most important part: the moment your wallet turns into a crowd of NPCs and starts regretting its life choices.

## Current Repo Status

This repository is the live web prototype.

What is already here:

- static site deployed via GitHub Pages
- Three.js-powered 3D scene
- browser HUD and overlays
- NFT NPC spawning from wallet data
- multichain wallet loading for Ethereum and Solana
- a Solana demo wallet preset for quick demos
- mobile-aware performance tuning

What still belongs on the near-term roadmap:

- tighter Solana wallet adapter integration
- richer Solana NFT and compressed asset support
- onchain rewards, achievements, or progression
- competitive or cooperative GameFi loops beyond the current combat sandbox

## Gameplay Loop

1. Enter a wallet address.
2. Load collectibles from that wallet.
3. Spawn those assets into the arena as NPCs.
4. Walk around the world and pick a target.
5. Punch your portfolio until morale improves.

This is not financial advice.

This is barely spiritual advice.

## Why It Is GameFi

NFT Massacre is not just an NFT viewer with extra cardio.

It turns wallet state into interactive game state:

- assets become enemies or characters
- ownership becomes level content
- wallet composition changes the session
- collectible metadata becomes visual identity

That is the core GameFi idea here: your inventory is not adjacent to the game. Your inventory is the game.

## Tech Stack

- HTML/CSS/JavaScript
- [Three.js](https://threejs.org/) for 3D rendering
- `ethers.js` for Ethereum wallet loading
- `@solana/web3.js` for Solana wallet loading
- GitHub Pages for deployment

## Project Structure

- `index.html` - main game shell
- `app.js` - 3D world, player controls, NPC logic, wallet-NPC integration
- `styles.css` - game HUD and overlay styling
- `walletloader/` - multichain wallet asset loading UI and logic
- `assets/` - 3D and media assets

## Run Locally

Because this is a static site, the easiest option is to serve it with any simple local web server.

Examples:

```sh
python -m http.server 8000
```

or

```sh
npx serve .
```

Then open `http://localhost:8000`.

For a quick Solana-themed demo flow, the app also supports a preset query mode that loads a demo wallet automatically.

## Hackathon Story

The fun version:

"We built a GameFi experience where your wallet becomes a hostile mob and your collectibles become gameplay."

The serious version:

"NFT Massacre explores wallet-native game design by transforming owned assets into interactive in-game entities. The prototype demonstrates how collectible metadata can drive content generation, identity, and player-specific gameplay loops. The Solana hackathon version pushes this toward faster wallet-native gameplay, lower-friction rewards, and a more scalable onchain game economy."

## Next Steps

- plug in wallet adapter UX for smoother Solana onboarding
- support more Solana NFT metadata and collection semantics
- add scoring, rounds, and progression
- add rewards or badges onchain
- let specific collections create different enemy classes or abilities
- turn "kill all NFTs in your wallet" into an actual game mode, not just a mood

## Demo Energy

This project is:

- funny on purpose
- weird in the correct way
- technically real
- easy to understand in under 30 seconds
- memorable enough that judges will probably mention it to each other later

That is valuable in a hackathon.
