# Démarrage rapide — Scarlett 18i20 3rd Gen + Companion

**Version de développement : v0.1.13**

**Cible validée pour le chargement : Companion 5.0.3 / Module API 2.0.0.**

## Ce module utilise quoi ?

Il utilise **Focusrite Control Server**, installé avec Focusrite Control. Il ne remplace pas le pilote audio USB Focusrite.

Le module vérifie explicitement que le périphérique annoncé est :

`Scarlett 18i20 (3rd Gen)`

Il ne suppose jamais un ID fixe pour le périphérique et découvre automatiquement le port TCP actuel du Control Server.

## Pour tester

1. Clone le dépôt Git.
2. Installe Node.js 22.20+ et active Corepack.
3. Double-clique `UPDATE_AND_RUN.bat` pour choisir une branche, faire un `git pull --ff-only`, puis valider/package la branche courante.
4. `RUN.bat` seul exécute le pipeline standard : installation Yarn, vérification Prettier, ESLint, manifest, tests et `companion-module-build`.
5. Le package généré est produit par `companion-module-build`.

La RC v0.1.13 a passé le gate Windows avec **31/31 tests**, lint, manifest et build Companion propres.

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

## État inconnu au démarrage : comportement supporté

Le serveur Focusrite ne renvoie pas toujours Air 1–8, Pad 1–8, Monitor Mute et Monitor Dim lors d'un démarrage à froid. Ces valeurs restent alors **inconnues**, jamais supposées à `false`.

Le contrat v0.1.13 est :

- une action explicite `On` / `Off` ou une valeur cible vérifiée peut être envoyée même si l'ancienne valeur est inconnue, uniquement si le module est connecté, la commande est dans la surface writable vérifiée et le client Companion est autorisé par Focusrite ;
- Toggle, Cycle et les ajustements relatifs sont bloqués tant que l'état courant n'est pas confirmé par le serveur ;
- feedbacks et variables suivent uniquement l'état confirmé par Focusrite ;
- aucun write n'est utilisé pour découvrir ou « réchauffer » l'état.

Voir `docs/STATE_CONTRACT.md`.

## Ce qui n'est volontairement PAS présent

- faux `Input Mute`
- faux `Mic Kill`
- faux contrôle du potard de gain physique
- faux 48 V par canal
- write du Monitor gain item `1677`

La recherche sur cette 18i20 Gen 3 ne justifie pas d'exposer ces contrôles de cette façon via Focusrite Control Server.

## Avant partage public

Ce dépôt est un miroir de développement personnel. Le nom/identifiant final du dépôt officiel Bitfocus doit encore être confirmé avec les mainteneurs avant une release officielle.

La cible stable publique reste **v1.0.0** dans le futur dépôt Bitfocus officiel, sauf instruction différente des mainteneurs.
