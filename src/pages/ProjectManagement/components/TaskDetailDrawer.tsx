import React, { useState, useCallback, useRef } from "react";
import { TaskStatusBadge } from "./rpm/task-status-badge";
import { RPMTask, Attachment } from "../../../types";
import { changeRPMTaskStatus, removeRPMExternalAttachment, removeRPMInternalAttachment, updateRPMExternalComment, updateRPMInternalComment, uploadRPMExternalAttachment, uploadRPMInternalAttachment } from "../../../services/api";
import { Slide, toast } from "react-toastify";
import { Link } from "react-router-dom";

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
    editMode: { section: "internal" | "external" | null; taskId: string | null }; // Add editMode to props
    onAttachmentChanges?: (updatedRPMTask: RPMTask, taskId: string) => void;
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

                const data: RPMTask = response.data;

                if (response?.success) {
                    onAttachmentChanges(data, taskId);
                    if (editMode.section === "internal") {
                        updateEditedAttachments(data.internal_attachments);
                    } else {
                        updateEditedAttachments(data.owner_attachments);
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
            <p className="text-xs text-gray-600 truncate p-2 bg-gray-50 rounded-b-lg">{attachment.original_name || "No name"}</p>
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
                )
                }
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

interface TaskDetailDrawerProps {
    selectedTask: RPMTask | null;
    onClose: () => void;
    onSave: (comment_type: "internal" | "external", taskId: string, comment: string) => void;
    onAttachmentChanges?: (updatedRPMTask: RPMTask, taskId: string) => void;
    taskName: string;
    statusOptions?: string[];
    onStatusChange?: (updatedRPMTask: RPMTask, newStatus: string) => void;
}

