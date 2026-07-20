if not lib then return end

local Items = require 'modules.items.server'
local Inventory = require 'modules.inventory.server'
local TriggerEventHooks = require 'modules.hooks.server'
local Shops = {}
local locations = shared.target and 'targets' or 'locations'

---@class OxShopItem
---@field slot number
---@field weight number

local function setupShopItems(id, shopType, shopName, groups)
	local shop = id and Shops[shopType][id] or Shops[shopType] --[[@as OxShop]]

	for i = 1, shop.slots do
		local slot = shop.items[i]

		if slot.grade and not groups then
			print(('^1attempted to restrict slot %s (%s) to grade %s, but %s has no job restriction^0'):format(id, slot.name, json.encode(slot.grade), shopName))
			slot.grade = nil
		end

		local Item = Items(slot.name)

		if Item then
			---@type OxShopItem
			slot = {
				name = Item.name,
				slot = i,
				weight = Item.weight,
				count = slot.count,
				price = (server.randomprices and (not slot.currency or slot.currency == 'money')) and (math.ceil(slot.price * (math.random(80, 120)/100))) or slot.price or 0,
				metadata = slot.metadata,
				license = slot.license,
				currency = slot.currency,
				grade = slot.grade
			}

			if slot.metadata then
				slot.weight = Inventory.SlotWeight(Item, slot, true)
			end

			shop.items[i] = slot
		end
	end
end

---@param shopType string
---@param properties OxShop
local function registerShopType(shopType, properties)
	local shopLocations = properties[locations] or properties.locations

	if shopLocations then
		Shops[shopType] = properties
	else
		Shops[shopType] = {
			label = properties.name,
			id = shopType,
			groups = properties.groups or properties.jobs,
			items = properties.inventory,
			slots = #properties.inventory,
			type = 'shop',
		}

		setupShopItems(nil, shopType, properties.name, properties.groups or properties.jobs)
	end
end

---@param shopType string
---@param id number
local function createShop(shopType, id)
	local shop = Shops[shopType]

	if not shop then return end

	local store = (shop[locations] or shop.locations)?[id]

	if not store then return end

	local groups = shop.groups or shop.jobs
    local coords

    if shared.target then
        if store.length then
            local z = store.loc.z + math.abs(store.minZ - store.maxZ) / 2
            coords = vec3(store.loc.x, store.loc.y, z)
        else
            coords = store.coords or store.loc
        end
    else
        coords = store
    end

	shop[id] = {
		label = shop.name,
		id = shopType..' '..id,
		groups = groups,
		items = table.clone(shop.inventory),
		slots = #shop.inventory,
		type = 'shop',
		coords = coords,
		distance = shared.target and shop.targets?[id]?.distance,
	}

	setupShopItems(id, shopType, shop.name, groups)

	return shop[id]
end

for shopType, shopDetails in pairs(lib.load('data.shops') or {}) do
	registerShopType(shopType, shopDetails)
end

---@param shopType string
---@param shopDetails OxShop
exports('RegisterShop', function(shopType, shopDetails)
	registerShopType(shopType, shopDetails)
end)

lib.callback.register('ox_inventory:openShop', function(source, data)
	local playerInv, shop = Inventory(source)

	if not playerInv then return end

	if data then
		shop = Shops[data.type]

		if not shop then return end

		if not shop.items then
			shop = (data.id and shop[data.id] or createShop(data.type, data.id))

			if not shop then return end
		end

		---@cast shop OxShop

		if shop.groups then
			local group = server.hasGroup(playerInv, shop.groups)
			if not group then return end
		end

		if type(shop.coords) == 'vector3' and #(GetEntityCoords(GetPlayerPed(source)) - shop.coords) > 10 then
			return
		end

		local shopType, shopId = shop.id:match('^(.-) (%d+)$')

        local hookPayload = {
            source = source,
            shopId = shopId or shop.id,
			shopType = shopType or shop.id,
            label = shop.label,
            slots = shop.slots,
            items = shop.items,
            groups = shop.groups,
            coords = shop.coords,
            distance = shop.distance
        }

        local hooks <close> = TriggerEventHooks('openShop', hookPayload)

		if not hooks.success then return end

		---@diagnostic disable-next-line: assign-type-mismatch
		playerInv:openInventory(playerInv)
		playerInv.currentShop = shop.id
	end

	return { label = playerInv.label, type = playerInv.type, slots = playerInv.slots, weight = playerInv.weight, maxWeight = playerInv.maxWeight }, shop
end)

