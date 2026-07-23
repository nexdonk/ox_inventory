-- ─────────────────────────────────────────────────────────────────────
-- NEX ─ ox_inventory custom theme & profile config
--
-- Edit this file to change the look-and-feel of the inventory without
-- touching any of the React/CSS source.  Loaded as a shared_script so
-- both client and server (and the NUI bootstrap) can read it.
-- ─────────────────────────────────────────────────────────────────────
NEX = {}

-- 'discord'  → fetch the player's Discord avatar (requires the player to
--              have linked Discord to their FiveM account).
-- 'steam'    → fetch the player's Steam avatar.
-- 'mugshot'  → in-game pedhead screenshot.  Requires the
--              MugShotBase64 resource: https://github.com/BaziForYou/MugShotBase64
NEX.ProfileType = 'mugshot'

-- false → use the temporary FiveM server-id (1, 2, 3 …) shown next to
--         the avatar.
-- true  → use the framework citizenid (QBCore / Qbox) instead so it
--         stays the same across reconnects.
NEX.UseCitizenId = false

-- true  → secondary inventory (trunk/stash/etc.) keeps its native label.
-- false → render the raw id ("trunk_ABC123") instead.
NEX.UseNativeLabeling = true

-- Glowing trail that follows the cursor while the inventory is open.
-- Leave `color` unset to track PrimaryColor automatically.
NEX.mouseTrailActive = {
    enabled = true,
    -- color = { r = 255, g = 255, b = 255 },
}

-- Global UI scale.  Multiplies the size of EVERYTHING — grids, slots,
-- titles, icons, tooltips — on top of the automatic resolution scaling
-- (the UI is already sized relative to the player's screen height, so
-- this is a taste knob, not a per-resolution fix).
--   1.0  → default size
--   1.1  → 10% bigger, 0.9 → 10% smaller, etc.
-- Clamped to 0.7 – 1.1 in the UI; above ~1.1 the player column (5-row
-- grid + hotbar) stops fitting a 16:9 screen vertically.  No rebuild
-- needed — edit and restart the resource.
NEX.UiScale = 1.0

-- ─────────────────────────────────────────────────────────────────────
-- THEME — black & white
--
-- 99% of customers only need to change PrimaryColor.  The button
-- gradient, button-text contrast, glow shadow, money colours, and mouse
-- trail are all derived from it automatically and clamped to a UI-safe
-- range so dark/light picks still read against the dark inventory.
--
-- The optional overrides below are for power users who want to deviate
-- from the auto-derived palette.  Delete or comment them out to fall
-- back to the derived defaults — every accent below is tuned to keep
-- the monochrome look cohesive (white -> grays, no hue).
-- ─────────────────────────────────────────────────────────────────────
NEX.ThemeSettings = {
    PrimaryColor = '#FFFFFF',

    buttonGradients = {
        gradient = 'linear-gradient(135deg, #FFFFFF 0%, #4B4B4B 100%)',
        shadow   = 'rgba(255, 255, 255, 0.40)',
        text     = '#0B0B12',
    },

    money = {
        money      = '#FFFFFF', -- cash  (white)
        blackMoney = '#9CA3AF', -- bank  (mid gray)
    },

    -- ─────────────────────────────────────────────────────────────────
    -- PER-COMPONENT ICON COLOURS
    --
    -- All icon hues track PrimaryColor by default. Uncomment any entry
    -- below to override that single component with its own hex value;
    -- everything else stays in sync with the theme. Mix and match
    -- freely — there's no requirement to fill the whole palette.
    --
    -- For B&W we use a small grayscale ladder so categories still read
    -- distinctly without introducing any hue.
    -- ─────────────────────────────────────────────────────────────────
    icons = {
        -- Section header icons by category. Keys must match the right /
        -- left inventory's `type` (e.g. shop, crafting, stash, trunk,
        -- glovebox, container, drop, newdrop, player, inspect) plus the
        -- two literals "inventory" and "hotbar" used by the player side.
        sectionHeaders = {
            inventory = '#FFFFFF', -- pure white
            hotbar    = '#F3F4F6', -- off white
            shop      = '#E5E7EB', -- light gray
            crafting  = '#D1D5DB', -- silver
            stash     = '#F3F4F6', -- off white
            trunk     = '#D1D5DB', -- silver
            glovebox  = '#E5E7EB', -- light gray
            container = '#9CA3AF', -- mid gray
            drop      = '#9CA3AF', -- mid gray
            newdrop   = '#D1D5DB', -- silver
            player    = '#FFFFFF', -- pure white
            inspect   = '#6B7280', -- dim gray
        },

        -- Filter chip icons in the player-side action row.
        filters = {
            clothing = '#E5E7EB', -- light gray
            all      = '#FFFFFF', -- pure white
            food     = '#D1D5DB', -- silver
            heal     = '#F3F4F6', -- off white
            weapon   = '#9CA3AF', -- mid gray
        },

        -- Shopping cart title icon accent.
        cart = '#FFFFFF',
    },
}
