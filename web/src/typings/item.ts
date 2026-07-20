export type ItemData = {
  name: string;
  label: string;
  stack: boolean;
  usable: boolean;
  close: boolean;
  count: number;
  description?: string;
  buttons?: string[];
  ammoName?: string;
  image?: string;
  /** Set by ox_inventory's items module for weapon items */
  weapon?: boolean;
  hash?: number;
  /** Server-side client config (status effects, animation, etc.) — best-effort, may be undefined */
  client?: {
    status?: { hunger?: number; thirst?: number; health?: number; armour?: number; stress?: number };
    [k: string]: any;
  };
};
