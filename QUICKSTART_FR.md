# Démarrage rapide — Scarlett 18i20 3rd Gen + Companion

**Version module : v0.1.12**

**Cible testée pour le chargement : Companion 5.0.3 / Module API 2.0.0.**

## Ce module utilise quoi ?

Il utilise **Focusrite Control Server**, installé avec Focusrite Control. Il ne remplace pas le pilote audio USB Focusrite.

Le module vérifie explicitement que le périphérique annoncé est :

`Scarlett 18i20 (3rd Gen)`

Il ne suppose jamais que l'ID du périphérique est `2` et il découvre automatiquement le port TCP actuel du ControlServer.

## Pour tester

1. Clone le repository Git.
2. Installe Node.js 22.20+ et active Corepack.
3. Double-clique `UPDATE_AND_RUN.bat` pour choisir une branche, faire un `git pull --ff-only`, puis valider/package la branche courante.
4. `RUN.bat` seul exécute le pipeline standard : installation Yarn, format check, ESLint, manifest, tests et `companion-module-build`.
5. Le package généré se trouve dans le dossier de sortie créé par `companion-module-build`.

Le builder Windows portable/autonome utilisé pendant les essais historiques reste un outil local séparé et n'est pas publié dans ce dépôt public.

## Contrôles importants déjà inclus

- Monitor Mute / Dim / Talkback / Alt
- Gain Monitor en télémétrie uniquement (lecture seule ; aucune action de niveau Monitor)
- Air 1–8
- Pad 1–8
- Line/Inst 1–2
- Mute/volume/routing des sorties
- 24 sources du Custom Mixer
- Mix A–F : gain, pan, mute, solo, talkback
- Presets de routing
- Clock source
- Sample rate
- Digital I/O mode
- Phantom persistence
- Talkback source
- Feedbacks et variables
- Presets Stream Deck/Companion

## Ce qui n'est volontairement PAS présent

- faux `Input Mute`
- faux `Mic Kill`
- faux contrôle du potard de gain physique
- faux 48 V par canal

La reverse-engineering de cette 18i20 Gen 3 a montré que ces contrôles ne sont pas exposés de cette façon par Focusrite Control Server.

## Avant partage public

Ce dépôt est un miroir de développement personnel. Le nom/identifiant final du dépôt officiel Bitfocus devra être confirmé avec les mainteneurs avant une release officielle.

## État de développement actuel

La v0.1.12 charge correctement dans Companion 5.0.3 et atteint le statut `OK`. Le readback initial Air/Pad/Monitor Mute/Dim après un démarrage à froid reste en investigation. Le TestBench bloque volontairement tout write lorsque ces états ne sont pas connus/restaurables.
