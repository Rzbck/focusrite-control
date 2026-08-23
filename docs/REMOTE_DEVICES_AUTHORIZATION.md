# Remote Devices authorization and stable client identity

Updated: 2026-08-23 Europe/Paris

This note is an operational requirement for the Scarlett 18i20 (3rd Gen) Companion module and TestBench. Read it before diagnosing any write failure.

## What the user must do

Before any SAFE, FULL, targeted or manual test that can send Focusrite writes:

1. Keep the existing Companion Focusrite connection enabled and reuse it.
2. Open Focusrite Control.
3. Open **Device Settings** and find **Remote Devices**.
4. Find the existing Companion client, normally shown as **Companion Scarlett 18i20**.
5. Click **Approve** if it is not already approved.
6. Only continue with write tests after the module reports that its own client is authorised.

If authorization is missing, stop the write campaign. Do not interpret blocked or ignored writes as a hardware/control failure.

## Stable identity rule

The Focusrite Control Server client handshake includes both a visible hostname/name and a client key. Public Focusrite Control protocol research explicitly notes that the hostname may be changed, but changing the client key causes the remote device to require approval again.

The current Companion module follows the same model:

- `src/main.js` generates a private UUID only when the Companion connection does not already have `clientId`;
- that UUID is saved back into the Companion connection configuration;
- `configUpdated()` preserves the existing `clientId`;
- `src/focusrite-client.js` sends that persisted value as `client-key` in `<client-details .../>`;
- the normal visible name is `Companion Scarlett 18i20`.

Therefore the main operational rule is:

**Do not delete/recreate the Companion Focusrite connection or rotate its private client identity between builds/tests. Reuse the same connection instance whenever possible.**

A newly created Companion connection has no saved `clientId`, so it receives a new UUID and Focusrite Control correctly treats it as a new Remote Device that must be approved.

Keep the visible client name stable as well, preferably `Companion Scarlett 18i20`, so the user can immediately recognize the approved client. The name is for operator clarity; the persisted client key is the critical identity value demonstrated by the protocol research.

## Direct read-only probe history and channel-separation rule

The two historical Remote Devices shown as **`Focusrite ReadOnly State Probe`** came from the dedicated cold-start/readback investigation on the `debug/cold-start-readback` branch. Those tools intentionally opened their **own direct TCP session** to Focusrite Control Server so they could study subscription/readback behavior without depending on Companion.

They were read-only because their transmit allowlist contained only `client-details`, `device-subscribe` and `keep-alive`; hardware `<set>` writes were forbidden. However, they were still separate Focusrite Control Server clients with their own `client-key`, so Focusrite correctly listed them as separate Remote Devices. Different historical probe identities can therefore leave more than one pending Remote Device entry even when the visible probe name is the same.

These old pending probe entries are not the normal TestBench control path and do not need to be approved for SAFE/FULL campaigns.

Operational rule for all future AI/contributors:

**Never run a direct Focusrite Control Server research probe at the same time as a normal SAFE/FULL/write-capable TestBench campaign.**

Normal hardware-validation campaigns must use one canonical path:

`TestBench → Companion HTTP/API/buttons → existing approved Companion Scarlett 18i20 connection → Focusrite Control Server → Scarlett`

A direct TCP probe is allowed only for a deliberately isolated research question when the user is told beforehand that the test is leaving the normal Companion path. Its results must be labelled research-only and must not be mixed with a simultaneous FULL/SAFE campaign.

Do not create throwaway direct clients merely to inspect state that Companion already exposes. Prefer the existing Companion connection for normal validation so authorization, state ownership and test interpretation remain unambiguous.

## TestBench rule

Every future AI/contributor/test launcher must explicitly remind the user about Remote Devices approval before a write-capable hardware campaign.

The preflight must classify missing approval as an **authorization/preflight blocker**, not as a control failure. It must tell the user to:

- open Focusrite Control → Device Settings → Remote Devices;
- approve the existing Companion client;
- reuse the existing Companion connection instead of creating a fresh one;
- rerun the preflight after approval.

Do not work around missing approval by optimistic state, raw writes, repeated subscriptions or changing client identity.

## Approval matching remains client-specific

Focusrite Control Server assigns a session client ID and sends approval events. The module must only apply an approval when that event belongs to this module's own server-assigned client ID.

TCP connected is not equivalent to write-authorised.

Feedback and variables remain server-confirmed only. A write blocked because authorization is absent must never produce fake success state.

## Privacy

The persistent `clientId` / `client-key` is private runtime identity material.

Never publish it in GitHub, Slack, issues, screenshots, diagnostics, TestBench reports or public fixtures. Do not print it merely to help the user approve the client; the stable visible name is sufficient.

## Public evidence used for this rule

- Focusrite's Remote Devices documentation states that a remote device is manually approved in Focusrite Control and remains approved until it is explicitly rejected.
- Public Focusrite MIDI Control protocol research documents the `client-details` name/key handshake and explicitly warns that changing the client key requires re-approval.
- Current project code persists the generated Companion client UUID and already blocks writes until approval for the module's own server-assigned client ID is confirmed.
- Historical project code on `debug/cold-start-readback` shows `readonly-state-probe.js` opening a direct TCP session under the visible name `Focusrite ReadOnly State Probe`, with `<set>` explicitly forbidden by its allowlist.

This rule does not broaden hardware support. Current validated hardware remains Scarlett 18i20 (3rd Gen) only.
