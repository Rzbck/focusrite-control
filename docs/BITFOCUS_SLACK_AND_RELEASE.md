# Bitfocus Slack / official release state

Updated: 2026-08-21

## Why this repository exists

`Rzbck/focusrite-control` is a personal public development/source-of-truth repository created so the project can be versioned safely, use branch checkpoints, preserve working states and debug without losing known-good behavior.

It is **not** the official Bitfocus Companion module repository.

## Original Bitfocus repository request

A first-module repository request was posted in Companion Slack `#module-development` with the requested Scarlett-specific name:

`focusrite-scarlett-18i20`

The intended official repository at that point was:

`bitfocus/companion-module-focusrite-scarlett-18i20`

## Maintainer discussion

Bryce Seifert replied that `focusrite-control` might be a better repository/module scope because the transport is **Focusrite Control Server**, not direct USB, and therefore could potentially support more Focusrite devices later.

He also offered hardware for future testing.

The project replied that:

- the transport is indeed Focusrite Control Server;
- only **Scarlett 18i20 (3rd Gen)** is validated today;
- broader support must not be claimed before physical testing;
- a broader `focusrite-control` name is acceptable if Bitfocus prefers it;
- capability-based architecture can enable future model support after evidence exists.

## Current decision state

**Waiting for the official Bitfocus repository/naming decision.**

Do not interpret the existence of this personal `focusrite-control` repository as the official naming decision.

Do not rename public module IDs/packages or expand supported products again until the official repository/name is known or maintainers explicitly direct it.

## Final module goal

Ship a safe Bitfocus Companion module where:

- Focusrite Control Server discovery is dynamic;
- TCP port/device ID are never hardcoded;
- Remote Devices authorization is enforced against this client's own server-assigned ID;
- feedbacks/variables come from server-confirmed state;
- unknown state never produces guessed hardware writes;
- only proven safe controls are exposed;
- Scarlett 18i20 (3rd Gen) is the first supported hardware;
- additional Focusrite devices can be added later by capability + hardware testing.

## Stable release target

Once the official Bitfocus repository exists:

1. inspect exact repo name/default branch/seed/permissions;
2. compare official seed with this development tree;
3. use the maintainer-required branch/PR workflow;
4. run the official repository's required CI plus local tests;
5. complete hardware/action audit;
6. keep stable target at **v1.0.0** unless maintainers direct otherwise;
7. only then submit the tag through the Bitfocus Developer Portal.

## Important split: personal repo vs official repo

Personal repo `Rzbck/focusrite-control`:

- no GitHub Actions;
- local validation + branch checkpoints;
- research/debug source of truth.

Future official Bitfocus repo:

- follow Bitfocus maintainer instructions exactly;
- official CI/review rules may differ;
- official naming/id/package metadata wins once decided.
