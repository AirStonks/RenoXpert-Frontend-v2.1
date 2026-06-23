import { useRef, useState } from 'react';

interface FileDropzoneProps {
    /** Which MIME family this zone accepts. Maps to `${accept}/` prefix filtering. */
    accept: 'image' | 'video';
    /** Allow multiple files in one drop. Single zones use the first matching file. */
    multiple?: boolean;
    /** Called with the matching dropped files (already type-filtered). */
    onFiles: (files: File[]) => void;
    /** When true, drag/drop is a no-op. */
    disabled?: boolean;
    /** Classes for the wrapper element (keep the existing box classes here). */
    className?: string;
    children: React.ReactNode;
}

/**
 * Adds native drag-and-drop to an existing upload area. Presentational + behavioral
 * only: it never uploads or knows about campaigns — it turns a drop into onFiles(File[]).
 * Click-to-browse inside `children` is untouched.
 */
const FileDropzone: React.FC<FileDropzoneProps> = ({
    accept,
    multiple = false,
    onFiles,
    disabled = false,
    className = '',
    children,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    // Counter so dragging over child elements doesn't flicker the highlight.
    const dragDepth = useRef(0);

    const matches = (file: File) => file.type.startsWith(`${accept}/`);

    const handleDragEnter = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault(); // required so the browser allows a drop
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        dragDepth.current = 0;
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files ?? []);
        const valid = dropped.filter(matches);
        if (valid.length === 0) return;
        onFiles(multiple ? valid : [valid[0]]);
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`${className} ${isDragging ? 'border-2 border-dashed border-campaign bg-campaign/5' : ''}`.trim()}
        >
            {children}
        </div>
    );
};

export default FileDropzone;
