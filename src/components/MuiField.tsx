import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

/* ---- MUI Outlined TextField ---- */

type MuiTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  /** Floating label text */
  label: string;
  /** Show red asterisk */
  required?: boolean;
  /** Show "(optional)" suffix */
  optional?: boolean;
  /** Extra class on the wrapper div */
  className?: string;
};

export function MuiTextField({ label, required, optional, className, ...inputProps }: MuiTextFieldProps) {
  return (
    <div className={`mui-field${className ? ` ${className}` : ''}`}>
      <input placeholder=" " {...inputProps} required={required} />
      <MuiLabel label={label} required={required} optional={optional} />
    </div>
  );
}

/* ---- MUI Outlined SelectField ---- */

type MuiSelectOption = {
  label: string;
  value: string;
};

type MuiSelectFieldProps = {
  /** Floating label text */
  label: string;
  /** Show red asterisk */
  required?: boolean;
  /** Whether the select has a value (drives the floated state) */
  filled?: boolean;
  /** Extra class on the wrapper div */
  className?: string;
  autoComplete?: string;
  disabled?: boolean;
  id: string;
  name?: string;
  onValueChange: (value: string) => void;
  options: MuiSelectOption[];
  placeholder?: string;
  value: string;
};

export function MuiSelectField({
  label,
  required,
  filled,
  className,
  disabled,
  id,
  onValueChange,
  options,
  value,
}: MuiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const visibleFilled = filled ?? Boolean(value);

  // Compute the menu position based on the trigger's viewport coordinates
  const positionMenu = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const triggerRect = root.getBoundingClientRect();
    const menuMaxHeight = 304;
    const gap = 6;
    const spaceBelow = window.innerHeight - triggerRect.bottom - gap;
    const spaceAbove = triggerRect.top - gap;

    const style: React.CSSProperties = {
      position: 'fixed',
      left: triggerRect.left,
      width: triggerRect.width,
      zIndex: 9999,
    };

    if (spaceBelow >= menuMaxHeight || spaceBelow >= spaceAbove) {
      // Open downward
      style.top = triggerRect.bottom + gap;
      style.maxHeight = Math.min(menuMaxHeight, spaceBelow);
    } else {
      // Open upward
      style.bottom = window.innerHeight - triggerRect.top + gap;
      style.maxHeight = Math.min(menuMaxHeight, spaceAbove);
    }

    setMenuStyle(style);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    // Position after a frame so layout is settled
    requestAnimationFrame(() => {
      positionMenu();
    });

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      // Keep open if click is inside trigger OR inside portal menu
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleScroll() {
      positionMenu();
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open, positionMenu]);

  useEffect(() => {
    if (selectedIndex >= 0) {
      setActiveIndex(selectedIndex);
    }
  }, [selectedIndex]);

  function chooseOption(option: MuiSelectOption) {
    onValueChange(option.value);
    setOpen(false);
  }

  function moveActive(step: number) {
    if (!options.length) {
      return;
    }

    setActiveIndex((current) => {
      const next = (current + step + options.length) % options.length;
      return next;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        moveActive(1);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : options.length - 1);
      } else {
        moveActive(-1);
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open && options[activeIndex]) {
        chooseOption(options[activeIndex]);
      } else {
        setOpen(true);
      }
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div
      className={`mui-field mui-select-field${visibleFilled ? ' mui-filled' : ''}${open ? ' mui-open' : ''}${className ? ` ${className}` : ''}`}
      ref={rootRef}
    >
      <button
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={selectedOption?.label ?? label}
        className="mui-select-trigger"
        disabled={disabled}
        id={id}
        onBlur={() => undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className={selectedOption ? 'mui-select-value' : 'mui-select-placeholder'}>
          {selectedOption?.label ?? ''}
        </span>
        <span className="mui-select-caret" aria-hidden="true" />
      </button>
      <MuiLabel label={label} required={required} />
      {open &&
        createPortal(
          <div
            className="mui-select-menu"
            id={listboxId}
            ref={menuRef}
            role="listbox"
            aria-labelledby={id}
            style={menuStyle}
          >
            {options.map((option, index) => {
              const selected = option.value === value;
              const active = index === activeIndex;

              return (
                <button
                  aria-selected={selected}
                  className={`mui-select-option${selected ? ' is-selected' : ''}${active ? ' is-active' : ''}`}
                  key={option.value}
                  onClick={() => chooseOption(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <span>{option.label}</span>
                  {selected && <span className="mui-select-check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ---- Shared floating label ---- */

function MuiLabel({ label, required, optional }: { label: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="mui-label">
      {label}
      {required && <span className="mui-required" aria-hidden="true"> *</span>}
      {optional && <span className="mui-optional"> (optional)</span>}
    </span>
  );
}
