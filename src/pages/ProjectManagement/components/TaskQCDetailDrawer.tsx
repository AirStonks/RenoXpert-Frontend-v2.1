import React, { useState, useCallback, useRef } from "react";
import { Attachment, RenoProgress, TaskQCStatus, RPMTaskQC } from "../../../types";
import { changeRPMTaskStatus, removeRPMExternalAttachment, removeRPMInternalAttachment, updateRPMExternalComment, updateRPMInternalComment, uploadRPMExternalAttachment, uploadRPMInternalAttachment } from "../../../services/api";
import { Slide, toast } from "react-toastify";
import { Link } from "react-router-dom";
import { TaskQCStatusBadge } from "../../../components/task-qc-status-badge";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null;

interface AttachmentProps {
    attachment: Attachment;
    taskId: string;
    index: number;
    editMode: { section: "internal" | "external" | null; taskId: string | null };
    onAttachmentChanges?: (updatedRPMTask: RPMTaskQC, taskId: string) => void;
    updateEditedAttachments?: (attachments: Attachment[]) => void;
}

const AttachmentComponent = ({ attachment, taskId, index, editMode, onAttachmentChanges, updateEditedAttachments }: AttachmentProps) => {
    const handleRemoveAttachment = useCallback(
        async () => {
            try {
                let response;

                if (editMode.section === "internal") {
                    response = await removeRPMInternalAttachment(Number(taskId), index);
                } else {
                    response = await removeRPMExternalAttachment(Number(taskId), index);
                }

                const data: RPMTaskQC = response.data;

                if (response?.success) {
                    onAttachmentChanges?.(data, taskId);
                    if (editMode.section === "internal") {
                        updateEditedAttachments?.(data.internal_attachments || []);
                    } else {
                        updateEditedAttachments?.(data.owner_attachments || []);
                    }
                    notify("success", "Attachment removed successfully");
                    return;
                }
            } catch (error) {
                notify("error", "Failed to remove attachment: " + error);
            }
        },
        [editMode.section, taskId, index, onAttachmentChanges, updateEditedAttachments]
    );

    return (
        <div className="relative group cursor-pointer rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
            {attachment.file_url?.includes("image") ? (
                <img src={attachment.file_url} alt={attachment.original_name} className="w-full h-28 object-cover rounded-t-lg" />
            ) : (
                <div className="relative">
                    <img
                        src={AWS_S3_URL + attachment.file_url || getFileIcon("video")}
                        alt={attachment.original_name}
                        className="w-full h-28 object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 group-hover:bg-opacity-50 transition"></div>
                </div>
            )}
            <p className="text-2xs text-gray-600 truncate p-2 bg-gray-50 rounded-b-lg">{attachment.original_name || "No name"}</p>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 bg-black bg-opacity-50 rounded-lg">
                <button
                    className="p-2 bg-white rounded-full"
                    title="View"
                    onClick={() => window.open(AWS_S3_URL + attachment.file_url, "_blank")}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                </button>

                {editMode.section && editMode.taskId === taskId ? (
                    <button
                        className="p-2 bg-red-500 text-white rounded-full"
                        title="Remove"
                        onClick={handleRemoveAttachment}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                ) : (
                    <button className="p-2 bg-white rounded-full" title="Download">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

const notify = (type: "success" | "error", message: string) => {
    (toast[type] as (message: string, options?: object) => void)(message, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: localStorage.getItem("theme"),
        transition: Slide,
    });
};

const getFileIcon = (type: string) => "https://picsum.photos/200/200";

interface TaskQCDetailDrawerProps {
    selectedTaskQc: RPMTaskQC | null;
    selectedSection?: string;
    onClose: () => void;
    onSave: (comment_type: "internal" | "external", taskId: string, comment: string) => void;
    onAttachmentChanges?: (updatedRPMTask: RPMTaskQC, taskId: string) => void;
    taskName: string;
    statusOptions?: string[];
    onStatusChange?: (updatedData: RPMTaskQC | RenoProgress, newStatus: string) => void;
}

export const TaskQCDetailDrawer = ({
    selectedTaskQc,
    selectedSection,
    onClose,
    onSave,
    onAttachmentChanges,
    taskName,
    statusOptions = ["not-started", "in-progress", "completed", "pending"],
    onStatusChange,
}: TaskQCDetailDrawerProps) => {
    const [editMode, setEditMode] = useState<{ section: "internal" | "external" | null; taskId: string | null }>({ section: null, taskId: null });
    const [editedComment, setEditedComment] = useState<string>("");
    const [editedAttachments, setEditedAttachments] = useState<Attachment[]>([]);
    const [isDragOver, setIsDragOver] = useState<{ section: "internal" | "external" | null }>({ section: null });

    const dropZoneRef = useRef<{ internal: HTMLDivElement | null; external: HTMLDivElement | null }>({ internal: null, external: null });

    const handleChangeStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;

        try {
            const response = await changeRPMTaskStatus(Number(selectedTaskQc?.id), newStatus);
            const data: RPMTaskQC | RenoProgress = response.data;

            if (response?.success) {
                onStatusChange?.(data, newStatus);
                notify("success", "Status updated successfully");
                return;
            }
        } catch (error) {
            notify("error", "Failed to update status: " + error);
        }
    };

    const handleEditClick = useCallback(
        (section: "internal" | "external", taskId: string) => {
            setEditMode({ section, taskId });
            setEditedComment(section === "internal" ? selectedTaskQc?.internal_comment || "" : selectedTaskQc?.owner_comment || "");
            setEditedAttachments(section === "internal" ? selectedTaskQc?.internal_attachments || [] : selectedTaskQc?.owner_attachments || []);
        },
        [selectedTaskQc]
    );

    const handleSave = useCallback(
        async (taskId: string) => {
            const originalInternalComment = selectedTaskQc?.internal_comment || "";
            const originalExternalComment = selectedTaskQc?.owner_comment || "";

            const isInternal = editMode.section === "internal";
            const originalComment = isInternal ? originalInternalComment : originalExternalComment;

            if (editedComment === originalComment) {
                setEditMode({ section: null, taskId: null });
                return;
            }

            try {
                let response;

                if (isInternal) {
                    response = await updateRPMInternalComment(Number(taskId), editedComment);
                } else {
                    response = await updateRPMExternalComment(Number(taskId), editedComment);
                }

                if (response?.success) {
                    onSave(editMode.section || "internal", taskId, editedComment);
                    notify("success", "Comment updated successfully");
                    setEditMode({ section: null, taskId: null });
                    return;
                }
            } catch (error) {
                notify("error", "Failed to update status: " + error);
            }
        },
        [editMode, editedComment, onSave, selectedTaskQc]
    );

    const handleCancel = useCallback(() => {
        setEditMode({ section: null, taskId: null });
        setEditedComment("");
        setEditedAttachments([]);
        setIsDragOver({ section: null });
    }, []);

    const handleFileInputChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>, section: "internal" | "external") => {
            if (e.target.files) {
                try {
                    const files = Array.from(e.target.files);
                    let response;

                    if (section === "internal") {
                        response = await uploadRPMInternalAttachment(Number(selectedTaskQc?.id), files);
                    } else {
                        response = await uploadRPMExternalAttachment(Number(selectedTaskQc?.id), files);
                    }

                    const data: RPMTaskQC = response.data;

                    if (response.success) {
                        onAttachmentChanges?.(data, selectedTaskQc?.id || "");

                        if (section === "internal") {
                            setEditedAttachments(data.internal_attachments || []);
                        } else {
                            setEditedAttachments(data.owner_attachments || []);
                        }
                        notify("success", "Attachments added successfully");
                        return;
                    }
                } catch (error) {
                    notify("error", "Failed to add attachments: " + error);
                }
            }
        },
        [selectedTaskQc, onAttachmentChanges]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, section: "internal" | "external") => {
            e.preventDefault();
            if (editMode.section === section && editMode.taskId === selectedTaskQc?.id) setIsDragOver({ section });
        },
        [editMode, selectedTaskQc]
    );

    const handleDragEnter = useCallback(
        (e: React.DragEvent<HTMLDivElement>, section: "internal" | "external") => {
            e.preventDefault();
            if (editMode.section === section && editMode.taskId === selectedTaskQc?.id) setIsDragOver({ section });
        },
        [editMode, selectedTaskQc]
    );

    const handleDragLeave = useCallback(
        (e: React.DragEvent<HTMLDivElement>, section: "internal" | "external") => {
            e.preventDefault();
            if (editMode.section === section && editMode.taskId === selectedTaskQc?.id) setIsDragOver({ section: null });
        },
        [editMode, selectedTaskQc]
    );

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>, section: "internal" | "external") => {
            e.preventDefault();
            setIsDragOver({ section: null });

            if (editMode.section === section && editMode.taskId === selectedTaskQc?.id && e.dataTransfer.files) {
                try {
                    const files = Array.from(e.dataTransfer.files);
                    let response;

                    if (section === "internal") {
                        response = await uploadRPMInternalAttachment(Number(selectedTaskQc?.id), files);
                    } else {
                        response = await uploadRPMExternalAttachment(Number(selectedTaskQc?.id), files);
                    }

                    const data: RPMTaskQC = response.data;

                    if (response.success) {
                        onAttachmentChanges?.(data, selectedTaskQc?.id || "");

                        if (section === "internal") {
                            setEditedAttachments(data.internal_attachments || []);
                        } else {
                            setEditedAttachments(data.owner_attachments || []);
                        }
                        notify("success", "Attachments added successfully");
                        return;
                    }
                } catch (error) {
                    notify("error", "Failed to add attachments: " + error);
                }
            }
        },
        [editMode, selectedTaskQc, onAttachmentChanges]
    );

    const renderAttachmentsSection = (section: "internal" | "external") => (
        <div className="space-y-1">
            <p className="text-2xs font-medium text-gray-700">Attachments:</p>
            {editMode.section === section && editMode.taskId === selectedTaskQc?.id ? (
                <div>
                    <div
                        ref={(el) => (dropZoneRef.current[section] = el)}
                        onDragOver={(e) => handleDragOver(e, section)}
                        onDragEnter={(e) => handleDragEnter(e, section)}
                        onDragLeave={(e) => handleDragLeave(e, section)}
                        onDrop={(e) => handleDrop(e, section)}
                        className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center ${isDragOver.section === section ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
                    >
                        <p className="text-2xs text-gray-600">
                            {isDragOver.section === section ? "Drop files here..." : "Drag & drop files here, or click to select"}
                        </p>
                        <button
                            className="mt-2 bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 transition"
                            onClick={() => document.getElementById(`file-input-${section}`)?.click()}
                        >
                            Browse Files
                        </button>
                        <input
                            id={`file-input-${section}`}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={(e) => handleFileInputChange(e, section)}
                            className="hidden"
                        />
                    </div>
                    {editedAttachments ? (
                        editedAttachments.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {editedAttachments.map((attachment, index) => (
                                    <AttachmentComponent
                                        key={attachment.id || `attachment-${section}-${index}`}
                                        attachment={attachment}
                                        taskId={selectedTaskQc?.id || ""}
                                        index={index}
                                        editMode={editMode}
                                        onAttachmentChanges={onAttachmentChanges}
                                        updateEditedAttachments={setEditedAttachments}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-2xs text-gray-500 italic">No attachments available.</p>
                        )
                    ) : (
                        <p className="text-2xs text-gray-500 italic">No attachments available.</p>
                    )}
                </div>
            ) : (section === "internal" ? selectedTaskQc?.internal_attachments : selectedTaskQc?.owner_attachments)?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(section === "internal" ? selectedTaskQc?.internal_attachments : selectedTaskQc?.owner_attachments)?.map((attachment, index) => (
                        <AttachmentComponent
                            key={attachment.id || `attachment-${section}-${index}`}
                            attachment={attachment}
                            taskId={selectedTaskQc?.id || ""}
                            index={index}
                            editMode={editMode}
                            onAttachmentChanges={onAttachmentChanges}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-2xs text-gray-500 italic">No attachments available.</p>
            )}
        </div>
    );

    return (
        <>
            <div
                className={`fixed top-0 right-0 w-5/12 h-full bg-white shadow-lg z-50 transform transition-all duration-300 ease-in-out ${selectedTaskQc ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                    }`}
                style={{ visibility: selectedTaskQc ? "visible" : "hidden" }}
                role="dialog"
                aria-labelledby="drawer-title"
            >
                <div className="p-4 h-full flex flex-col bg-gray-50">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 id="drawer-title" className="text-sm font-bold text-gray-800">
                            {taskName} Detail
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition" aria-label="Close drawer">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-6 h-6 text-gray-600"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {selectedTaskQc && (
                        <div className="space-y-6 mt-2 overflow-y-auto flex-grow">
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-gray-900">
                                    {/* {selectedTaskQc.room_name ? `${selectedTaskQc.room_name} - ` : selectedSection && `${selectedSection} - `} {selectedTaskQc.item_name} */}
                                </h3>
                                <div className="flex items-center gap-4 rounded-lg bg-slate-200 p-2">
                                    <TaskQCStatusBadge
                                        status={selectedTaskQc.status as TaskQCStatus}
                                        onStatusChange={(newStatus) =>
                                            handleChangeStatus({ target: { value: newStatus } } as React.ChangeEvent<HTMLSelectElement>)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-lg border border-gray-200 p-5 bg-white shadow-sm">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Internal Section
                                    </h3>
                                    {editMode.section === "internal" && editMode.taskId === selectedTaskQc.id ? (
                                        <div className="flex gap-2">
                                            <button className="btn btn-success btn-xs rounded-full px-4" onClick={() => handleSave(selectedTaskQc.id)}>
                                                Save
                                            </button>
                                            <button className="btn btn-secondary btn-xs rounded-full px-4" onClick={handleCancel}>
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-info btn-xs rounded-full px-4" onClick={() => handleEditClick("internal", selectedTaskQc.id)}>
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xs font-medium">Comment:</p>
                                    {editMode.section === "internal" && editMode.taskId === selectedTaskQc.id ? (
                                        <textarea
                                            value={editedComment}
                                            onChange={(e) => setEditedComment(e.target.value)}
                                            className="w-full text-2xs text-gray-700 bg-white border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-2xs text-gray-700 bg-white border border-gray-300 p-3 rounded-md">{selectedTaskQc.internal_comment || "No comment"}</p>
                                    )}
                                </div>

                                {renderAttachmentsSection("internal")}
                            </div>

                            {/* <div className="space-y-4 rounded-lg border border-gray-200 p-5 bg-white shadow-sm">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        External Section (Owner View)
                                    </h3>
                                    {editMode.section === "external" && editMode.taskId === selectedTaskQc.id ? (
                                        <div className="flex gap-2">
                                            <button className="btn btn-success btn-xs rounded-full px-4" onClick={() => handleSave(selectedTaskQc.id)}>
                                                Save
                                            </button>
                                            <button className="btn btn-secondary btn-xs rounded-full px-4" onClick={handleCancel}>
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-info btn-xs rounded-full px-4" onClick={() => handleEditClick("external", selectedTaskQc.id)}>
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xs font-medium">Comment:</p>
                                    {editMode.section === "external" && editMode.taskId === selectedTaskQc.id ? (
                                        <textarea
                                            value={editedComment}
                                            onChange={(e) => setEditedComment(e.target.value)}
                                            className="w-full text-2xs text-gray-700 bg-white border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-2xs text-gray-700 bg-white border border-gray-300 p-3 rounded-md">{selectedTaskQc.owner_comment || "No comment"}</p>
                                    )}
                                </div>
                                {selectedTaskQc.item_name !== "Key Management" && selectedTaskQc.item_name !== "Defect Inspection" && renderAttachmentsSection("external")}
                            </div> */}

                            {selectedTaskQc.updated_at && <div className="text-2xs text-gray-500">Last updated: {selectedTaskQc.updated_at}</div>}
                        </div>
                    )}
                </div>
            </div>
            <div
                className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${selectedTaskQc ? "bg-opacity-50" : "bg-opacity-0"}`}
                style={{ visibility: selectedTaskQc ? "visible" : "hidden" }}
                onClick={onClose}
                aria-label="Close drawer"
            />
        </>
    );
};