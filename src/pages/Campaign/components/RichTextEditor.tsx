import { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const Btn = ({ active, onClick, label }: { active?: boolean; onClick: () => void; label: string }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-2 py-1 text-sm rounded ${active ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
    >
        {label}
    </button>
);

const Toolbar = ({ editor }: { editor: Editor }) => {
    const setLink = () => {
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL', prev ?? '');
        if (url === null) return;
        if (url === '') { editor.chain().focus().unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };
    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1">
            <Btn label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <Btn label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <Btn label="S" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
            <Btn label="H1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
            <Btn label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
            <Btn label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
            <Btn label="• List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <Btn label="1. List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <Btn label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <Btn label="Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
            <Btn label="Link" active={editor.isActive('link')} onClick={setLink} />
            <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()} />
            <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()} />
        </div>
    );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [StarterKit.configure({ link: { openOnClick: false, autolink: true } })],
        content: value || '',
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: { class: 'rich-content min-h-[160px] px-3 py-2 focus:outline-none', ...(placeholder ? { 'data-placeholder': placeholder } : {}) },
        },
    });

    // Sync external resets (e.g. Edit form load) without clobbering the cursor mid-typing.
    useEffect(() => {
        if (!editor) return;
        if ((value || '') !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="rounded-xl border border-slate-300 bg-white">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default RichTextEditor;