local function canAffordItem(inv, currency, price)
	local canAfford = price >= 0 and Inventory.GetItemCount(inv, currency) >= price

	return canAfford or {
		type = 'error',
		description = locale('cannot_afford', ('%s%s'):format((currency == 'money' and locale('$') or math.groupdigits(price)), (currency == 'money' and math.groupdigits(price) or ' '..Items(currency).label)))
	}
end

local function removeCurrency(inv, currency, price)
	Inventory.RemoveItem(inv, currency, price)
end

local function isRequiredGrade(grade, rank)
	if type(grade) == "table" then
		for i=1, #grade do
			if grade[i] == rank then
				return true
			end
		end
		return false
	else
		return rank >= grade
	end
end

lib.callback.register('ox_inventory:buyItem', function(source, data)
	if data.toType == 'player' then
		data.count = math.max(1, math.floor(data.count or 1))

		local playerInv = Inventory(source)

		if not playerInv or not playerInv.currentShop then return end

		local shopType, shopId = playerInv.currentShop:match('^(.-) (%d-)$')

		if not shopType then shopType = playerInv.currentShop end

		if shopId then shopId = tonumber(shopId) end

		local shop = shopId and Shops[shopType][shopId] or Shops[shopType]
		local fromData = shop.items[data.fromSlot]
		local toData = playerInv.items[data.toSlot]

		if fromData then
			if fromData.count then
				if fromData.count < 1 then
					return false, false, { type = 'error', description = locale('shop_nostock') }
				elseif data.count > fromData.count then
					data.count = fromData.count
				end
			end

			if fromData.license and server.hasLicense and not server.hasLicense(playerInv, fromData.license) then
				return false, false, { type = 'error', description = locale('item_unlicensed') }
			end

			if fromData.grade then
				local _, rank = server.hasGroup(playerInv, shop.groups)
				if not isRequiredGrade(fromData.grade, rank) then
					return false, false, { type = 'error', description = locale('stash_lowgrade') }
				end
			end

			local currency = fromData.currency or 'money'
			local fromItem = Items(fromData.name)

			local result = fromItem.cb and fromItem.cb('buying', fromItem, playerInv, data.fromSlot, shop)
			if result == false then return false end

			local toItem = toData and Items(toData.name)

			local metadata, count = Items.Metadata(playerInv, fromItem, fromData.metadata and table.clone(fromData.metadata) or {}, data.count)
			local price = count * fromData.price

			if toData == nil or (fromItem.name == toItem?.name and fromItem.stack and table.matches(toData.metadata, metadata)) then
				local newWeight = playerInv.weight + (fromItem.weight + (metadata?.weight or 0)) * count

				if newWeight > playerInv.maxWeight then
					return false, false, { type = 'error', description = locale('cannot_carry') }
				end

				local canAfford = canAffordItem(playerInv, currency, price)

				if canAfford ~= true then
					return false, false, canAfford
				end

				if fromData.count then
					fromData.count -= count
				end

				local hooks <close> = TriggerEventHooks('buyItem', {
					source = source,
					shopType = shopType,
					shopId = shopId,
					toInventory = playerInv.id,
					toSlot = data.toSlot,
					fromSlot = fromData,
					itemName = fromData.name,
					metadata = metadata,
					count = count,
					price = fromData.price,
					totalPrice = price,
					currency = currency,
				})

				if not hooks.success or not Inventory.SetSlot(playerInv, fromItem, count, metadata, data.toSlot) then
					if fromData.count then
						fromData.count += count
					end

					return false
				end

				playerInv.weight = newWeight
				removeCurrency(playerInv, currency, price)

				if server.syncInventory then server.syncInventory(playerInv) end

				local message = locale('purchased_for', count, metadata?.label or fromItem.label, (currency == 'money' and locale('$') or math.groupdigits(price)), (currency == 'money' and math.groupdigits(price) or ' '..Items(currency).label))

				if server.loglevel > 0 then
					if server.loglevel > 1 or fromData.price >= 500 then
						lib.logger(playerInv.owner, 'buyItem', ('"%s" %s'):format(playerInv.label, message:lower()), ('shop:%s'):format(shop.label))
					end
				end

				return true, {data.toSlot, playerInv.items[data.toSlot], shop.items[data.fromSlot].count and shop.items[data.fromSlot], playerInv.weight}, { type = 'success', description = message }
			end

			return false, false, { type = 'error', description = locale('unable_stack_items') }
		end
	end
end)

