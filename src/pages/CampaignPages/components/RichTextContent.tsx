import DOMPurify from 'dompurify';

interface RichTextContentProps {
    html?: string | null;
    className?: string;
}

// Legacy campaign descriptions are plain text; new ones are HTML from the editor.
const looksLikeHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);

const RichTextContent: React.FC<RichTextContentProps> = ({ html, className = '' }) => {
    if (!html) return null;
    if (!looksLikeHtml(html)) {
        return <div className={`whitespace-pre-line ${className}`.trim()}>{html}</div>;
    }
    const clean = DOMPurify.sanitize(html);
    return <div className={`rich-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: clean }} />;
};

export default RichTextContent;
