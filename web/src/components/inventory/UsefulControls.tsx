import { Locale } from '../../store/locale';
import React from 'react';
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';
import { LuX, LuKeyboard } from 'react-icons/lu';

interface Props {
  infoVisible: boolean;
  setInfoVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Row {
  keys: string[];
  text: string | undefined;
}

const UsefulControls: React.FC<Props> = ({ infoVisible, setInfoVisible }) => {
  const { refs, context } = useFloating({
    open: infoVisible,
    onOpenChange: setInfoVisible,
  });

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
  });

  const { isMounted, styles } = useTransitionStyles(context, { duration: 100 });
  const { getFloatingProps } = useInteractions([dismiss]);

  const rows: Row[] = [
    { keys: ['RMB'], text: Locale.ui_rmb },
    { keys: ['ALT', 'LMB'], text: Locale.ui_alt_lmb },
    { keys: ['CTRL', 'LMB'], text: Locale.ui_ctrl_lmb },
    { keys: ['SHIFT', 'Drag'], text: Locale.ui_shift_drag },
    { keys: ['CTRL', 'SHIFT', 'LMB'], text: Locale.ui_ctrl_shift_lmb },
  ];

  if (!isMounted) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay lockScroll className="useful-controls-dialog-overlay" data-open={infoVisible} style={styles}>
        <FloatingFocusManager context={context}>
          <div ref={refs.setFloating} {...getFloatingProps()} className="useful-controls-dialog" style={styles}>
            <div className="useful-controls-dialog-title">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem' }}>
                <LuKeyboard size={14} />
                <span>{Locale.ui_usefulcontrols || 'Useful controls'}</span>
              </span>
              <div className="useful-controls-dialog-close" onClick={() => setInfoVisible(false)}>
                <LuX size={14} />
              </div>
            </div>
            <div className="divider" />
            <div className="useful-controls-content-wrapper">
              {rows.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.4rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {row.keys.map((k, i) => (
                      <React.Fragment key={`${k}-${i}`}>
                        <kbd>{k}</kbd>
                        {i < row.keys.length - 1 && (
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem' }}>+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <span style={{ flex: 1, textAlign: 'right' }}>{row.text}</span>
                </div>
              ))}
              <div style={{ textAlign: 'right', fontSize: '1.1rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>
                🐂 OX
              </div>
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
};

export default UsefulControls;
