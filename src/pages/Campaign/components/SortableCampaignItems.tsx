import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/**
 * Props handed to the render-prop child so the consumer can place the drag
 * handle exactly where it wants (e.g. inside the card/section header).
 */
export interface SortableHandleProps {
    /** Spread onto the element that should act as the drag handle. */
    handleProps: React.HTMLAttributes<HTMLElement> & { ref?: never };
    isDragging: boolean;
}

/**
 * Generic sortable wrapper used by AddCampaign / EditCampaign for both the
 * package cards and the layout-type blocks.
 *
 * Handle-only dragging: the consumer spreads `handleProps` onto a header button
 * so the inputs / collapse / remove controls inside the card keep working.
 *
 * `id` MUST be a STABLE per-item id (e.g. `pkg.id ?? \`new-${i}\``) so the dnd
 * id never changes as the underlying array index shifts after a reorder.
 */
interface SortableCampaignItemProps {
    id: string;
    /** Tailwind classes applied to the outer wrapper. */
    className?: string;
    children: (props: SortableHandleProps) => React.ReactNode;
}

export const SortableCampaignItem: React.FC<SortableCampaignItemProps> = ({ id, className, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative',
    };

    const handleProps = { ...attributes, ...listeners } as SortableHandleProps['handleProps'];

    return (
        <div ref={setNodeRef} style={style} className={className}>
            {children({ handleProps, isDragging })}
        </div>
    );
};

/** Convenience grip-handle button to drop into a header; spread `handleProps`. */
export const DragHandle: React.FC<
    { handleProps: SortableHandleProps['handleProps']; label?: string; className?: string }
> = ({ handleProps, label, className }) => (
    <button
        type="button"
        {...handleProps}
        aria-label={label || 'Drag to reorder'}
        className={
            className ||
            'p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 cursor-grab active:cursor-grabbing transition-colors duration-200'
        }
    >
        <GripVertical className="h-4 w-4" />
    </button>
);
