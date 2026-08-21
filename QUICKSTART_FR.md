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
2. Double-clique `UPDATE_AND_RUN.bat` pour choisir une branche, mettre le dépôt à jour, valider et construire la branche courante. Le workflow prépare automatiquement un Node 22.20+ portable si nécessaire.
3. `RUN.bat` exécute le pipeline standard : installation Yarn, Prettier, ESLint, manifest, tests et `companion-module-build`.
4. Pour v0.1.13, le package construit est `focusrite-scarlett-18i20-0.1.13.tgz`.
5. **Construire le `.tgz` ne change pas la version actuellement utilisée par Companion.**
6. Dans Companion, ouvre **Modules** puis **Import module package** et sélectionne le `.tgz` construit.
7. Ensuite ouvre **Connections**, édite la connexion Focusrite existante, change **Module Version** vers `0.1.13`, puis applique la modification.
8. Après tout changement/restart de version du module, relance le préflight read-only avant un test hardware.

Le TestBench refuse volontairement les writes hardware si la page r9 utilise une autre version du module que `package.json`.

État réel confirmé le 21 août 2026 pendant le TestBench v0.2 : la page r9 est correcte **42/42**, mais Companion utilisait encore **0.1.12** alors que le dépôt construisait **0.1.13**. Cette différence doit être corrigée dans Companion avant de considérer un run hardware comme preuve v0.1.13.

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