export const TaskDetailDrawer = ({
    selectedTask,
    onClose,
    onSave,
    onAttachmentChanges,
    taskName,
    statusOptions = ["not-started", "in-progress", "completed", "pending"],
    onStatusChange,
}: TaskDetailDrawerProps) => {
    const [editMode, setEditMode] = useState<{ section: "internal" | "external" | null; taskId: string | null }>({ section: null, taskId: null });
    const [editedComment, setEditedComment] = useState<string>("");
    const [editedAttachments, setEditedAttachments] = useState<Attachment[]>([]);
    const [isDragOver, setIsDragOver] = useState<{ section: "internal" | "external" | null }>({ section: null });

    const dropZoneRef = useRef<{ internal: HTMLDivElement | null; external: HTMLDivElement | null }>({ internal: null, external: null });

    const handleChangeStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;

        try {
            const response = await changeRPMTaskStatus(Number(selectedTask?.id), newStatus);
            const updatedRPMTask: RPMTask = response.data;

            if (response?.success) {
                onStatusChange?.(updatedRPMTask, newStatus);
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
            setEditedComment(section === "internal" ? selectedTask?.internal_comment || "" : selectedTask?.owner_comment || "");
            setEditedAttachments(section === "internal" ? selectedTask?.internal_attachments || [] : selectedTask?.owner_attachments || []);
        },
        [selectedTask]
    );

    const handleSave = useCallback(
        async (taskId: string) => {
            const originalInternalComment = selectedTask?.internal_comment || "";
            const originalExternalComment = selectedTask?.owner_comment || "";

            // Check if the comment has changed
            const isInternal = editMode.section === "internal";
            const originalComment = isInternal ? originalInternalComment : originalExternalComment;

            if (editedComment === originalComment) {
                setEditMode({ section: null, taskId: null });
                return; // Exit early if the comment hasn't changed
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
        [editMode, editedComment, onSave, selectedTask]
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
                        response = await uploadRPMInternalAttachment(Number(selectedTask?.id), files);
                    } else {
                        response = await uploadRPMExternalAttachment(Number(selectedTask?.id), files);
                    }

                    const data: RPMTask = response.data;

                    if (response.success) {
                        onAttachmentChanges?.(data, selectedTask?.id);

                        if (section === "internal") {
                            setEditedAttachments(data.internal_attachments);
                        } else {
                            setEditedAttachments(data.owner_attachments);
                        }
                        notify("success", "Attachments added successfully");
                        return;
                    }
                } catch (error) {
                    notify("error", "Failed to add attachments: " + error);
                }
            }
        },
        [selectedTask, onAttachmentChanges]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, section: "internal" | "external") => {
            e.preventDefault();
            if (editMode.section === section && editMode.taskId === selectedTask?.id) setIsDragOver({ section });
        },
        [editMode, selectedTask]
    );

    const handleDragEnter = useCallback(
        (e: React.DragEvent<HTMLDivElement>, section: "internal" | "external") => {
            e.preventDefault();
            if (editMode.section === section && editMode.taskId === selectedTask?.id) setIsDragOver({ section });
        },
        [editMode, selectedTask]
    );

    const handleDragLeave = useCallback(
        (e: React.DragEvent<HTMLDivElement>, section: "internal" | "external") => {
            e.preventDefault();
            if (editMode.section === section && editMode.taskId === selectedTask?.id) setIsDragOver({ section: null });
        },
        [editMode, selectedTask]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, section: "internal" | "external") => {
            e.preventDefault();
            setIsDragOver({ section: null });
            if (editMode.section === section && editMode.taskId === selectedTask?.id && e.dataTransfer.files) {
                const files = Array.from(e.dataTransfer.files);
                const newAttachments = files
                    .filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
                    .map((file, index) => {
                        const id = `${editedAttachments.length + index + 1}`;
                        const type = file.type.startsWith("image/") ? "image" : "video";
                        return { id, original_name: file.name, file_url: URL.createObjectURL(file), file, size: file.size };
                    });
                setEditedAttachments((prev) => [...prev, ...newAttachments]);
            }
        },
        [editMode, selectedTask, editedAttachments]
    );

    const renderAttachmentsSection = (section: "internal" | "external") => (
        <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Attachments:</p>
            {editMode.section === section && editMode.taskId === selectedTask?.id ? (
                <div>
                    <div
                        ref={(el) => (dropZoneRef.current[section] = el)}
                        onDragOver={(e) => handleDragOver(e, section)}
                        onDragEnter={(e) => handleDragEnter(e, section)}
                        onDragLeave={(e) => handleDragLeave(e, section)}
                        onDrop={(e) => handleDrop(e, section)}
                        className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center ${isDragOver.section === section ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
                            }`}
                    >
                        <p className="text-sm text-gray-600">
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
                                        key={attachment.id}
                                        attachment={attachment}
                                        taskId={selectedTask?.id || ""}
                                        index={index}
                                        editMode={editMode}
                                        onAttachmentChanges={onAttachmentChanges}
                                        updateEditedAttachments={setEditedAttachments}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No attachments available.</p>
                        )
                    ) : (
                        <p className="text-sm text-gray-500 italic">No attachments available.</p>
                    )}
                </div>
            ) : (section === "internal" ? selectedTask?.internal_attachments : selectedTask?.owner_attachments)?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(section === "internal" ? selectedTask?.internal_attachments : selectedTask?.owner_attachments)?.map((attachment, index) => (
                        <AttachmentComponent
                            key={attachment.id || `attachment-${section}-${index}`}
                            attachment={attachment}
                            taskId={selectedTask?.id || ""}
                            index={index}
                            editMode={editMode}
                            onAttachmentChanges={onAttachmentChanges}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No attachments available.</p>
            )}
        </div>
    );

    return (
        <>
            <div
                className={`fixed top-0 right-0 w-5/12 h-full bg-white shadow-lg z-50 transform transition-all duration-300 ease-in-out ${selectedTask ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                    }`}
                style={{ visibility: selectedTask ? "visible" : "hidden" }}
                role="dialog"
                aria-labelledby="drawer-title"
            >
                <div className="p-6 h-full flex flex-col bg-gray-50">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h2 id="drawer-title" className="text-xl font-bold text-gray-800">
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

                    {selectedTask && (
                        <div className="space-y-6 mt-2 overflow-y-auto flex-grow">
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {selectedTask.room_name ? `${selectedTask.room_name} - ` : ""} {selectedTask.item_name}
                                </h3>
                                <div className="flex items-center gap-4 rounded-lg bg-slate-200 p-2">
                                    <TaskStatusBadge
                                        status={selectedTask.status || "pending"}
                                        onStatusChange={(newStatus) =>
                                            handleChangeStatus({ target: { value: newStatus } } as React.ChangeEvent<HTMLSelectElement>)
                                        }
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Redirections */}
                            {selectedTask.item_name === "Defect Inspection" && (
                                <div className="space-y-4 rounded-lg border border-gray-200 p-5 bg-white shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Defect Inspection Form
                                        </h3>
                                    </div>
                                    <div className="space-1">
                                        <Link
                                            to={`/reno-progress/${selectedTask.job.reno_progress_id}/defect-inspection-report`}
                                            state={{ fromUrl: `/reno-progress/${selectedTask.job.reno_progress_id}` }}
                                            className="w-full mb-4 bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 flex items-center justify-center gap-2 transition-colors duration-200"
                                        >
                                            <span className="text-sm">📋</span>
                                            <span>Open Defect Inspection Form</span>
                                        </Link>
                                    </div>
                                </div>
                            )}
                            {selectedTask.item_name === "Key Management" && (
                                <div className="space-y-4 rounded-lg border border-gray-200 p-5 bg-white shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                                />
                                            </svg>
                                            Key Management Detail
                                        </h3>
                                    </div>
                                    <div className="space-1">
                                        <Link
                                            to={`/reno-progress/${selectedTask.job.reno_progress_id}/key-management`}
                                            state={{ fromUrl: `/reno-progress/${selectedTask.job.reno_progress_id}` }}
                                            className="w-full mb-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 transition-colors duration-200"
                                        >
                                            <span className="text-sm">📋</span>
                                            <span>Open Key Management Detail</span>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Internal Section */}
                            <div className="space-y-4 rounded-lg border border-gray-200 p-5 bg-white shadow-sm">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Internal Section
                                    </h3>
                                    {editMode.section === "internal" && editMode.taskId === selectedTask.id ? (
                                        <div className="flex gap-2">
                                            <button className="btn btn-success btn-sm rounded-full px-4" onClick={() => handleSave(selectedTask.id)}>
                                                Save
                                            </button>
                                            <button className="btn btn-secondary btn-sm rounded-full px-4" onClick={handleCancel}>
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-info btn-sm rounded-full px-4" onClick={() => handleEditClick("internal", selectedTask.id)}>
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Comment:</p>
                                    {editMode.section === "internal" && editMode.taskId === selectedTask.id ? (
                                        <textarea
                                            value={editedComment}
                                            onChange={(e) => setEditedComment(e.target.value)}
                                            className="w-full text-sm text-gray-700 bg-white border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 bg-white border border-gray-300 p-3 rounded-md">{selectedTask.internal_comment || "No comment"}</p>
                                    )}
                                </div>
                                {selectedTask.item_name !== "Key Management" && selectedTask.item_name !== "Defect Inspection" && renderAttachmentsSection("internal")}
                            </div>

                            {/* External Section */}
                            <div className="space-y-4 rounded-lg border border-gray-200 p-5 bg-white shadow-sm">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        External Section (Owner View)
                                    </h3>
                                    {editMode.section === "external" && editMode.taskId === selectedTask.id ? (
                                        <div className="flex gap-2">
                                            <button className="btn btn-success btn-sm rounded-full px-4" onClick={() => handleSave(selectedTask.id)}>
                                                Save
                                            </button>
                                            <button className="btn btn-secondary btn-sm rounded-full px-4" onClick={handleCancel}>
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-info btn-sm rounded-full px-4" onClick={() => handleEditClick("external", selectedTask.id)}>
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Comment:</p>
                                    {editMode.section === "external" && editMode.taskId === selectedTask.id ? (
                                        <textarea
                                            value={editedComment}
                                            onChange={(e) => setEditedComment(e.target.value)}
                                            className="w-full text-sm text-gray-700 bg-white border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 bg-white border border-gray-300 p-3 rounded-md">{selectedTask.owner_comment || "No comment"}</p>
                                    )}
                                </div>
                                {selectedTask.item_name !== "Key Management" && selectedTask.item_name !== "Defect Inspection" && renderAttachmentsSection("external")}
                            </div>

                            {selectedTask.updated_at && <div className="text-xs text-gray-500">Last updated: {selectedTask.updated_at}</div>}
                        </div>
                    )}
                </div>
            </div>
            <div
                className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${selectedTask ? "bg-opacity-50" : "bg-opacity-0"}`}
                style={{ visibility: selectedTask ? "visible" : "hidden" }}
                onClick={onClose}
                aria-label="Close drawer"
            />
        </>
    );
};