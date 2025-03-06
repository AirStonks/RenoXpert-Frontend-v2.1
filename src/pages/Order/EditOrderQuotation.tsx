import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import { OwnerRegistrationForm, Package, Quotation } from "../../types";
import { Slide, toast } from "react-toastify";
import IncludeOrderQuotationPackageModal from "../../components/Modals/IncludeOrderQuotationPackageModal";
import IncludeQuotationProductModal from "../../components/Modals/IncludeQuotationProductModal";
import { fetchOrder, fetchRegistrationForm } from "../../services/api";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortablePackage } from "./components/SortablePackage"; // Adjust path as needed

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
        ? import.meta.env.VITE_STAGING_AWS_S3_URL
        : null;

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "others", label: "Others" },
];

function EditOrderQuotation() {
    const navigate = useNavigate();
    const { id, quoteId } = useParams<{ id: string; quoteId: string }>();
    const orderId = id ? parseInt(id, 10) : null;
    const quotationId = quoteId ? parseInt(quoteId, 10) : null;

    const qtyBtnRef = useRef(null);

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedPackages, setSelectedPackages] = useState<Package[]>([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedPackageId, setSelectedPackageId] = useState<number>();
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [formDetail, setFormDetail] = useState<OwnerRegistrationForm | null>(null);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const handleBackClick = () => {
        localStorage.removeItem("selected_quotation_packages");
        const orderData = localStorage.getItem("edit_order_data");

        if (orderData) {
            const orderObject = JSON.parse(orderData);
            orderObject.totalAmount = totalAmount;
            localStorage.setItem("e:edit_order_data", JSON.stringify(orderObject));
        }
        navigate("/orders/edit/" + orderId);
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

    const handleSubmit = async () => {
        try {
            const storedPackages = localStorage.getItem("selected_quotation_packages");
            const orderData = localStorage.getItem("edit_order_data");

            if (orderData) {
                const orderObject = JSON.parse(orderData);
                orderObject.totalAmount = totalAmount;
                localStorage.setItem("e:edit_order_data", JSON.stringify(orderObject));
            }

            localStorage.setItem("include_packages", storedPackages);

            notify("success", "Quotation Updated Successfully!");
            navigate("/orders/edit/" + orderId);
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.data || {};
                const formattedErrors = Object.keys(errors).reduce(
                    (acc, key) => {
                        acc[key] = errors[key].join(" ");
                        return acc;
                    },
                    {} as Record<string, string>
                );
                setValidationErrors(formattedErrors);
                notify("error", "Quotation edit unsuccessful. Check the errors below.");
            } else {
                console.error("Quotation edit failed:", error);
            }
        }
    };

    const openAddPackageModal = () => {
        const datatableEl = document.querySelector("#packages_table") as HTMLElement;
        if (datatableEl) {
            const datatable = (datatableEl as any).instance;
            if (datatable) {
                datatable.reload();
            }
        }
    };

    const openAddProductModal = (event) => {
        const id = event.currentTarget.getAttribute("data-id");
        const includePackages = localStorage.getItem("selected_quotation_packages");
        const packages = JSON.parse(includePackages);

        const selectedPackage = packages.find((pkg) => pkg.id === Number(id));

        if (selectedPackage) {
            const selectedProducts = selectedPackage.products.map((product) => ({
                id: product.id,
                name: product.name,
                quantity: product.pivot.quantity,
                price: product.price,
                description: product.description || "N/A",
            }));

            setSelectedProducts(selectedProducts);
            setSelectedPackageId(selectedPackage.id);

            localStorage.setItem("quotation:selected_package_id", JSON.stringify(selectedPackage.id));
            localStorage.setItem("include_quotation_pack_prods", JSON.stringify(selectedProducts));

            const datatableEl = document.querySelector("#products_table") as HTMLElement;
            if (datatableEl) {
                const datatable = (datatableEl as any).instance;
                if (datatable) {
                    datatable.reload();
                }
            }
        } else {
            console.log("Package not found");
        }
    };

    useEffect(() => {
        document.title = "Edit Quotation Order | RenoXpert";

        const includePackages = localStorage.getItem("include_packages");
        const orderData = localStorage.getItem("edit_order_data");

        handleSearchForm();
        handleSelectedQuotation();

        if (includePackages) {
            const updatedPackages = JSON.parse(includePackages).map((pkg) => ({
                ...pkg,
                quantity: pkg.quantity ?? 1,
            }));

            setSelectedPackages(updatedPackages);
            localStorage.setItem("selected_quotation_packages", JSON.stringify(updatedPackages));
            if (orderData) setTotalAmount(JSON.parse(orderData).totalAmount);
        } else if (selectedQuotation) {
            const packages = JSON.stringify(selectedQuotation.metadata);
            localStorage.setItem("include_packages", packages);
            setSelectedPackages(JSON.parse(packages));
            localStorage.setItem("selected_quotation_packages", packages);
            setTotalAmount(selectedQuotation.total_amount);
        }
    }, [selectedQuotation]);

    const handleSearchForm = async () => {
        try {
            const orderRes = await fetchOrder(Number(orderId));

            if (orderRes?.data?.form_id) {
                const response = await fetchRegistrationForm(orderRes?.data?.form_id);
                const registrationForm: OwnerRegistrationForm = response.data.data;

                if (registrationForm) {
                    setFormDetail(registrationForm);
                } else {
                    toast.error("Registration form not found");
                }
            }
        } catch (error) {
            console.error("Error fetching registration form:", error);
            toast.error("Failed to fetch registration form");
        }
    };

    const handleSelectedQuotation = async () => {
        try {
            const response = await fetchOrder(Number(orderId));

            if (response?.success) {
                const orderDetail = response.data;

                if (orderDetail.latest_quotation.quotation) {
                    setSelectedQuotation(orderDetail.latest_quotation.quotation);
                } else {
                    const pastQuotation: Quotation = {
                        id: orderDetail.latest_quotation.id,
                        name: orderDetail.latest_quotation.quotation_name,
                        description: orderDetail.latest_quotation.description,
                        total_amount: orderDetail.latest_quotation.total_amount,
                        valid_from: orderDetail.latest_quotation.from,
                        valid_until: orderDetail.latest_quotation.valid_until,
                        metadata: orderDetail.latest_quotation.metadata,
                    };
                    setSelectedQuotation(pastQuotation);
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const updateSelectedPackages = (packages) => {
        const updatedPackages = packages.map((prodPackage: Package) => {
            const packageTotalPrice = prodPackage.products.reduce(
                (sum, product) =>
                    sum +
                    product.provisioning.supply.retail_price * product.pivot.quantity +
                    product.provisioning.install.retail_price * product.pivot.quantity,
                0
            );

            let newTotalPrice = packageTotalPrice;

            prodPackage.products.forEach((product) => {
                if (!product.pivot.includeSupply) {
                    newTotalPrice -= product.provisioning.supply.excluded_price * product.pivot.quantity;
                }
                if (!product.pivot.includeInstall) {
                    newTotalPrice -= product.provisioning.install.excluded_price * product.pivot.quantity;
                }
            });

            return {
                ...prodPackage,
                total_price: newTotalPrice,
            };
        });

        setSelectedPackages(updatedPackages);
        const newTotalAmount = calculateTotalAmount(updatedPackages);
        setTotalAmount(newTotalAmount);
        updateLocalStorage(updatedPackages);
    };

    const updateLocalStorage = (packages) => {
        localStorage.setItem("selected_quotation_packages", JSON.stringify(packages));
    };

    const toggleProperty = (id: number, packId: number, property: "supply" | "install") => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.map((product) => {
                        if (product.id === id) {
                            const key = property === "install" ? "includeInstall" : "includeSupply";
                            const updatedPivot = {
                                ...product.pivot,
                                [key]: product.pivot ? !product.pivot[key] : true,
                            };
                            if (!updatedPivot.includeSupply && !updatedPivot.includeInstall) {
                                updatedPivot.quantity = 1;
                            }
                            return { ...product, pivot: updatedPivot };
                        }
                        return product;
                    });

                    const packageTotalPrice = updatedProducts.reduce(
                        (sum, product) =>
                            sum +
                            product.provisioning.supply.retail_price * product.pivot.quantity +
                            product.provisioning.install.retail_price * product.pivot.quantity,
                        0
                    );

                    let newTotalPrice = packageTotalPrice;
                    updatedProducts.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            newTotalPrice -= product.provisioning.supply.excluded_price * product.pivot.quantity;
                        }
                        if (!product.pivot.includeInstall) {
                            newTotalPrice -= product.provisioning.install.excluded_price * product.pivot.quantity;
                        }
                    });

                    return { ...prodPackage, products: updatedProducts, total_price: newTotalPrice };
                }
                return prodPackage;
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount);
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const adjustQuantity = (prodId: number, packId: number, action: "increase" | "decrease") => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.map((product) => {
                        if (product.id === prodId) {
                            if (
                                product.pivot.quantity === 1 &&
                                action === "increase" &&
                                !product.pivot.includeSupply &&
                                !product.pivot.includeInstall
                            ) {
                                return {
                                    ...product,
                                    pivot: { ...product.pivot, includeSupply: true, includeInstall: true },
                                };
                            }
                            if (!product.pivot.includeSupply && !product.pivot.includeInstall) {
                                return product;
                            }
                            if (action === "decrease" && product.pivot.quantity === 1) {
                                return {
                                    ...product,
                                    pivot: { ...product.pivot, includeSupply: false, includeInstall: false },
                                };
                            }
                            const newQty =
                                action === "increase"
                                    ? product.pivot.quantity + 1
                                    : Math.max(1, product.pivot.quantity - 1);
                            return { ...product, pivot: { ...product.pivot, quantity: newQty } };
                        }
                        return product;
                    });

                    const packageTotalPrice = updatedProducts.reduce(
                        (sum, product) =>
                            sum +
                            product.provisioning.supply.retail_price * product.pivot.quantity +
                            product.provisioning.install.retail_price * product.pivot.quantity,
                        0
                    );

                    let newTotalPrice = packageTotalPrice;
                    updatedProducts.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            newTotalPrice -= product.provisioning.supply.excluded_price * product.pivot.quantity;
                        }
                        if (!product.pivot.includeInstall) {
                            newTotalPrice -= product.provisioning.install.excluded_price * product.pivot.quantity;
                        }
                    });

                    return { ...prodPackage, products: updatedProducts, total_price: newTotalPrice };
                }
                return prodPackage;
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount);
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const adjustPackageQuantity = (packId: number, action: "increase" | "decrease") => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const newQuantity =
                        action === "increase" ? prodPackage.quantity + 1 : Math.max(1, prodPackage.quantity - 1);

                    let packageTotalPrice = prodPackage.products.reduce(
                        (sum, product) =>
                            sum +
                            product.provisioning.supply.retail_price * product.pivot.quantity +
                            product.provisioning.install.retail_price * product.pivot.quantity,
                        0
                    );

                    prodPackage.products.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            packageTotalPrice -= product.provisioning.supply.excluded_price * product.pivot.quantity;
                        }
                        if (!product.pivot.includeInstall) {
                            packageTotalPrice -= product.provisioning.install.excluded_price * product.pivot.quantity;
                        }
                    });

                    return { ...prodPackage, total_price: packageTotalPrice, quantity: newQuantity };
                }
                return prodPackage;
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount);
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const handleRemoveProduct = (packId: number, prodId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage: Package) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.filter((product) => product.id !== prodId);
                    const newTotalPrice = updatedProducts.reduce(
                        (sum, product) =>
                            sum +
                            product.provisioning.supply.retail_price * product.pivot.quantity +
                            product.provisioning.install.retail_price * product.pivot.quantity,
                        0
                    );
                    return { ...prodPackage, products: updatedProducts, total_price: newTotalPrice };
                }
                return prodPackage;
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount);
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const handleRemovePackage = (packId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.filter((prodPackage: Package) => prodPackage.id !== packId);
            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount);
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const calculateTotalAmount = (packages: Package[]) => {
        return packages.reduce((sum, pkg) => {
            sum +=
                pkg.products.reduce((prodSum, product) => {
                    if (!product.pivot.includeSupply) {
                        prodSum +=
                            product.provisioning.supply.retail_price * product.pivot.quantity -
                            product.provisioning.supply.excluded_price * product.pivot.quantity;
                    } else {
                        prodSum += product.provisioning.supply.retail_price * product.pivot.quantity;
                    }
                    if (!product.pivot.includeInstall) {
                        prodSum +=
                            product.provisioning.install.retail_price * product.pivot.quantity -
                            product.provisioning.install.excluded_price * product.pivot.quantity;
                    } else {
                        prodSum += product.provisioning.install.retail_price * product.pivot.quantity;
                    }
                    return prodSum;
                }, 0) * (pkg.quantity || 1);
            return sum;
        }, 0);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        if (active.id.toString().startsWith("package-") && over.id.toString().startsWith("package-")) {
            const oldIndex = selectedPackages.findIndex((pkg) => `package-${pkg.id}` === active.id);
            const newIndex = selectedPackages.findIndex((pkg) => `package-${pkg.id}` === over.id);
            const newPackages = arrayMove(selectedPackages, oldIndex, newIndex);
            setSelectedPackages(newPackages);
            updateLocalStorage(newPackages);
        } else if (active.id.toString().startsWith("product-") && over.id.toString().startsWith("product-")) {
            const activeParts = active.id.toString().split("-");
            const overParts = over.id.toString().split("-");
            const activePackId = parseInt(activeParts[2]);
            const overPackId = parseInt(overParts[2]);

            if (activePackId === overPackId) {
                setSelectedPackages((prevPackages) => {
                    const updatedPackages = prevPackages.map((pkg) => {
                        if (pkg.id === activePackId) {
                            const oldIndex = pkg.products.findIndex(
                                (prod) => `product-${prod.id}-${pkg.id}` === active.id
                            );
                            const newIndex = pkg.products.findIndex(
                                (prod) => `product-${prod.id}-${pkg.id}` === over.id
                            );
                            const newProducts = arrayMove(pkg.products, oldIndex, newIndex);
                            return { ...pkg, products: newProducts };
                        }
                        return pkg;
                    });
                    updateLocalStorage(updatedPackages);
                    return updatedPackages;
                });
            }
        }
    };

    if (!selectedQuotation) return <Loading />;

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className="text-gray-800 dark:text-gray-400" onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">Update Quotation</span>
                </div>
            </div>

            <div className="flex flex-col flex-wrap lg:mr-[400px] lg:px-6 mb-6">
                <div className="card mb-6">
                    <div className="card-body flex flex-col gap-4">
                        <span className="text-xl text-gray-900 font-semibold">
                            Quotation: {selectedQuotation.name}
                        </span>
                        <span className="text-xl text-gray-900 font-semibold">
                            Total Amount: RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="card-body">
                        <div className="flex justify-between items-center flex-wrap mb-2">
                            <h2 className="text-xl mb-4 font-semibold text-gray-900">Packages</h2>
                            <button
                                className="btn btn-outline btn-primary flex justify-center items-center mb-4"
                                data-modal-toggle="#include_package_modal"
                                onClick={openAddPackageModal}
                            >
                                <i className="ki-outline ki-plus-squared"></i>
                                Add Packages
                            </button>
                        </div>

                        <DndContext onDragEnd={handleDragEnd}>
                            <SortableContext
                                items={selectedPackages.map((pkg) => `package-${pkg.id}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-5 mb-4" data-accordion="true">
                                    {selectedPackages.map((prodPackage: Package) => (
                                        <SortablePackage
                                            key={prodPackage.id}
                                            prodPackage={prodPackage}
                                            categoryOptions={categoryOptions}
                                            adjustPackageQuantity={adjustPackageQuantity}
                                            handleRemovePackage={handleRemovePackage}
                                            openAddProductModal={openAddProductModal}
                                            toggleProperty={toggleProperty}
                                            adjustQuantity={adjustQuantity}
                                            handleRemoveProduct={handleRemoveProduct}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                <div className="flex justify-end gap-6">
                    <button className="btn btn-lg btn-light" onClick={handleBackClick}>
                        Cancel
                    </button>
                    <button className="btn btn-lg btn-primary" onClick={handleSubmit}>
                        Update
                    </button>
                </div>
            </div>

            <IncludeOrderQuotationPackageModal
                selectedPackages={selectedPackages}
                updateSelectedPackages={updateSelectedPackages}
            />

            <IncludeQuotationProductModal
                updateSelectedPackages={updateSelectedPackages}
                isFromOrderQuotation={true}
            />
        </>
    );
}

export default EditOrderQuotation;