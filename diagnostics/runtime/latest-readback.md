# Automated sanitized Focusrite readback diagnostic

> Generated locally by `debug/cold-start-readback` and pushed automatically.
> This file intentionally excludes raw XML, serial numbers, hostnames, network endpoints, client/device IDs and local paths.

Source branch: debug/cold-start-readback
Source commit: 6212ddf2e271cc99ae5b2829fff3d3b789c87e68
Source result: readonly_state_probe_20260821_094514.txt
Node: 22.23.2
Runner preflight: syntax checks + dedicated readback tests passed
Hardware write path: forbidden by probe allowlist

---

FOCUSRITE CONTROL READ-ONLY STATE PROBE v2
Target model: Scarlett 18i20 (3rd Gen)
TCP transmit allowlist: client-details, device-subscribe, keep-alive
Hardware <set> writes: FORBIDDEN
Raw/private protocol logging: DISABLED
PASS  Focusrite Control Server discovered dynamically.
PASS  Exact model detected: Scarlett 18i20 (3rd Gen)

PHASE A - cold connect + one subscribe=true: Core seen=3/21; missing=18; setPackets=174; setItems=3560; otherSetIds=381
MISSING  Air 1            value=<MISSING>  source=-
MISSING  Pad 1            value=<MISSING>  source=-
SEEN     Input 1 Mode     value=Line       source=set
MISSING  Air 2            value=<MISSING>  source=-
MISSING  Pad 2            value=<MISSING>  source=-
SEEN     Input 2 Mode     value=Line       source=set
MISSING  Air 3            value=<MISSING>  source=-
MISSING  Pad 3            value=<MISSING>  source=-
MISSING  Air 4            value=<MISSING>  source=-
MISSING  Pad 4            value=<MISSING>  source=-
MISSING  Air 5            value=<MISSING>  source=-
MISSING  Pad 5            value=<MISSING>  source=-
MISSING  Air 6            value=<MISSING>  source=-
MISSING  Pad 6            value=<MISSING>  source=-
MISSING  Air 7            value=<MISSING>  source=-
MISSING  Pad 7            value=<MISSING>  source=-
MISSING  Air 8            value=<MISSING>  source=-
MISSING  Pad 8            value=<MISSING>  source=-
MISSING  Monitor Mute     value=<MISSING>  source=-
MISSING  Monitor Dim      value=<MISSING>  source=-
SEEN     Talkback         value=false      source=set

PHASE B - subscribe=false then subscribe=true: Core seen=3/21; missing=18; setPackets=1; setItems=404; otherSetIds=378
MISSING  Air 1            value=<MISSING>  source=-
MISSING  Pad 1            value=<MISSING>  source=-
SEEN     Input 1 Mode     value=Line       source=set
MISSING  Air 2            value=<MISSING>  source=-
MISSING  Pad 2            value=<MISSING>  source=-
SEEN     Input 2 Mode     value=Line       source=set
MISSING  Air 3            value=<MISSING>  source=-
MISSING  Pad 3            value=<MISSING>  source=-
MISSING  Air 4            value=<MISSING>  source=-
MISSING  Pad 4            value=<MISSING>  source=-
MISSING  Air 5            value=<MISSING>  source=-
MISSING  Pad 5            value=<MISSING>  source=-
MISSING  Air 6            value=<MISSING>  source=-
MISSING  Pad 6            value=<MISSING>  source=-
MISSING  Air 7            value=<MISSING>  source=-
MISSING  Pad 7            value=<MISSING>  source=-
MISSING  Air 8            value=<MISSING>  source=-
MISSING  Pad 8            value=<MISSING>  source=-
MISSING  Monitor Mute     value=<MISSING>  source=-
MISSING  Monitor Dim      value=<MISSING>  source=-
SEEN     Talkback         value=false      source=set

PHASE C - clean TCP reconnect + one subscribe=true: Core seen=3/21; missing=18; setPackets=164; setItems=3400; otherSetIds=381
MISSING  Air 1            value=<MISSING>  source=-
MISSING  Pad 1            value=<MISSING>  source=-
SEEN     Input 1 Mode     value=Line       source=set
MISSING  Air 2            value=<MISSING>  source=-
MISSING  Pad 2            value=<MISSING>  source=-
SEEN     Input 2 Mode     value=Line       source=set
MISSING  Air 3            value=<MISSING>  source=-
MISSING  Pad 3            value=<MISSING>  source=-
MISSING  Air 4            value=<MISSING>  source=-
MISSING  Pad 4            value=<MISSING>  source=-
MISSING  Air 5            value=<MISSING>  source=-
MISSING  Pad 5            value=<MISSING>  source=-
MISSING  Air 6            value=<MISSING>  source=-
MISSING  Pad 6            value=<MISSING>  source=-
MISSING  Air 7            value=<MISSING>  source=-
MISSING  Pad 7            value=<MISSING>  source=-
MISSING  Air 8            value=<MISSING>  source=-
MISSING  Pad 8            value=<MISSING>  source=-
MISSING  Monitor Mute     value=<MISSING>  source=-
MISSING  Monitor Dim      value=<MISSING>  source=-
SEEN     Talkback         value=false      source=set

DECISION
RESULT: standard subscription lifecycle does not cold-read all Core controls. Stop timing/resubscribe guesses and research a separate read primitive/state source.
