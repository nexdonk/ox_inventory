import { Inventory, SlotWithItem } from '../../typings';
import React, { Fragment, useMemo } from 'react';
import { Items } from '../../store/items';
import { Locale } from '../../store/locale';
import ReactMarkdown from 'react-markdown';
import { useAppSelector } from '../../store';
import { getItemUrl } from '../../helpers';
import Divider from '../utils/Divider';
import { LuClock, LuShield, LuHash, LuTarget, LuPaintBucket, LuPuzzle, LuCircle } from 'react-icons/lu';

const MetaRow: React.FC<{ icon?: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
    {icon && <span style={{ display: 'inline-flex', color: 'rgba(255,255,255,0.85)' }}>{icon}</span>}
    <span className="key" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Roboto Mono, monospace', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </span>
    <span style={{ marginLeft: 'auto', fontFamily: 'Roboto Mono, monospace', fontSize: '1.25rem', color: '#ffffff' }}>
      {value}
    </span>
  </div>
);

const SlotTooltip: React.ForwardRefRenderFunction<
  HTMLDivElement,
  { item: SlotWithItem; inventoryType: Inventory['type']; style: React.CSSProperties }
> = ({ item, inventoryType, style }, ref) => {
  const additionalMetadata = useAppSelector((state) => state.inventory.additionalMetadata);
  const itemData = useMemo(() => Items[item.name], [item]);
  const ingredients = useMemo(() => {
    if (!item.ingredients) return null;
    return Object.entries(item.ingredients).sort((a, b) => a[1] - b[1]);
  }, [item]);
  const description = item.metadata?.description || itemData?.description;
  const ammoName = itemData?.ammoName && Items[itemData?.ammoName]?.label;

  if (!itemData) {
    return (
      <div className="tooltip-wrapper" ref={ref} style={style}>
        <div className="tooltip-header-wrapper">
          <p className="name">{item.name}</p>
        </div>
        <Divider />
      </div>
    );
  }

  return (
    <div style={{ ...style }} className="tooltip-wrapper" ref={ref}>
      <div className="tooltip-header-wrapper">
        <p className="name">{item.metadata?.label || itemData.label || item.name}</p>
        {inventoryType === 'crafting' ? (
          <div className="tooltip-crafting-duration">
            <LuClock size={11} />
            <span style={{ fontFamily: 'Roboto Mono, monospace', fontSize: '1.2rem' }}>
              {(item.duration !== undefined ? item.duration : 3000) / 1000}s
            </span>
          </div>
        ) : (
          item.metadata?.type && <span className="badge">{item.metadata.type}</span>
        )}
      </div>
      <Divider />

      {description && (
        <div className="tooltip-description">
          <ReactMarkdown className="tooltip-markdown">{description}</ReactMarkdown>
        </div>
      )}

      {inventoryType !== 'crafting' ? (
        <div className="tooltip-meta">
          {item.durability !== undefined && (
            <MetaRow
              icon={<LuShield size={11} />}
              label={Locale.ui_durability || 'Durability'}
              value={`${Math.trunc(item.durability)}%`}
            />
          )}
          {item.metadata?.ammo !== undefined && (
            <MetaRow icon={<LuTarget size={11} />} label={Locale.ui_ammo || 'Ammo'} value={item.metadata.ammo} />
          )}
          {ammoName && <MetaRow icon={<LuCircle size={11} />} label={Locale.ammo_type || 'Ammo type'} value={ammoName} />}
          {item.metadata?.serial && (
            <MetaRow icon={<LuHash size={11} />} label={Locale.ui_serial || 'Serial'} value={item.metadata.serial} />
          )}
          {item.metadata?.components && item.metadata?.components[0] && (
            <MetaRow
              icon={<LuPuzzle size={11} />}
              label={Locale.ui_components || 'Components'}
              value={(item.metadata?.components as string[])
                .map((component, index, array) =>
                  index + 1 === array.length ? Items[component]?.label : Items[component]?.label + ', '
                )
                .join('')}
            />
          )}
          {item.metadata?.weapontint && (
            <MetaRow icon={<LuPaintBucket size={11} />} label={Locale.ui_tint || 'Tint'} value={item.metadata.weapontint} />
          )}
          {additionalMetadata.map((data: { metadata: string; value: string }, index: number) => (
            <Fragment key={`metadata-${index}`}>
              {item.metadata && item.metadata[data.metadata] && (
                <MetaRow label={data.value} value={item.metadata[data.metadata]} />
              )}
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="tooltip-ingredients">
          {ingredients &&
            ingredients.map((ingredient) => {
              const [iName, count] = [ingredient[0], ingredient[1]];
              return (
                <div className="tooltip-ingredient" key={`ingredient-${iName}`}>
                  <img src={iName ? getItemUrl(iName) : 'none'} alt="item-image" />
                  <p>
                    {count >= 1
                      ? `${count}× ${Items[iName]?.label || iName}`
                      : count === 0
                      ? `${Items[iName]?.label || iName}`
                      : count < 1 && `${count * 100}% ${Items[iName]?.label || iName}`}
                  </p>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default React.forwardRef(SlotTooltip);
