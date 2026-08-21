# Official Focusrite client passive session observer

Updated: 2026-08-21

## Why this branch exists

The physical Scarlett 18i20 (3rd Gen) cold-start probe proved that the normal Control Server subscription lifecycle returns only 3/21 guarded Core values. A subsequent static scan of installed Focusrite binaries found no credible separate read-command XML root. Multiple public clients, including an 18i20-specific implementation, also use the same `client-details` / `device-subscribe` / `set` event model.

The next evidence must therefore come from **observing what the official Focusrite client actually does**, not from inventing another request.

Branch: `debug/official-client-passive-session`.

## Safety model

This observer sends **no Focusrite protocol message at all**.

It uses Windows' built-in `pktmon` packet monitor to temporarily capture only the dynamically identified Focusrite Control Server TCP port.

The observer does not:

- send `client-details`, `device-subscribe`, `keep-alive`, `set`, or any unknown XML;
- alter hardware state;
- alter routing, clock, sample rate, firmware, snapshots or Focusrite settings;
- terminate or launch Focusrite processes automatically;
- install Wireshark/Npcap or any third-party capture driver.

## Companion traffic isolation

Companion may remain open during this diagnostic.

The checked-in module identifies its Control Server session with the fixed public client name `Companion Scarlett 18i20`. The passive parser groups TCP traffic by client session and locally excludes any session whose `client-details` hostname exactly matches that module name.

Important privacy rule: the parser uses that hostname only locally to classify the session. Client keys, other hostnames, endpoints and port values are never copied into the public report.

The sanitized result reports only the number of Companion sessions excluded and the number of non-Companion sessions actually analysed. If no non-Companion session is reconstructed, the result is explicitly inconclusive rather than pretending that Companion traffic was the official client.

## Human action during capture

After capture starts, the console asks the user to:

1. close **only the Focusrite Control application window**;
2. reopen Focusrite Control normally;
3. leave Air/Pad/Mute/Dim/Talkback untouched;
4. wait for the automatic capture timeout.

Do not close Companion for this test; its session is excluded locally.

There is no intermediate Enter prompt. Root `RUN.bat` still provides one final pause so the human can read the result before closing the console.

## Privacy

Raw network material is private and temporary.

- ETL and PCAPNG files live only under gitignored `.local-captures/`;
- only the currently detected Focusrite server TCP port is filtered;
- raw captures are deleted in a global `finally` path even when conversion/parsing fails;
- the temporary Pktmon filter is removed in the same cleanup path;
- if pre-existing Pktmon filters are detected, the observer refuses to run rather than overwrite another diagnostic configuration;
- paths, endpoints, port numbers, hostnames, serials, client keys, device IDs, raw XML and values are excluded from the public report.

Only a normalized summary is eligible for publication to:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md`

The publisher re-fetches the remote branch and verifies exact content after push.

## What the parser reports

The local parser reconstructs captured TCP stream chunks and Focusrite `Length=XXXXXX` frames, then publishes only:

- message direction: client→server or server→client;
- XML root name;
- root attribute **names** only, never attribute values;
- occurrence count;
- how many Companion sessions were excluded locally;
- how many non-Companion sessions were analysed;
- which of the known 21 guarded Core item IDs appeared in server→client `set` frames;
- whether an unknown XML root was observed.

This directly answers two questions:

1. Does the official client send a protocol root that our public research has not observed?
2. Does the official client receive the missing Air/Pad/Mute/Dim IDs during its own startup session even though our independent subscriber does not?

## Decision rules

If an unknown official-client XML root appears:

- record it as research evidence;
- do **not** transmit a guessed version;
- inspect its observed direction/attribute shape first.

If no unknown root appears but the official client receives the missing Core IDs:

- investigate why its subscription/session identity causes a different state snapshot.

If no unknown root appears and the official client also does not receive those Core IDs:

- Control Server likely does not provide those current values through the normal TCP state path;
- then decide whether those feedbacks/actions must remain unavailable until an event is observed, or whether a separate supported state source is needed;
- direct raw USB research remains separate and must not silently enter the public Companion module.

## Current module baseline remains unchanged

This branch does not bump the module version and does not change `src/` hardware behavior. The integration baseline remains v0.1.12 until new readback evidence justifies a controlled module change.
