-- ─────────────────────────────────────────────────────────────────────
-- ox_inventory ─ custom client extensions
-- Clothing toggle + ped preview (pause-menu pipeline, slot 1 = centre,
-- transparent HUD background)
-- ─────────────────────────────────────────────────────────────────────

-- ────────────── CLOTHING TOGGLE ──────────────
-- Every toggleable ped component + prop. Component 0 (Face) is excluded
-- because removing the face is impossible / breaks rendering.
local clothingState = {}
local CLOTHING_COMPONENTS = {
    mask       = 1,  -- Mask
    hair       = 2,  -- Hair (toggling makes you bald)
    gloves     = 3,  -- Torso / arms (gloves on most peds)
    pants      = 4,  -- Lower body
    bag        = 5,  -- Bag / Parachute
    shoes      = 6,  -- Shoes
    accessory  = 7,  -- Necklace / Tie / Accessory
    undershirt = 8,  -- Undershirt
    vest       = 9,  -- Body Armor / Vest
    decals     = 10, -- Decals (logos, etc.)
    shirt      = 11, -- Tops / Jacket
}
local CLOTHING_PROPS = {
    hat      = 0, -- Hat / Helmet
    glasses  = 1, -- Glasses
    earring  = 2, -- Ear accessory
    watch    = 6, -- Watch
    bracelet = 7, -- Bracelet
}
local SYNONYMS = { backpack = 'bag' }

-- ────────────── PED PREVIEW ──────────────
local PlayerPedPreview
local previewActive = false

-- Override IsPauseMenuActive so ox_inventory doesn't auto-close when we
-- activate the frontend pipeline.
local _origIsPauseMenuActive = IsPauseMenuActive
IsPauseMenuActive = function()
    if previewActive then return false end
    return _origIsPauseMenuActive()
end

local function startPedPreview()
    if previewActive then return end
    local playerPed = PlayerPedId()
    if not DoesEntityExist(playerPed) then return end
    if IsPedInAnyVehicle(playerPed, false) then return end
    if IsEntityDead(playerPed) then return end

    -- Mark active BEFORE touching frontend so the override is in effect immediately
    previewActive = true

    local heading = GetEntityHeading(playerPed)

    SetScriptGfxAlign(67, 67)
    SetFrontendActive(true)
    ActivateFrontendMenu(`FE_MENU_VERSION_EMPTY`, true, -1)

    -- Make the pause-menu background fully transparent (HUD colour 117)
    ReplaceHudColourWithRgba(117, 0, 0, 0, 0)

    Wait(100)
    N_0x98215325a695e78a(false) -- hide the "PAUSED" overlay

    PlayerPedPreview = ClonePed(playerPed, heading, true, false)

    local x, y, z = table.unpack(GetEntityCoords(PlayerPedPreview))
    SetEntityCoords(PlayerPedPreview, x, y, z - 100.0)
    FreezeEntityPosition(PlayerPedPreview, true)
    SetEntityVisible(PlayerPedPreview, false, false)
    NetworkSetEntityInvisibleToNetwork(PlayerPedPreview, false)

    Wait(200)

    -- Clear whatever the player was doing so the clone stands neutrally
    ClearPedTasksImmediately(PlayerPedPreview)
    SetPedAsNoLongerNeeded(PlayerPedPreview)

    -- 0 = left, 1 = centre, 2 = right
    GivePedToPauseMenu(PlayerPedPreview, 1)
    SetPauseMenuPedLighting(true)
    -- true = allow ambient idle/breathing animations (looks alive).
    -- false = freeze the ped completely (which reads as "asleep").
    SetPauseMenuPedSleepState(true)

    -- Restore NUI focus so the inventory keeps cursor input
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(false)
end

local function stopPedPreview()
    if not previewActive then return end

    ClearPedInPauseMenu()
    SetFrontendActive(false)
    N_0x98215325a695e78a(true)

    if PlayerPedPreview and DoesEntityExist(PlayerPedPreview) then
        DeleteEntity(PlayerPedPreview)
    end
    PlayerPedPreview = nil

    previewActive = false
end

RegisterNUICallback('togglePedPreview', function(data, cb)
    if data and data.enable then
        startPedPreview()
    else
        stopPedPreview()
    end
    cb('ok')
end)

