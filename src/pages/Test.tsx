import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
    value?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    width?: string,
}

const QuillEditor: React.FC<QuillEditorProps> = ({
    value = '',
    onChange,
    placeholder = 'Start writing...',
    readOnly = false,
    width = '100%',
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);

    useEffect(() => {
        if (editorRef.current && !quillRef.current) {
            const quill = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'blockquote'],
                        [{ 'align': ['', 'center', 'right', 'justify'] }],  // Added text alignment
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                        ['link'],
                        ['clean'],
                    ]
                },
                placeholder,
                readOnly,
            });

            // Set initial content
            quill.root.innerHTML = value;

            // Handle content changes
            quill.on('text-change', () => {
                const content = quill.root.innerHTML;
                onChange?.(content);
            });

            quillRef.current = quill;
        }

        // Cleanup on unmount
        return () => {
            if (quillRef.current) {
                quillRef.current.off('text-change');
            }
        };
    }, []);

    // Update content if value prop changes
    useEffect(() => {
        if (quillRef.current && value !== quillRef.current.root.innerHTML) {
            quillRef.current.root.innerHTML = value;
        }
    }, [value]);

    return (
        <div
            className="quill-editor-container"
            style={{
                width: width,
                maxWidth: '40%',
                margin: '0 auto'
            }}
        >
            <div ref={editorRef} />
        </div>
    );
};

function Test() {
    const [content, setContent] = React.useState('<ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">This quotation is only valid for 7 days. If BeLive receives the Client’s confirmation after 7 days, BeLive reserves the right to make changes to the quotation.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">BeLive reserves the right to decide on the overall design and theme, the selection of furniture, fixtures, and fittings for the Client’s unit including the colour and material of products.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">The pre-booking payment has a grace period of 7 days upon booking payment.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">Any pictures or illustrations shown are for reference purposes only. BeLive will attempt to create a similar concept; however, some items may be seasonal, and BeLive reserves the right to substitute similar products of equivalent quality at our discretion.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">BeLive is allowed to take photos of the renovation and the end product for marketing and promotional purposes.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">BeLive reserves the right to replace the items as quoted with products of equivalent or higher value, of similar functionality, and/or purpose.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">The commencement date for the renovation shall be determined at the sole discretion of BeLive.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">BeLive will make reasonable efforts to meet the specified completion dates. However, unforeseen circumstances may lead to adjustments in the timeline. The Client will be informed of any changes.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">In the event of non-payment or breach of contract by the Client, BeLive reserves the right to suspend work until the issue is resolved. Any additional costs incurred as a result of such suspension will be borne by the Client.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">The bank interest rate for the installment plan may change by the bank(s) without prior notification to the Client.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">For safety and security reasons, access/execution of all works by BeLive staff, suppliers, contractors, and sub-contractors requires the unit to be vacated during the entire duration of renovation work.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">The Client consents to refrain from accessing the unit without prior notification to the BeLive team. Entry should be coordinated with a designated team member if the Client wishes to enter the unit during the renovation period.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">It is advised that the Client refrain from staying in the unit during the renovation period. Occupancy may impact renovation progress and could raise safety concerns.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">The Client acknowledges that the scope of work for this renovation project is fixed, and no changes, alterations, or customizations are permitted once the quotation is signed.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">The quotation includes up to 6 feet of copper piping per air conditioning unit. An additional charge of RM25 per foot will apply for any additional copper piping required.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">This quotation includes the supply and installation of kitchen cabinets up to the length specified. Any additional length will incur extra charges.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">Payment verification: Kindly WhatsApp us at +6011-5899 6291 with the bank-in slip or online payment receipt, along with the client’s name, development name, and unit number.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">It shall be the Client’s duty to ensure that all details ascribed in the email are correct and accurate. BeLive shall not be held responsible for any discrepancies.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">Renovations proceed in batches based on a first-come, first-served basis. BeLive is not responsible for delays due to a lack of documents or payment delays.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">The Client assumes all risk for installing a partition. BeLive is not liable for penalties or removal costs requested by authorities.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">The Client is solely responsible for paying the renovation deposit to the management office and for handling all related matters.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">For all goods, products, and materials under the renovation work, BeLive reserves the right to remove any furniture and/or fittings up to the value of the amount owing to BeLive.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">If the Client opts to make payment using a credit card, an additional admin fee of 2% will apply. This charge is not applicable for credit card installment plans, FPX, or bank transfers.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">Any payment made is non-refundable.</span></li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">By signing this quotation, the Client acknowledges and agrees to the terms and conditions outlined in the quotation and the attached renovation agreement.</span></li></ol><p class="ql-align-center"><br></p>');

    const testFunction = () => {
        console.log(content);
    }

    return (
        <>
            <QuillEditor
                value={content}
                onChange={setContent}
                placeholder="Write something amazing..."
            />

            <button className='btn btn-primary' onClick={testFunction}>Click</button>
        </>
    )
}

export default Test;