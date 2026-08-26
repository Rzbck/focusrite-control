# Démarrage rapide — Scarlett 18i20 3rd Gen + Companion

**Version de développement : v0.1.20**

**Matériel actuellement validé : Scarlett 18i20 (3rd Gen) uniquement.**

## Architecture

Le module utilise **Focusrite Control Server**, installé avec Focusrite Control. Il ne remplace pas le pilote audio USB Focusrite.

Le module :

- vérifie explicitement le modèle `Scarlett 18i20 (3rd Gen)` ;
- découvre dynamiquement le port TCP actuel du Control Server ;
- utilise l'ID de périphérique fourni par le serveur, jamais un ID codé en dur ;
- bloque les writes tant que **Remote Devices** n'a pas autorisé le client Companion avec son propre ID assigné par le serveur ;
- met les feedbacks à jour uniquement après confirmation du serveur.

## Construire et charger le module

1. Lance `UPDATE_AND_RUN.bat`.
2. Choisis la branche `testbench/meter-routing-exact-restore` tant qu'elle reste la branche d'objectif indiquée par le `HANDOFF` live.
3. Le launcher synchronise puis exécute installation/dépendances, Prettier, ESLint, manifest, tests Node et build Companion.
4. Le package attendu pour cette version est `focusrite-scarlett-18i20-0.1.20.tgz`.
5. Dans Companion, importe le package puis sélectionne la version `0.1.20` sur la connexion Focusrite.

Construire un `.tgz` ne change pas automatiquement la version déjà chargée par Companion.

## Actions publiques conservées pour la v1

### Monitor

- Mute
- Dim
- Talkback
- sélection du groupe d'Outputs contrôlé par Monitor/Dim/Mute

### Hardware Inputs

- Air, Inputs 1–8
- Pad, Inputs 1–8
- Line/Instrument, Inputs 1–2
- nickname d'entrée

### Outputs

La liste est filtrée par la preuve hardware et par l'état `available` confirmé par le serveur.

- Mute sur les membres directs validés
- niveau des sorties analogiques validées
- routing direct vers Hardware Input / Software (DAW) Playback / sources numériques validées
- routing d'une paire stéréo vers une paire de sources directes validée
- nickname sur les membres validés

### Device / Settings

- nickname de l'interface
- Phantom Persistence / Retain 48V
- Talkback input source
- rediscovery / reconnect

## État lisible mais write volontairement retenu en v1

Ces fonctions restent observables par feedback/variables lorsqu'elles existent, mais leur action publique est retirée de la v1 :

- ALT / Speaker Switching ;
- Stereo-link direct des Outputs ;
- écritures génériques **Custom Mix** : fader, pan, Mute, Solo ;
- Mixer Slot Source/Stereo et Talkback par lane ;
- Device Preset ;
- Clock Source ;
- Sample Rate ;
- Digital I/O / S/PDIF Mode ;
- Advanced Raw.

Les sources internes des Custom Mix ne sont pas proposées comme choix d'écriture de routing Output : Focusrite Control te montre simplement **Custom Mix**, sans correspondance utilisateur fiable avec les IDs internes du serveur.

## Validation matérielle actuelle

Les derniers REC read-only sur la Scarlett physique ont fermé :

- ALT / ALT Enable en **feedback/readback** ;
- Inputs meters 8/8 ;
- tous les Outputs meters actuellement disponibles ;
- **Custom Mix meters 12/12** ;
- lecture dynamique des faders/pan/Mute/Solo et de la topologie Stereo/Source dans Custom Mix.

Les Outputs 21–24 sont actuellement `available=false`. Ils restent bloqués en write même si une autre configuration les rend un jour disponibles, jusqu'à un vrai test matériel de cette configuration.

## Custom Mix : terminologie

Dans les instructions utilisateur, on utilise les noms visibles dans Focusrite Control :

- **Custom Mix** ;
- **Hardware Inputs** ;
- **Software (DAW) Playback** ;
- **Outputs** ;
- **Stereo** ;
- **Mute**.

Les noms internes du protocole ne doivent pas être utilisés pour te demander des manipulations dans Focusrite Control.

## État inconnu au démarrage

Le serveur peut omettre certains états lors d'une session fraîche. Une valeur absente reste **inconnue**, jamais supposée à `false`.

- les actions explicites ne passent que par la surface writable autorisée ;
- Toggle/Cycle/ajustements relatifs nécessitent un état courant confirmé ;
- les Outputs nécessitant `available` ne reçoivent aucun write tant que cette valeur n'est pas explicitement `true` ;
- aucun write n'est utilisé pour « réchauffer » ou découvrir un état.

Voir `docs/STATE_CONTRACT.md`.

## Toujours absent

- faux Input Gain / contrôle du potard physique ;
- faux Input Mute matériel ;
- Mic Kill ;
- 48 V par canal ;
- write du Monitor gain item `1677` ;
- firmware/reset/restore/snapshot ;
- write de meters/status ;
- raw write inconnu/non validé.

## Publication

Ce dépôt reste un miroir de développement personnel. La demande de repository a déjà été faite auprès de Bitfocus. Le nom/scope officiel doit encore être confirmé avant de changer la portée publique.

La cible stable publique reste **v1.0.0** dans le futur dépôt officiel Bitfocus, sauf instruction contraire des mainteneurs.
