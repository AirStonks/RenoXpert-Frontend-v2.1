"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import {
    ArrowLeft,
    Save,
    Eye,
    Plus,
    X,
    Upload,
    Shield,
    Star,
    Gift,
    Edit3,
    Edit2,
    SquareIcon,
    Building2,
    GalleryThumbnailsIcon,
    Check,
    ImageIcon,
    GripVertical,
    Link,
    Camera,
} from "lucide-react"
import useFetchProperty from "../../hook/useFetchProperty"
import type { Property, ROICardFeature } from "../../types"
import { PreviewROIProgramModal } from "./components/Modals/PreviewROIProgramModal"
import { KTModal } from "../../metronic/core"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { updatePropertyWithFiles } from "../../services/api"
import { Slide, toast } from "react-toastify"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

export const PropertyEdit: React.FC = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>();
    const propertyId = id ? parseInt(id, 10) : null;
    const { propertyDetail, loading, error, abort } = useFetchProperty(propertyId)

    const [property, setProperty] = useState<Property>({
        name: "",
        address: "",
        street: "",
        city: "",
        postcode: "",
        state: "",
        thumbnail_url: "",
        propertyRoi: {
            thumbnail_title: "",
            thumbnail_desc: "",
            content: {
                features: [],
                gallery: [],
                design_rendering: [],
            },
        },
    })

    // Separate state for thumbnail image
    const [thumbnailImage, setThumbnailImage] = useState<string>("")

    // Separate state for gallery images
    const [galleryImages, setGalleryImages] = useState<string[]>([])

    // Separate state for gallery images
    const [designRenderingImages, setDesignRenderingImages] = useState<string[]>([])

    // File tracking state - add after existing state declarations
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [galleryFiles, setGalleryFiles] = useState<File[]>([])
    const [designRenderingFiles, setDesignRenderingFiles] = useState<File[]>([])
    const [removedGalleryUrls, setRemovedGalleryUrls] = useState<string[]>([])
    const [removedDesignRenderingUrls, setRemovedDesignRenderingUrls] = useState<string[]>([])

    // Drag and drop state
    const [draggedIndexGallery, setDraggedIndexGallery] = useState<number | null>(null)
    const [dragOverIndexGallery, setDragOverIndexGallery] = useState<number | null>(null)
    const [draggedIndexDesign, setDraggedIndexDesign] = useState<number | null>(null)
    const [dragOverIndexDesign, setDragOverIndexDesign] = useState<number | null>(null)
    const dragCounterGallery = useRef(0)
    const dragCounterDesign = useRef(0)

    const iconMap = {
        shield: Shield,
        star: Star,
        gift: Gift,
        check: Check,
    }

    const colorMap = {
        blue: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
        amber: { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-200" },
        emerald: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" },
    }

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
        })
    }

    useEffect(() => {
        if (propertyDetail) {
            setProperty(propertyDetail)
            // Set thumbnail image from property data
            setThumbnailImage(propertyDetail.thumbnail_url || "")
            // Set gallery images from property ROI content
            const galleryUrls = propertyDetail.propertyRoi?.content?.gallery?.map((item) => item.url || "") || []
            setGalleryImages(galleryUrls.filter((url) => url !== ""))
            // Set design rendering images from property ROI content
            const designRenderingUrls = propertyDetail.propertyRoi?.content?.design_rendering?.map((item) => item.url || "") || []
            setDesignRenderingImages(designRenderingUrls.filter((url) => url !== ""))
            KTModal.init()
        }
    }, [propertyDetail])

    const handleBack = () => {
        navigate(LOCAL_PATH_PREFIX + "properties/" + propertyId)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setProperty((prevProperty) => ({
            ...prevProperty,
            [name]: value,
        }))
    }

    const handleChangeRoiModal = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setProperty((prevProperty) => ({
            ...prevProperty,
            propertyRoi: {
                ...prevProperty.propertyRoi,
                [name]: value,
            },
        }))
    }

    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const newImageUrl = URL.createObjectURL(file)
            setThumbnailImage(newImageUrl)
            setThumbnailFile(file) // Track the actual file
            // Update property state
            setProperty((prev) => ({
                ...prev,
                thumbnail_url: newImageUrl,
            }))
        }
    }

    const handleThumbnailRemove = () => {
        setThumbnailImage("")
        setThumbnailFile(null) // Clear the file
        setProperty((prev) => ({
            ...prev,
            thumbnail_url: "",
        }))
    }

    const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const newImageUrl = URL.createObjectURL(file)
            const updatedGallery = [...galleryImages, newImageUrl]
            const updatedFiles = [...galleryFiles, file] // Track the actual file

            setGalleryImages(updatedGallery)
            setGalleryFiles(updatedFiles)
            updatePropertyGallery(updatedGallery)
        }
    }

    const handleDesignRenderingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const newImageUrl = URL.createObjectURL(file)
            const updatedGallery = [...designRenderingImages, newImageUrl]
            const updatedFiles = [...designRenderingFiles, file] // Track the actual file

            setDesignRenderingImages(updatedGallery)
            setDesignRenderingFiles(updatedFiles)
            updateDesignRendering(updatedGallery)
        }
    }

    const handleGalleryImageRemove = (index: number) => {
        const imageToRemove = galleryImages[index]
        const updatedGallery = galleryImages.filter((_, i) => i !== index)

        // If it's an existing URL (not a blob URL), add to removed list
        if (!isBlobUrl(imageToRemove)) {
            setRemovedGalleryUrls((prev) => [...prev, imageToRemove])
        }

        // Remove from files array if it exists
        const updatedFiles = galleryFiles.filter((_, i) => i !== index)

        setGalleryImages(updatedGallery)
        setGalleryFiles(updatedFiles)
        updatePropertyGallery(updatedGallery)
    }

    const handleDesignRenderingRemove = (index: number) => {
        const imageToRemove = designRenderingImages[index]
        const updatedGallery = designRenderingImages.filter((_, i) => i !== index)

        // If it's an existing URL (not a blob URL), add to removed list
        if (!isBlobUrl(imageToRemove)) {
            setRemovedDesignRenderingUrls((prev) => [...prev, imageToRemove])
        }

        // Remove from files array if it exists
        const updatedFiles = designRenderingFiles.filter((_, i) => i !== index)

        setDesignRenderingImages(updatedGallery)
        setDesignRenderingFiles(updatedFiles)
        updateDesignRendering(updatedGallery)
    }

    const addGalleryImageByUrl = () => {
        const newImageUrl = prompt("Enter image URL:")
        if (newImageUrl && newImageUrl.trim()) {
            const updatedGallery = [...galleryImages, newImageUrl.trim()]
            setGalleryImages(updatedGallery)
            updatePropertyGallery(updatedGallery)
        }
    }

    const updatePropertyGallery = (updatedGallery: string[]) => {
        setProperty((prev) => ({
            ...prev,
            propertyRoi: {
                ...prev.propertyRoi,
                content: {
                    ...prev.propertyRoi?.content,
                    gallery: updatedGallery.map((url) => ({ url })),
                },
            },
        }))
    }

    const updateDesignRendering = (updatedGallery: string[]) => {
        setProperty((prev) => ({
            ...prev,
            propertyRoi: {
                ...prev.propertyRoi,
                content: {
                    ...prev.propertyRoi?.content,
                    design_rendering: updatedGallery.map((url) => ({ url })),
                },
            },
        }))
    }

    // Drag and drop handlers
    const handleDragStartGallery = (e: React.DragEvent, index: number) => {
        setDraggedIndexGallery(index)
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/html", "")
    }

    const handleDragEndGallery = () => {
        setDraggedIndexGallery(null)
        setDragOverIndexGallery(null)
        dragCounterGallery.current = 0
    }

    const handleDragOverGallery = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const handleDragEnterGallery = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        dragCounterGallery.current++
        setDragOverIndexGallery(index)
    }

    const handleDragLeaveGallery = (e: React.DragEvent) => {
        dragCounterGallery.current--
        if (dragCounterGallery.current === 0) {
            setDragOverIndexGallery(null)
        }
    }

    const handleDropGallery = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault()
        dragCounterGallery.current = 0

        if (draggedIndexGallery === null || draggedIndexGallery === dropIndex) {
            setDraggedIndexGallery(null)
            setDragOverIndexGallery(null)
            return
        }

        const newGalleryImages = [...galleryImages]
        const newGalleryFiles = [...galleryFiles]

        const draggedImage = newGalleryImages[draggedIndexGallery]
        const draggedFile = newGalleryFiles[draggedIndexGallery]

        newGalleryImages.splice(draggedIndexGallery, 1)
        if (draggedFile) {
            newGalleryFiles.splice(draggedIndexGallery, 1)
        }

        const insertIndex = draggedIndexGallery < dropIndex ? dropIndex - 1 : dropIndex
        newGalleryImages.splice(insertIndex, 0, draggedImage)
        if (draggedFile) {
            newGalleryFiles.splice(insertIndex, 0, draggedFile)
        }

        setGalleryImages(newGalleryImages)
        setGalleryFiles(newGalleryFiles)
        updatePropertyGallery(newGalleryImages)
        setDraggedIndexGallery(null)
        setDragOverIndexGallery(null)
    }

    // Drag and drop handlers for Design Rendering Section
    const handleDragStartDesign = (e: React.DragEvent, index: number) => {
        setDraggedIndexDesign(index)
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/html", "")
    }

    const handleDragEndDesign = () => {
        setDraggedIndexDesign(null)
        setDragOverIndexDesign(null)
        dragCounterDesign.current = 0
    }

    const handleDragOverDesign = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const handleDragEnterDesign = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        dragCounterDesign.current++
        setDragOverIndexDesign(index)
    }

    const handleDragLeaveDesign = (e: React.DragEvent) => {
        dragCounterDesign.current--
        if (dragCounterDesign.current === 0) {
            setDragOverIndexDesign(null)
        }
    }

    const handleDropDesign = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault()
        dragCounterDesign.current = 0

        if (draggedIndexDesign === null || draggedIndexDesign === dropIndex) {
            setDraggedIndexDesign(null)
            setDragOverIndexDesign(null)
            return
        }

        const newDesignImages = [...designRenderingImages]
        const newDesignFiles = [...designRenderingFiles]

        const draggedImage = newDesignImages[draggedIndexDesign]
        const draggedFile = newDesignFiles[draggedIndexDesign]

        newDesignImages.splice(draggedIndexDesign, 1)
        if (draggedFile) {
            newDesignFiles.splice(draggedIndexDesign, 1)
        }

        const insertIndex = draggedIndexDesign < dropIndex ? dropIndex - 1 : dropIndex
        newDesignImages.splice(insertIndex, 0, draggedImage)
        if (draggedFile) {
            newDesignFiles.splice(insertIndex, 0, draggedFile)
        }

        setDesignRenderingImages(newDesignImages)
        setDesignRenderingFiles(newDesignFiles)
        updateDesignRendering(newDesignImages)
        setDraggedIndexDesign(null)
        setDragOverIndexDesign(null)
    }

    const updateFeature = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target
        setProperty((prevProperty) => ({
            ...prevProperty,
            propertyRoi: {
                ...prevProperty.propertyRoi,
                content: {
                    ...prevProperty.propertyRoi?.content,
                    features: (prevProperty.propertyRoi?.content?.features || []).map((feature, i) =>
                        i === index ? { ...feature, [name]: value } : feature,
                    ),
                },
            },
        }))
    }

    const removeFeature = (index: number) => {
        setProperty((prevProperty) => ({
            ...prevProperty,
            propertyRoi: {
                ...prevProperty.propertyRoi,
                content: {
                    ...prevProperty.propertyRoi?.content,
                    features: (prevProperty.propertyRoi?.content?.features || []).filter((_, i) => i !== index),
                },
            },
        }))
    }

    const addFeature = () => {
        const newFeature: ROICardFeature = {
            icon: "star",
            title: "New Feature",
            desc: "Feature description",
            color: "blue",
        }

        setProperty((prevProperty) => ({
            ...prevProperty,
            propertyRoi: {
                ...prevProperty.propertyRoi,
                content: {
                    ...prevProperty.propertyRoi?.content,
                    features: [...(prevProperty.propertyRoi?.content?.features || []), newFeature],
                },
            },
        }))
    }

    // Add loading state for save operation
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Prepare files object
            const files: { thumbnail?: File; galleryImages?: File[], designRenderingImages?: File[] } = {}

            if (thumbnailFile) {
                files.thumbnail = thumbnailFile
            }

            if (galleryFiles.length > 0) {
                files.galleryImages = galleryFiles
            }

            if (designRenderingFiles.length > 0) {
                files.designRenderingImages = designRenderingFiles
            }

            // Prepare property data with removed gallery URLs
            const propertyDataWithRemovals = {
                ...property,
                removed_gallery_urls: removedGalleryUrls,
                removed_design_rendering_urls: removedDesignRenderingUrls,
            }

            // console.log(propertyId, propertyDataWithRemovals, files);


            // Use the new API function that handles files
            const response = await updatePropertyWithFiles(propertyId, propertyDataWithRemovals, files)

            if (response?.success) {
                notify("success", "Property configuration saved successfully!")

                // Reset file tracking after successful save
                setThumbnailFile(null)
                setGalleryFiles([])
                setRemovedGalleryUrls([])

                // Update property with returned data if available
                if (response.data) {
                    setProperty({
                        ...response.data,
                        propertyRoi: response.data.property_roi,
                    })
                    setThumbnailImage(response.data.thumbnail_url || "")
                    const galleryUrls = response.data.property_roi?.content?.gallery?.map((item: any) => item.url || "") || []
                    setGalleryImages(galleryUrls.filter((url: string) => url !== ""))
                    const designRenderingUrls = response.data.property_roi?.content?.design_rendering?.map((item: any) => item.url || "") || []
                    setDesignRenderingImages(designRenderingUrls.filter((url: string) => url !== ""))
                }
            }
        } catch (error) {
            console.error("Error saving property configuration:", error)
            notify("error", "Failed to save property configuration")
        } finally {
            setIsSaving(false)
        }
    }

    // Helper function to check if URL is a blob URL (temporary)
    const isBlobUrl = (url: string) => url.startsWith("blob:")

    // Helper function to get file size in readable format
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        )

    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-red-600">Error: {error}</div>
            </div>
        )

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
                <div className="px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                            onClick={handleBack}
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Property Editor</h1>
                            <p className="text-sm text-gray-600">Customize property information and ROI Program Modal</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            data-modal-toggle="#roi-program-modal"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                        >
                            <Eye className="w-4 h-4" />
                            Preview ROI
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Left Section - Property Information */}
                <div className="px-4 py-6 max-w-4xl mx-auto flex-1">
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Property Information
                        </h2>
                    </div>

                    {/* Property Thumbnail */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Property Thumbnail
                        </h2>

                        <div className="thumbnail-section p-4 bg-gray-50 rounded-xl">
                            {thumbnailImage ? (
                                <div className="relative group w-fit mx-auto">
                                    <img
                                        src={thumbnailImage || "/placeholder.svg"}
                                        alt="Property Thumbnail"
                                        className="max-w-full max-h-96 object-cover rounded-lg border-2 border-blue-500 shadow-md transition-transform duration-200 group-hover:scale-105"
                                    />
                                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={handleThumbnailRemove}
                                            className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                            title="Remove Thumbnail"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <label
                                            className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 cursor-pointer transition-colors"
                                            title="Change Thumbnail"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-64 h-40 mx-auto flex items-center justify-center bg-gray-200 rounded-lg border-2 border-dashed border-gray-400 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
                                    <label className="flex flex-col items-center justify-center cursor-pointer p-4">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-gray-500 text-sm text-center">Upload Property Thumbnail</span>
                                        <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Property Information */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Edit3 className="w-5 h-5" />
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Property Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={property?.name || ""}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={property?.address || ""}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                                <input
                                    type="text"
                                    name="street"
                                    value={property?.street || ""}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={property?.city || ""}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                                <input
                                    type="text"
                                    name="postcode"
                                    value={property?.postcode || ""}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={property?.state || ""}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - ROI Program Modal */}
                <div className="px-4 py-6 max-w-4xl mx-auto flex-1">
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <SquareIcon className="w-5 h-5" />
                            ROI Program Modal
                        </h2>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            Owner View Settings
                        </h2>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                Allow Owner to view ROI Program Detail
                            </label>
                            <label className="switch">
                                <input
                                    name="view_enabled"
                                    type="checkbox"
                                    checked={!!property?.propertyRoi?.view_enabled}
                                    onChange={() => {
                                        setProperty((prevProperty) => ({
                                            ...prevProperty,
                                            propertyRoi: {
                                                ...prevProperty.propertyRoi,
                                                view_enabled: !prevProperty.propertyRoi?.view_enabled,
                                            },
                                        }))
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* ROI Modal Information */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Edit2 className="w-5 h-5" />
                            ROI Program Modal Thumbnail
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Title</label>
                                <input
                                    type="text"
                                    name="thumbnail_title"
                                    value={property?.propertyRoi?.thumbnail_title || ""}
                                    onChange={handleChangeRoiModal}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Description</label>
                                <input
                                    type="text"
                                    name="thumbnail_desc"
                                    value={property?.propertyRoi?.thumbnail_desc || ""}
                                    onChange={handleChangeRoiModal}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Feature Cards */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Star className="w-5 h-5" />
                                Feature Cards
                            </h2>
                            <button
                                onClick={addFeature}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                Add Feature
                            </button>
                        </div>

                        <div className="space-y-4">
                            {property?.propertyRoi?.content?.features?.length > 0 ? (
                                property.propertyRoi.content.features.map((feature, index) => {
                                    const IconComponent = iconMap[feature.icon || "star"]
                                    const colors = colorMap[feature.color || "blue"]
                                    const title = feature.title
                                    const description = feature.desc

                                    return (
                                        <div key={index} className="bg-white/70 border border-gray-200 rounded-2xl p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                                                    <IconComponent className={`w-5 h-5 ${colors.text}`} />
                                                </div>
                                                <button
                                                    onClick={() => removeFeature(index)}
                                                    className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors duration-200"
                                                >
                                                    <X className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                                                    <select
                                                        name="icon"
                                                        value={feature.icon || "star"}
                                                        onChange={(e) => updateFeature(index, e)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="shield">Shield</option>
                                                        <option value="star">Star</option>
                                                        <option value="gift">Gift</option>
                                                        <option value="check">Check</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                                                    <select
                                                        name="color"
                                                        value={feature.color || "blue"}
                                                        onChange={(e) => updateFeature(index, e)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="blue">Blue</option>
                                                        <option value="amber">Amber</option>
                                                        <option value="emerald">Emerald</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                                    <input
                                                        name="title"
                                                        type="text"
                                                        value={title}
                                                        onChange={(e) => updateFeature(index, e)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                                    <textarea
                                                        name="desc"
                                                        value={description}
                                                        onChange={(e) => updateFeature(index, e)}
                                                        rows={2}
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center text-gray-500 py-6">
                                    No features found. Click "Add Feature" to get started.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rendering Strategy */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <GalleryThumbnailsIcon className="w-5 h-5" />
                                Rendering Strategy Section
                                {galleryImages.length > 0 && (
                                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                                        {galleryImages.length} {galleryImages.length === 1 ? "image" : "images"}
                                    </span>
                                )}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={addGalleryImageByUrl}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 text-sm"
                                >
                                    <Link className="w-4 h-4" />
                                    Add URL
                                </button>
                                <label className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 cursor-pointer text-sm">
                                    <Camera className="w-4 h-4" />
                                    Upload
                                    <input type="file" accept="image/*" onChange={handleGalleryImageUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {galleryImages.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <GalleryThumbnailsIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No gallery images yet</h3>
                                <p className="text-gray-500 mb-6">Add images to showcase your property in the ROI modal</p>
                                <div className="flex justify-center gap-3">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 cursor-pointer">
                                        <Upload className="w-4 h-4" />
                                        Upload Images
                                        <input type="file" accept="image/*" onChange={handleGalleryImageUpload} className="hidden" />
                                    </label>
                                    <button
                                        onClick={addGalleryImageByUrl}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                    >
                                        <Link className="w-4 h-4" />
                                        Add by URL
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <GripVertical className="w-4 h-4" />
                                        <span className="text-sm font-medium">Drag and drop to reorder images</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {galleryImages.map((image, index) => (
                                        <div
                                            key={`${image}-${index}`}
                                            draggable
                                            onDragStart={(e) => handleDragStartGallery(e, index)}
                                            onDragEnd={handleDragEndGallery}
                                            onDragOver={handleDragOverGallery}
                                            onDragEnter={(e) => handleDragEnterGallery(e, index)}
                                            onDragLeave={handleDragLeaveGallery}
                                            onDrop={(e) => handleDropGallery(e, index)}
                                            className={`
                    relative group cursor-move transition-all duration-200
                    ${draggedIndexGallery === index ? "opacity-50 scale-95 rotate-2" : ""}
                    ${dragOverIndexGallery === index && draggedIndexGallery !== index ? "scale-105 shadow-lg ring-2 ring-blue-400" : ""}
                    ${draggedIndexGallery !== null && draggedIndexGallery !== index ? "opacity-75" : ""}
                `}
                                        >
                                            <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-square">
                                                <img
                                                    src={image || "/placeholder.svg"}
                                                    alt={`Gallery ${index + 1}`}
                                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                                    draggable={false}
                                                />
                                                <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <GripVertical className="w-3 h-3 text-white" />
                                                </div>
                                                <div className="absolute bottom-2 left-2 w-6 h-6 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-medium">{index + 1}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleGalleryImageRemove(index)}
                                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                                                    title="Remove image"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                {draggedIndexGallery === index && (
                                                    <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                        <div className="text-blue-700 font-medium text-sm">Moving...</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-500 mb-3">
                                        Images will appear in this order in the ROI modal gallery
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 cursor-pointer">
                                            <Plus className="w-4 h-4" />
                                            Add More Images
                                            <input type="file" accept="image/*" onChange={handleGalleryImageUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Design & Rendering */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <GalleryThumbnailsIcon className="w-5 h-5" />
                                Design & Rendering Section
                                {designRenderingImages.length > 0 && (
                                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                                        {designRenderingImages.length} {designRenderingImages.length === 1 ? "image" : "images"}
                                    </span>
                                )}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={addGalleryImageByUrl}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 text-sm"
                                >
                                    <Link className="w-4 h-4" />
                                    Add URL
                                </button>
                                <label className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 cursor-pointer text-sm">
                                    <Camera className="w-4 h-4" />
                                    Upload
                                    <input type="file" accept="image/*" onChange={handleDesignRenderingImageUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {designRenderingImages.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <GalleryThumbnailsIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No gallery images yet</h3>
                                <p className="text-gray-500 mb-6">Add images to showcase your property in the ROI modal</p>
                                <div className="flex justify-center gap-3">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 cursor-pointer">
                                        <Upload className="w-4 h-4" />
                                        Upload Images
                                        <input type="file" accept="image/*" onChange={handleDesignRenderingImageUpload} className="hidden" />
                                    </label>
                                    <button
                                        onClick={addGalleryImageByUrl}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                    >
                                        <Link className="w-4 h-4" />
                                        Add by URL
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <GripVertical className="w-4 h-4" />
                                        <span className="text-sm font-medium">Drag and drop to reorder images</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {designRenderingImages.map((image, index) => (
                                        <div
                                            key={`${image}-${index}`}
                                            draggable
                                            onDragStart={(e) => handleDragStartDesign(e, index)}
                                            onDragEnd={handleDragEndDesign}
                                            onDragOver={handleDragOverDesign}
                                            onDragEnter={(e) => handleDragEnterDesign(e, index)}
                                            onDragLeave={handleDragLeaveDesign}
                                            onDrop={(e) => handleDropDesign(e, index)}
                                            className={`
                    relative group cursor-move transition-all duration-200
                    ${draggedIndexDesign === index ? "opacity-50 scale-95 rotate-2" : ""}
                    ${dragOverIndexDesign === index && draggedIndexDesign !== index ? "scale-105 shadow-lg ring-2 ring-blue-400" : ""}
                    ${draggedIndexDesign !== null && draggedIndexDesign !== index ? "opacity-75" : ""}
                `}
                                        >
                                            <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-square">
                                                <img
                                                    src={image || "/placeholder.svg"}
                                                    alt={`Design Rendering ${index + 1}`}
                                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                                    draggable={false}
                                                />
                                                <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <GripVertical className="w-3 h-3 text-white" />
                                                </div>
                                                <div className="absolute bottom-2 left-2 w-6 h-6 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-medium">{index + 1}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDesignRenderingRemove(index)}
                                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                                                    title="Remove image"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                {draggedIndexDesign === index && (
                                                    <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                        <div className="text-blue-700 font-medium text-sm">Moving...</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-500 mb-3">
                                        Images will appear in this order in the ROI modal gallery
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 cursor-pointer">
                                            <Plus className="w-4 h-4" />
                                            Add More Images
                                            <input type="file" accept="image/*" onChange={handleDesignRenderingImageUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <PreviewROIProgramModal property={property} />
        </div>
    )
}

export default PropertyEdit
