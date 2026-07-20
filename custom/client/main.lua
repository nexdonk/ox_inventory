-- ─────────────────────────────────────────────────────────────────────
-- NEX ─ client runtime
--
-- Pushes the NEX config (theme, profile, mouse-trail flags) to the NUI
-- whenever it asks for it on mount.  The NUI converts ThemeSettings
-- into CSS custom-properties on :root, so colour changes don't need a
-- rebuild — just edit custom/NEX.lua and restart the resource.
-- ─────────────────────────────────────────────────────────────────────

-- Fallback avatar (only used when the server didn't resolve one — e.g.
-- ProfileType is discord but no bot token is set).  Returns the generic
-- Discord placeholder so we always have *something* to show.
local function fallbackAvatarUrl(profile)
    if not profile or not profile.discordId then return nil end
    local n = (tonumber(profile.discordId) or 0) % 5
    return ('https://cdn.discordapp.com/embed/avatars/%d.png'):format(n)
end

local function tryGetMugshot()
    if GetResourceState('MugShotBase64') ~= 'started' then return nil end
    local ped = PlayerPedId()
    local ok, b64 = pcall(function()
        return exports['MugShotBase64']:GetMugShotBase64(ped, true)
    end)
    if ok and b64 and b64 ~= '' then
        -- MugShotBase64 already returns a full "data:image/png;base64,..." URL,
        -- so only add the prefix for older builds that hand back raw base64.
        if b64:sub(1, 5) == 'data:' then return b64 end
        return ('data:image/png;base64,%s'):format(b64)
    end
    return nil
end

RegisterNUICallback('getNexConfig', function(_, cb)
    local cfg = NEX or {}

    if not NEX then
        print('^1[NEX]^7 NEX global is nil — custom/NEX.lua failed to load')
    end

    -- Server-side identifier resolution (citizenid / discord / steam).
    -- 2-second timeout so the NUI never hangs waiting for theme data.
    local profile = nil
    local ok, srv = pcall(function()
        return lib.callback.await('nex:getProfile', 2000)
    end)
    if ok and srv then profile = srv end

    -- Server already built the real Discord avatar URL when a bot token
    -- is configured.  If it didn't (no token, lookup failed, etc.), fall
    -- back to the generic placeholder so the slot doesn't sit empty.
    local avatarUrl = nil
    if cfg.ProfileType == 'mugshot' then
        avatarUrl = tryGetMugshot()
    elseif profile then
        avatarUrl = profile.avatarUrl or fallbackAvatarUrl(profile)
    end

    local payload = {
        profileType        = cfg.ProfileType or 'discord',
        useCitizenId       = cfg.UseCitizenId == true,
        useNativeLabeling  = cfg.UseNativeLabeling ~= false,
        mouseTrail         = cfg.mouseTrailActive or { enabled = false },
        theme              = cfg.ThemeSettings or {},
        profile = {
            name       = profile and profile.name or nil,
            identifier = profile and profile.identifier or nil,
            avatarUrl  = avatarUrl,
        },
    }

    print(('^5[NEX]^7 → NUI: PrimaryColor=%s  cash=%s  bank=%s  trail=%s')
        :format(
            payload.theme.PrimaryColor or '<nil>',
            payload.theme.money and payload.theme.money.money or '<nil>',
            payload.theme.money and payload.theme.money.blackMoney or '<nil>',
            payload.mouseTrail.enabled and 'on' or 'off'
        ))

    cb(payload)
end)
