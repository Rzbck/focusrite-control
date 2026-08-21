# Official Focusrite client read-source research

Updated: 2026-08-21

## Why this branch exists

The physical Scarlett 18i20 (3rd Gen) read-only cold-start probe proved that the standard Focusrite Control Server subscription lifecycle returns only 3/21 guarded Core values at startup.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim remained absent in:

- cold connect + one subscribe;
- unsubscribe → subscribe;
- clean TCP reconnect + subscribe.

Phase B received 404 state items and still omitted those 18 values. Timing/re-subscribe research is therefore closed.

This branch investigates whether the official Focusrite software contains or uses another **read primitive/state source**.

## Public client research completed

Public Focusrite Control Server clients inspected:

- `Mathieu2301/Focusrite-Control-API`;
- `raduvarga/Focusrite-Midi-Control`;
- `sserolf/focusrite-midi-mapper-js`;
- `daveyijzermans/tally-server`;
- `enum-labs/focusrite-volume-control`;
- `dounix/focusrite-autoclock`;
- `sebastianrau/focusrite-mackie-control`.

Observed common model:

1. connect to Focusrite Control Server;
2. send `client-details`;
3. receive/parse device arrival;
4. send `device-subscribe`;
5. keep the session alive;
6. receive current/change values through server state/set events;
7. use `set` only for writes.

No inspected public client provides evidence for a separate `get`/read request.

The `enum-labs` client attempts to extract any server-supplied value attributes directly from device arrival before subscribing, matching the safe behavior already implemented in this project.

`sebastianrau/focusrite-mackie-control` is especially relevant because it contains an 18i20 (3rd Gen) device-arrival capture/schema and a typed Control Server parser/client. Its parser recognizes only `client-details`, `set`, `device-arrival`, `device-removal`, `keep-alive` and `approval`; its client sends client details, subscribe, keep-alive and `set` writes. No separate read message is implemented there either.

Its public 18i20 schema independently confirms Monitor hardware-control IDs 1677/1678/1679 for gain/dim/mute. This is supporting schema evidence only; our own hardware tests remain authoritative for supported behavior, and Monitor gain 1677 remains read-only in this project.

### Interpretation

This does **not** prove that no private/constructed read primitive exists in the official Focusrite Control application. It does prove that inventing one from public examples would be unjustified.

## Static official-client scan — real Windows result

The checked-in static scanner ran successfully against the installed/running Focusrite software and auto-published a sanitized report to:

- branch: `diagnostics/readback-results`;
- file: `diagnostics/runtime/latest-static-protocol-scan.md`.

Observed on the real Windows host:

- 2 Focusrite processes discovered;
- 4 relevant binaries/libraries scanned;
- known protocol roots found: `device-subscribe`, `keep-alive`, `server-announcement`, `set`;
- no additional protocol-like XML root found.

The first report listed `current-layer`, `read-only`, `save-snapshot` and a Windows `ext-ms-*current*` token as lexical read-like strings. These are **not** evidence of a Control Server read primitive:

- `read-only` and `current-layer` are generic lexical strings;
- `ext-ms-*` is Windows runtime noise;
- `save-snapshot` is a known device-schema command/item and is explicitly unsafe/not exposed by this project.

The scanner was therefore hardened so generic lexical strings cannot be promoted to decision-grade readback commands. Only an actual previously unknown XML root can now trigger the protocol-candidate decision.

### Static-scan conclusion

**No separate static read-like Control Server XML root has been observed.**

Do not rerun the same static scan merely to repeat this conclusion unless the installed Focusrite software changes or scanner coverage materially changes.

## Current diagnostic implementation

The scanner:

- discovers running Focusrite process executable locations locally;
- never prints or publishes those paths;
- reads only relevant Focusrite/control/server executable/library files;
- extracts ASCII and UTF-16LE strings in memory;
- publishes only normalized protocol-like token names and counts;
- never publishes raw binary strings;
- sends **no Focusrite protocol traffic**;
- modifies no Focusrite file/settings/software.

The publisher re-fetches the remote diagnostics branch and verifies exact content after push.

## Next safe step: passive official-client session observation

The next research step is no longer another subscription or static-string experiment. It is passive observation of traffic involving the **official Focusrite Control client**.

Preferred Windows mechanism: built-in Microsoft `pktmon`, filtered to the dynamically discovered Focusrite Control Server TCP port. Microsoft documents that `pktmon` can filter by TCP port, capture full packet bytes, and convert ETL capture logs to text/pcapng.

A project observer must be stricter than a normal packet capture:

- use only the dynamic Control Server port;
- send no unknown Focusrite protocol command;
- never publish ETL/pcap/raw packet/text capture;
- keep raw capture only in a temporary local directory;
- extract only XML root names/counts needed for protocol research;
- sanitize before any Git publication;
- delete raw capture artifacts after local parsing;
- preserve one final human pause only;
- never change Focusrite hardware/routing/settings.

To learn whether the official GUI emits a special startup request, a fresh official-client connection will ultimately need to be observed. Do not automate closing/killing/restarting Focusrite software without explicit user agreement; if needed, ask the user to close/reopen the GUI while passive capture is active.

## Direct raw USB

Direct raw USB remains secondary until the Control Server/official-client path is exhausted. If passive official-client observation shows no other read source, revisit the existing raw-USB research only as a deliberate architectural decision, not as an ad-hoc workaround.
