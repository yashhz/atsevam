import {useState, useRef, useEffect} from 'react';
import {Icon} from './Icon';

type AccordionItemProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function AccordionItem({title, children, defaultOpen = false}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      setHeight(contentRef.current.scrollHeight);
      // After transition, set to undefined so it can grow naturally
      const t = setTimeout(() => setHeight(undefined), 400);
      return () => clearTimeout(t);
    } else {
      // Snapshot current height before collapsing
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [open]);

  return (
    <div className="accordion-item" data-open={open ? 'true' : 'false'}>
      <button
        className="accordion-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <Icon
          name="plus"
          size={16}
          className="accordion-icon"
          strokeWidth={1.5}
        />
      </button>
      <div
        className="accordion-content"
        style={{height: height === undefined ? 'auto' : `${height}px`}}
        aria-hidden={!open}
      >
        <div ref={contentRef} className="accordion-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

type AccordionProps = {
  children: React.ReactNode;
};

export function Accordion({children}: AccordionProps) {
  return <div>{children}</div>;
}
