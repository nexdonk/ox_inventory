import { Slot, SlotWithItem } from '../typings';
import { Items } from '../store/items';
import { isSlotWithItem } from '../helpers';

export type ItemFilter = 'all' | 'food' | 'heal' | 'weapon';

const FOOD_KEYWORDS = [
  'burger', 'sandwich', 'water', 'coffee', 'beer', 'cola', 'bread',
  'apple', 'banana', 'pizza', 'taco', 'bagel', 'cheese', 'donut',
  'fries', 'meat', 'milk', 'wine', 'whisky', 'whiskey', 'vodka',
  'kebab', 'soup', 'crisps', 'chips', 'snack', 'fish', 'rum',
  'tequila', 'tosti', 'hotdog', 'chocolate', 'sushi', 'salad',
  'orange_juice', 'juice', 'lemonade', 'pretzel', 'cookie',
  'sprunk', 'ecola',
];

const HEAL_KEYWORDS = [
  'bandage', 'medkit', 'firstaid', 'first_aid', 'painkiller',
  'morphine', 'syringe', 'antibiotic', 'health', 'heal', 'medic',
  'plaster', 'pill', 'adrenaline', 'armor', 'armour', 'vest',
];

const matchesKeywords = (name: string, keywords: string[]) => {
  const n = name.toLowerCase();
  return keywords.some((kw) => n.includes(kw));
};

export const itemMatchesFilter = (item: Slot, filter: ItemFilter): boolean => {
  if (filter === 'all') return true;
  if (!isSlotWithItem(item)) return false;

  const data = Items[item.name];
  const name = item.name;

  switch (filter) {
    case 'weapon':
      return data?.weapon === true || name.toLowerCase().startsWith('weapon_');

    case 'food': {
      const status = data?.client?.status;
      if (status && (status.hunger || status.thirst)) return true;
      return matchesKeywords(name, FOOD_KEYWORDS);
    }

    case 'heal': {
      const status = data?.client?.status;
      if (status && (status.health || status.armour)) return true;
      return matchesKeywords(name, HEAL_KEYWORDS);
    }

    default:
      return true;
  }
};

export const filterItems = (items: Slot[], filter: ItemFilter): Slot[] => {
  if (filter === 'all') return items;
  return items.filter((item): item is SlotWithItem => itemMatchesFilter(item, filter));
};