-- ────────────── CLOTHING NUI CALLBACK ──────────────
local function applyToBoth(fn)
    fn(PlayerPedId())
    if PlayerPedPreview and DoesEntityExist(PlayerPedPreview) then fn(PlayerPedPreview) end
end

local function toggleComponent(componentId)
    local ped = PlayerPedId()
    local key = ('comp_%d'):format(componentId)
    local current = GetPedDrawableVariation(ped, componentId)
    local d, t, p

    if clothingState[key] then
        local saved = clothingState[key]
        d, t, p = saved.drawable, saved.texture, saved.palette
        clothingState[key] = nil
    else
        clothingState[key] = {
            drawable = current,
            texture = GetPedTextureVariation(ped, componentId),
            palette = GetPedPaletteVariation(ped, componentId),
        }
        d, t, p = 0, 0, 2
    end

    applyToBoth(function(target)
        SetPedComponentVariation(target, componentId, d, t, p)
    end)
end

local function toggleProp(propId)
    local ped = PlayerPedId()
    local key = ('prop_%d'):format(propId)
    local current = GetPedPropIndex(ped, propId)

    if clothingState[key] then
        local saved = clothingState[key]
        applyToBoth(function(target)
            SetPedPropIndex(target, propId, saved.drawable, saved.texture, true)
        end)
        clothingState[key] = nil
    elseif current ~= -1 then
        clothingState[key] = {
            drawable = current,
            texture = GetPedPropTextureIndex(ped, propId),
        }
        applyToBoth(function(target) ClearPedProp(target, propId) end)
    end
end

local function resetAllClothing()
    for key, saved in pairs(clothingState) do
        local kind, idStr = key:match('^(%w+)_(%d+)$')
        local id = tonumber(idStr)
        if kind == 'comp' and id then
            applyToBoth(function(target)
                SetPedComponentVariation(target, id, saved.drawable, saved.texture, saved.palette)
            end)
        elseif kind == 'prop' and id then
            applyToBoth(function(target)
                SetPedPropIndex(target, id, saved.drawable, saved.texture, true)
            end)
        end
    end
    clothingState = {}
end

-- Returns a map of action-name → boolean: true if the corresponding button
-- should appear (i.e. the player either has the item, or removed it via the
-- menu so it can be toggled back on). Reset is true if anything's removed.
local function buildAvailability()
    local ped = PlayerPedId()
    local result = {}
    for action, id in pairs(CLOTHING_COMPONENTS) do
        local hasIt = GetPedDrawableVariation(ped, id) > 0
        local removed = clothingState[('comp_%d'):format(id)] ~= nil
        result[action] = hasIt or removed
    end
    for action, id in pairs(CLOTHING_PROPS) do
        local hasIt = GetPedPropIndex(ped, id) ~= -1
        local removed = clothingState[('prop_%d'):format(id)] ~= nil
        result[action] = hasIt or removed
    end
    -- backpack is a synonym for bag
    result.backpack = result.bag
    -- reset only useful when something has been removed
    result.reset = next(clothingState) ~= nil
    -- Active state for visual feedback (true = currently removed/toggled off)
    local active = {}
    for action, id in pairs(CLOTHING_COMPONENTS) do
        active[action] = clothingState[('comp_%d'):format(id)] ~= nil
    end
    for action, id in pairs(CLOTHING_PROPS) do
        active[action] = clothingState[('prop_%d'):format(id)] ~= nil
    end
    active.backpack = active.bag
    return result, active
end

RegisterNUICallback('getClothingState', function(_, cb)
    local available, active = buildAvailability()
    cb({ available = available, active = active })
end)

RegisterNUICallback('toggleClothing', function(data, cb)
    local action = data and data.action
    if not action then return cb({ available = {}, active = {} }) end
    action = SYNONYMS[action] or action

    if action == 'reset' then
        resetAllClothing()
    elseif CLOTHING_COMPONENTS[action] then
        toggleComponent(CLOTHING_COMPONENTS[action])
    elseif CLOTHING_PROPS[action] then
        toggleProp(CLOTHING_PROPS[action])
    end

    local available, active = buildAvailability()
    cb({ available = available, active = active })
end)

-- ────────────── FAILSAFES ──────────────
RegisterNetEvent('ox_inventory:closeInventory', function()
    stopPedPreview()
end)

AddEventHandler('onResourceStop', function(name)
    if name == GetCurrentResourceName() then
        stopPedPreview()
        IsPauseMenuActive = _origIsPauseMenuActive
    end
end)