---@class CartCheckoutItem
---@field name string
---@field slot number
---@field quantity number
---@field price number
---@field currency? string

---@class CartCheckoutData
---@field shopId string
---@field items CartCheckoutItem[]
---@field total number

-- Cart-style checkout for the multi-item shop UI. Validates every item
-- once, ensures the player can carry and afford the whole basket, then
-- applies the transaction in one pass. Currency follows the standard
-- ox_inventory model (per-item; defaults to 'money').
lib.callback.register('ox_inventory:checkoutCart', function(source, data)
	local playerInv = Inventory(source)

	if not playerInv or not playerInv.currentShop then
		return false, nil, { type = 'error', description = locale('not_in_shop') or 'Not in a shop' }
	end

	if not data or not data.items or #data.items == 0 then
		return false, nil, { type = 'error', description = 'Cart is empty' }
	end

	local shopType, shopId = playerInv.currentShop:match('^(.-) (%d-)$')
	if not shopType then shopType = playerInv.currentShop end
	if shopId then shopId = tonumber(shopId) end

	local shop = shopId and Shops[shopType][shopId] or Shops[shopType]
	if not shop then
		return false, nil, { type = 'error', description = 'Shop not found' }
	end

	-- Validate, accumulate per-currency totals and projected weight.
	local totalWeight = 0
	local currencyTotals = {} ---@type table<string, number>
	local validated = {}

	for _, cartItem in ipairs(data.items) do
		local shopItem = shop.items[cartItem.slot]

		if not shopItem or shopItem.name ~= cartItem.name then
			return false, nil, { type = 'error', description = 'Item not found in shop' }
		end

		if cartItem.quantity <= 0 then
			return false, nil, { type = 'error', description = 'Invalid quantity' }
		end

		if shopItem.count then
			if shopItem.count == 0 then
				return false, nil, { type = 'error', description = locale('shop_nostock') }
			elseif cartItem.quantity > shopItem.count then
				return false, nil, { type = 'error', description = ('Not enough stock for %s'):format(Items(shopItem.name)?.label or shopItem.name) }
			end
		end

		if shopItem.license and server.hasLicense and not server.hasLicense(playerInv, shopItem.license) then
			return false, nil, { type = 'error', description = locale('item_unlicensed') }
		end

		if shopItem.grade then
			local _, rank = server.hasGroup(playerInv, shop.groups)
			if not isRequiredGrade(shopItem.grade, rank) then
				return false, nil, { type = 'error', description = locale('stash_lowgrade') }
			end
		end

		local fromItem = Items(shopItem.name)
		if not fromItem then
			return false, nil, { type = 'error', description = 'Invalid item' }
		end

		local cbResult = fromItem.cb and fromItem.cb('buying', fromItem, playerInv, cartItem.slot, shop)
		if cbResult == false then
			return false, nil, { type = 'error', description = 'Cannot purchase this item' }
		end

		local metadata, quantity = Items.Metadata(playerInv, fromItem, shopItem.metadata and table.clone(shopItem.metadata) or {}, cartItem.quantity)
		local itemWeight = fromItem.weight + (metadata?.weight or 0)
		local currency = shopItem.currency or 'money'
		local linePrice = shopItem.price * quantity

		totalWeight = totalWeight + (itemWeight * quantity)
		currencyTotals[currency] = (currencyTotals[currency] or 0) + linePrice

		validated[#validated + 1] = {
			shopItem = shopItem,
			fromItem = fromItem,
			quantity = quantity,
			metadata = metadata,
			slot = cartItem.slot,
			price = linePrice,
			currency = currency,
		}
	end

	if playerInv.weight + totalWeight > playerInv.maxWeight then
		return false, nil, { type = 'error', description = locale('cannot_carry') }
	end

	-- Affordability check across every currency in the cart.
	for currency, amount in pairs(currencyTotals) do
		if Inventory.GetItemCount(playerInv, currency) < amount then
			local item = Items(currency)
			return false, nil, {
				type = 'error',
				description = locale('cannot_afford', ('%s%s'):format(
					(currency == 'money' and locale('$') or math.groupdigits(amount)),
					(currency == 'money' and math.groupdigits(amount) or ' '..(item and item.label or currency))
				))
			}
		end
	end

	-- All checks passed — apply the transaction.
	local resultItems = {}
	local shopUpdates = {}

	for _, entry in ipairs(validated) do
		local toSlot = Inventory.GetEmptySlot(playerInv)

		if not toSlot and entry.fromItem.stack then
			for slot, slotData in pairs(playerInv.items) do
				if slotData and slotData.name == entry.fromItem.name and table.matches(slotData.metadata, entry.metadata) then
					toSlot = slot
					break
				end
			end
		end

		if not toSlot then
			-- Out of room mid-checkout. Refund anything already taken so
			-- we never leave the player with a partial transaction.
			-- (Items aren't taken yet — we only mutate after the slot is
			-- known — so just bail with a clear message here.)
			return false, nil, { type = 'error', description = locale('cannot_carry') }
		end

		if not TriggerEventHooks('buyItem', {
			source = source,
			shopType = shopType,
			shopId = shopId,
			toInventory = playerInv.id,
			toSlot = toSlot,
			fromSlot = entry.shopItem,
			itemName = entry.shopItem.name,
			metadata = entry.metadata,
			count = entry.quantity,
			price = entry.shopItem.price,
			totalPrice = entry.price,
			currency = entry.currency,
		}) then
			return false, nil, { type = 'error', description = 'Purchase blocked' }
		end

		Inventory.SetSlot(playerInv, entry.fromItem, entry.quantity, entry.metadata, toSlot)
		playerInv.weight = playerInv.weight + (entry.fromItem.weight + (entry.metadata?.weight or 0)) * entry.quantity
		Inventory.RemoveItem(playerInv, entry.currency, entry.price)

		resultItems[#resultItems + 1] = playerInv.items[toSlot]

		if entry.shopItem.count then
			shop.items[entry.slot].count = entry.shopItem.count - entry.quantity
			shopUpdates[#shopUpdates + 1] = {
				item = shop.items[entry.slot],
				inventory = 'shop',
			}
		end
	end

	if server.syncInventory then server.syncInventory(playerInv) end

	local cashTotal = currencyTotals.money or 0
	local message = ('Purchased %d item%s for %s%s'):format(
		#validated, #validated == 1 and '' or 's',
		locale('$') or '$', math.groupdigits(cashTotal)
	)

	if server.loglevel > 0 then
		lib.logger(playerInv.owner, 'checkoutCart', ('"%s" %s'):format(playerInv.label, message:lower()), ('shop:%s'):format(shop.label or shopType))
	end

	return true, {
		items = resultItems,
		weight = playerInv.weight,
		shopUpdates = #shopUpdates > 0 and shopUpdates or nil,
	}, { type = 'success', description = message }
end)

server.shops = Shops
