-- ─────────────────────────────────────────────────────────────────────
-- NEX ─ SERVER-ONLY config (Discord bot credentials)
--
-- ⚠ THIS FILE IS LOADED ONLY ON THE SERVER.
--   It is NEVER shared with the client or the NUI.  Safe to put a real
--   bot token here.  Verify by grepping fxmanifest.lua — this file is
--   ONLY listed under server_scripts, never client_scripts or
--   shared_scripts.
--
-- 1. Create a Discord application at:
--      https://discord.com/developers/applications
-- 2. Add a bot, copy the bot token.
-- 3. Invite the bot to your guild with the SERVER MEMBERS INTENT
--    enabled (Bot tab → Privileged Gateway Intents → SERVER MEMBERS).
-- 4. Paste the values below and restart ox_inventory.
-- ─────────────────────────────────────────────────────────────────────
NEXServer = NEXServer or {}

NEXServer.Discord = {
    -- Required.  The bot token from Bot tab → Reset Token.
    BotToken = '',

    -- Optional.  Useful only as a label in logs / diagnostics.
    ApplicationId = '',

    -- Optional.  If set, NEX will fetch the player's GUILD nickname &
    -- per-guild avatar (so server-specific avatars / nicknames show up
    -- in the inventory).  Leave empty to use the player's global
    -- Discord username & avatar instead.
    GuildId = '',

    -- Cache TTL in seconds.  Avatars are cached per-player to avoid
    -- hammering the Discord API.  Default: 10 minutes.
    CacheSeconds = 600,
}
