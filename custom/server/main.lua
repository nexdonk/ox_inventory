-- ─────────────────────────────────────────────────────────────────────
-- NEX ─ server-side identifier resolver + Discord API integration
--
-- Resolves the player's identifier (server-id / citizenid) and, if a
-- bot token is set in custom/server_nex_config.lua, fetches their
-- Discord username + avatar URL via the official Discord API.
--
-- Bot token NEVER leaves this server file.  Only the resolved string
-- values (username, avatar URL) are returned to the client.
-- ─────────────────────────────────────────────────────────────────────

-- ────────── Identifier helpers ──────────
local function getIdentifierByPrefix(src, prefix)
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if id:sub(1, #prefix) == prefix then
            return id:sub(#prefix + 1)
        end
    end
    return nil
end

local function getCitizenId(src)
    local QBX = exports.qbx_core
    if QBX and QBX.GetPlayer then
        local ok, player = pcall(function() return QBX:GetPlayer(src) end)
        if ok and player then
            return player.PlayerData and player.PlayerData.citizenid or nil
        end
    end
    if GetResourceState('qb-core') == 'started' then
        local ok, QBCore = pcall(function()
            return exports['qb-core']:GetCoreObject()
        end)
        if ok and QBCore then
            local player = QBCore.Functions.GetPlayer(src)
            if player then return player.PlayerData.citizenid end
        end
    end
    return nil
end

-- ────────── Discord API ──────────
local discordCache = {}     -- [discordId] = { data, expires }

local function discordApiGet(path)
    local cfg = (NEXServer and NEXServer.Discord) or {}
    local token = cfg.BotToken
    if not token or token == '' then return nil, 'no token' end

    local p = promise.new()
    PerformHttpRequest(
        ('https://discord.com/api/v10%s'):format(path),
        function(status, body)
            p:resolve({ status = status, body = body })
        end,
        'GET',
        '',
        {
            ['Authorization']  = ('Bot %s'):format(token),
            ['Content-Type']   = 'application/json',
            ['User-Agent']     = 'NEX-Inventory (FiveM, 1.0)',
        }
    )
    local res = Citizen.Await(p)
    if not res or res.status ~= 200 then
        return nil, ('http %s: %s'):format(res and res.status or '?', res and res.body or '')
    end

    local ok, decoded = pcall(json.decode, res.body)
    if not ok or not decoded then return nil, 'json decode failed' end
    return decoded
end

-- Build the CDN URL for a user's avatar hash.  Returns the default
-- placeholder URL when no custom avatar is set.
local function buildAvatarUrl(userId, avatarHash, guildId)
    if not avatarHash or avatarHash == '' then
        local n = (tonumber(userId) or 0) % 5
        return ('https://cdn.discordapp.com/embed/avatars/%d.png'):format(n)
    end
    local ext = avatarHash:sub(1, 2) == 'a_' and 'gif' or 'png'
    if guildId and guildId ~= '' then
        return ('https://cdn.discordapp.com/guilds/%s/users/%s/avatars/%s.%s?size=128')
            :format(guildId, userId, avatarHash, ext)
    end
    return ('https://cdn.discordapp.com/avatars/%s/%s.%s?size=128')
        :format(userId, avatarHash, ext)
end

-- Resolve a player's discord profile (cached).  Returns nil on any
-- failure so the NUI falls back to a generic avatar gracefully.
local function resolveDiscord(discordId)
    if not discordId or discordId == '' then return nil end

    local cfg = (NEXServer and NEXServer.Discord) or {}
    local ttl = (cfg.CacheSeconds or 600) * 1000
    local now = GetGameTimer()

    local cached = discordCache[discordId]
    if cached and cached.expires > now then return cached.data end

    -- Prefer guild profile if a GuildId is configured (gets the player's
    -- server-specific nickname + per-guild avatar when set).
    local guildId = cfg.GuildId
    local member, memberErr
    if guildId and guildId ~= '' then
        member, memberErr = discordApiGet(('/guilds/%s/members/%s'):format(guildId, discordId))
        if not member then
            print(('^3[NEX]^7 guild lookup failed for %s: %s'):format(discordId, memberErr))
        end
    end

    -- Fall back to the global user object (always works for anyone the
    -- bot can see, no guild membership required).
    local user
    if member and member.user then
        user = member.user
    else
        local err
        user, err = discordApiGet(('/users/%s'):format(discordId))
        if not user then
            print(('^1[NEX]^7 user lookup failed for %s: %s'):format(discordId, err))
            return nil
        end
    end

    -- Pick the right avatar hash: guild-specific first, then global.
    local avatarHash, avatarGuildId
    if member and member.avatar then
        avatarHash    = member.avatar
        avatarGuildId = guildId
    else
        avatarHash = user.avatar
    end

    local profile = {
        username    = user.global_name or user.username,
        guildName   = member and member.nick or nil,
        avatarUrl   = buildAvatarUrl(discordId, avatarHash, avatarGuildId),
        discordTag  = user.username and user.discriminator and user.discriminator ~= '0'
                          and ('%s#%s'):format(user.username, user.discriminator)
                          or user.username,
    }

    discordCache[discordId] = { data = profile, expires = now + ttl }
    return profile
end

-- ────────── NUI-bound callback ──────────
lib.callback.register('nex:getProfile', function(src)
    local cfg = NEX or {}
    local profileType = cfg.ProfileType or 'discord'

    local discordId = getIdentifierByPrefix(src, 'discord:')
    local steamId   = getIdentifierByPrefix(src, 'steam:')

    local identifier
    if cfg.UseCitizenId then
        identifier = getCitizenId(src) or tostring(src)
    else
        identifier = tostring(src)
    end

    -- Default name = the FiveM player name (visible in serverinfo).
    -- Discord lookup overrides it if we get a real username back.
    local displayName = GetPlayerName(src)
    local avatarUrl   = nil

    if profileType == 'discord' then
        local d = resolveDiscord(discordId)
        if d then
            displayName = d.guildName or d.username or displayName
            avatarUrl   = d.avatarUrl
        end
    end

    return {
        identifier = identifier,
        discordId  = discordId,
        steamId    = steamId,
        name       = displayName,
        avatarUrl  = avatarUrl, -- only set when bot lookup succeeded
        type       = profileType,
    }
end)

-- ────────── Health-check on startup ──────────
AddEventHandler('onResourceStart', function(name)
    if name ~= GetCurrentResourceName() then return end

    local cfg = (NEXServer and NEXServer.Discord) or {}
    if not cfg.BotToken or cfg.BotToken == '' then
        print('^3[NEX]^7 No Discord bot token configured (custom/server_nex_config.lua) — falling back to default avatars.')
        return
    end

    Citizen.CreateThread(function()
        local me, err = discordApiGet('/users/@me')
        if me then
            print(('^2[NEX]^7 Discord bot connected: %s%s'):format(
                me.username or '?',
                me.discriminator and me.discriminator ~= '0' and ('#' .. me.discriminator) or ''
            ))
        else
            print(('^1[NEX]^7 Discord bot auth failed: %s — check token in custom/server_nex_config.lua'):format(err or '?'))
        end
    end)
end)
