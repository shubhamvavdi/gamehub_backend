# GameHub Ad Backend v2
Backend for the published SDK package `@gamehubsdk/gamehub-ad-sdk`.

## What this backend does
- validates game API keys
- serves banner, interstitial and rewarded creatives
- supports game and placement targeting
- campaign/creative approval workflow
- one-time signed impression and click tracking
- click redirect tracking
- rewarded completion endpoint
- analytics event storage
- admin game/campaign management
- rate limiting, Helmet and CORS
- replaceable ad-provider boundary with the current direct-campaign provider

## Important: where ads come from
This backend does **not** magically receive ads from npm or Google. An ad appears only when you create a campaign + creative, approve it, and activate the campaign/creative. You can later add an advertiser dashboard or third-party ad provider integration.

## Install
1. Copy `.env.example` to `.env` and set real values.
2. Create/import a fresh MySQL database using `schema.sql`.
3. `npm install`
4. `npm start`
5. Open `/health`.

## Admin header
Every admin request needs:
`X-Admin-Key: <123456789>`

## SDK/backend contract
`POST /v1/sdk/ads/next`
Headers: `X-GameHub-Key: <game api key>`
Body:
```json
{"gameId":"my-game","developerId":"dev-1","type":"interstitial","placementId":"home_banner"}
```

A filled response keeps the existing `ad` object and adds normalized fields:
```json
{"ok":true,"fill":true,"requestId":"42","ad":{"id":"7","requestId":"42","type":"interstitial","trackingToken":"...","impressionUrl":"...","clickTrackerUrl":"..."}}
```
No fill is a successful response, never a server error:
```json
{"ok":true,"fill":false,"reason":"no_fill","requestId":"...","ad":null}
```
The `/v1/sdk/...` paths are canonical. Existing `/v1/track/...` and `/v1/...` aliases remain available for compatibility.

## Create game
`POST /v1/admin/games`
```json
{"id":"my-game","name":"My Game","developerId":"dev-1"}
```
The response contains the generated public SDK key. Save it securely because it is not returned again.

## Create campaign
`POST /v1/admin/campaigns`
Example:
```json
{"title":"Brand campaign","gameId":"my-game","placementId":"home_banner","type":"banner","imageUrl":"https://.../banner.png","clickUrl":"https://example.com","status":"paused","approvalStatus":"pending"}
```

## Approval flow
1. Create campaign: pending
2. Admin reviews URL and creative
3. `POST /v1/admin/campaigns/:id/review` with `{ "action":"approve" }`
4. Patch campaign status to `active`
5. Patch creative to active if needed (current create route pauses it unless status is active; use direct admin workflow extension or SQL for now)

For production, add a real admin dashboard and advertiser authentication before opening campaign creation to public advertisers.

## Existing database
The supplied `schema.sql` is safest for a new database. If you already have the old v1 database, back it up first and migrate columns carefully; do not blindly import over production data.

## SDK integration flow
```js
await GameHubSDK.init({
	gameId: 'my-game',
	apiKey: 'ghpk_...',
	apiBaseUrl: 'https://your-api-domain'
})

GameHubSDK.gameLoadingFinished()
GameHubSDK.gameplayStart()
const result = await GameHubSDK.commercialBreak()
GameHubSDK.gameplayStop()
```
The published SDK source is not part of this backend workspace, so its exact exported lifecycle names and renderer cannot be verified here. The backend contract above is the preserved integration boundary; the SDK must send `X-GameHub-Key` and the documented JSON fields, and must treat `fill:false` as a safe resolved no-fill result.

## Endpoint reference
All admin endpoints require `X-Admin-Key`. SDK endpoints requiring game credentials use `X-GameHub-Key` and an active `gameId`.

- `GET /health` checks database availability.
- `GET /v1/admin/games` lists games.
- `POST /v1/admin/games` creates a game and returns its one-time SDK API key.
- `PATCH /v1/admin/games/:id` activates or disables a game.
- `GET /v1/admin/campaigns` lists campaigns with creative counts.
- `POST /v1/admin/campaigns` creates a validated campaign and creative. `imageUrl` or `html` is required; rewarded campaigns also require `reward` details.
- `PATCH /v1/admin/campaigns/:id` changes campaign status or weight. A campaign must be approved before activation; pausing also pauses its creatives.
- `POST /v1/admin/campaigns/:id/review` approves or rejects a campaign and synchronizes creative approval state.
- `GET /v1/admin/analytics/overview` returns the last 30 days of impressions, clicks, CTR, and SDK events.
- `POST /v1/sdk/ads/next` selects an active, approved ad matching game, type, placement, and schedule. No match returns `{ "ok": true, "fill": false, "reason": "no_fill", "requestId": "...", "ad": null }`.
- `GET /v1/track/:id/impression` records an impression once using the returned tracking URL.
- `GET /v1/track/:id/click` records a click once and redirects to the validated creative URL.
- `GET /v1/track/:id/close` records a close event once using the same tracking token.
- `POST /v1/sdk/rewards/complete` completes a rewarded request with `{ "gameId": "...", "trackingToken": "..." }`; repeated completion is idempotent.
- `POST /v1/sdk/analytics` records a validated SDK event for the authenticated game.

`DirectCampaignProvider` is the active source. It serves approved direct campaigns only; no external ad network is claimed or simulated. A future provider can implement the same `findAd({ gameId, type, placementId })` boundary without changing the SDK route or response.

## Postman smoke flow
1. `GET http://localhost:4000/health`.
2. `POST /v1/admin/games` with `X-Admin-Key` and `{ "id":"my-game", "name":"My Game" }`; save the returned `apiKey`.
3. `POST /v1/admin/campaigns` with `X-Admin-Key`, an approved-compatible creative URL, `type`, and optional `gameId`/`placementId`.
4. `POST /v1/admin/campaigns/:id/review` with `{ "action":"approve" }`.
5. `PATCH /v1/admin/campaigns/:id` with `{ "status":"active" }`.
6. `POST /v1/sdk/ads/next` with `X-GameHub-Key` and `{ "gameId":"my-game", "type":"interstitial", "placementId":"home_banner" }`.
7. Request the returned `impressionUrl`, `clickTrackerUrl`, and optional close URL with the tracking token.
8. For rewarded ads, call `POST /v1/sdk/rewards/complete` with `X-GameHub-Key` and `{ "gameId":"my-game", "trackingToken":"..." }`.
9. Confirm no-fill, invalid credentials, duplicate game, paused campaign, and malformed JSON responses.

No migration is required for the current tracking additions: `served`, `close`, and `reward_completed` use the existing `sdk_event` value with `event_name` and JSON payload fields. The existing schema and data remain compatible.

Malformed JSON and validation failures return `400`, invalid credentials return `401`, missing resources return `404`, duplicate database resources return `409`, and unexpected failures return `500`.
