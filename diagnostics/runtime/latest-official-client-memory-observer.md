# Automated sanitized Focusrite official-client memory observer result

> Generated locally from read-only process memory scanning of the freshly reopened official Focusrite client.
> No raw process memory, paths, endpoints, ports, IDs, serials, client keys or values are uploaded.

Source branch: debug/official-client-memory-observer
Source commit: 658c93351b9f98ad66080db3435a9b79ff99c65c
Source result: official_client_memory_observer_20260821_113825.txt
Node: 22.23.2
Raw memory upload: none
Process memory write/injection: none
Focusrite observer protocol transmission: none

---

FOCUSRITE OFFICIAL CLIENT MEMORY OBSERVER v1
Mode: READ-ONLY PROCESS MEMORY FRAME SCAN
Process memory writes/injection: FORBIDDEN
Focusrite protocol messages transmitted by observer: NONE
Raw process memory dump/file: NONE
Private paths/endpoints/ports/IDs/values publication: FORBIDDEN
Official processes attempted: 1
Official processes scanned: 1
Fresh GUI restart detected: YES
Safety scan limit reached: NO

CONCRETE FRAME SUMMARY
- client-discovery | count=1 | attrs=app, version | core=(none)
- server-announcement | count=1 | attrs=app, hostname, port, version | core=(none)

Concrete XML roots: client-discovery, server-announcement
Unknown concrete XML roots: client-discovery, server-announcement
Guarded Core IDs found inside concrete SET frames: (none)
Guarded Core IDs not found: 1259:Input 1 Mode, 1260:Air 1, 1261:Pad 1, 1266:Input 2 Mode, 1267:Air 2, 1268:Pad 2, 1273:Air 3, 1274:Pad 3, 1279:Air 4, 1280:Pad 4, 1285:Air 5, 1286:Pad 5, 1291:Air 6, 1292:Pad 6, 1297:Air 7, 1298:Pad 7, 1303:Air 8, 1304:Pad 8, 1678:Monitor Dim, 1679:Monitor Mute, 1682:Talkback

DECISION
RESULT: UNKNOWN CONCRETE XML ROOT(S) FOUND IN OFFICIAL CLIENT MEMORY. Inspect observed schema before any transmission.
