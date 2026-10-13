import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormFeedback,
  FormGroup,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
  Table,
} from "reactstrap";
import Select, { SingleValue, StylesConfig } from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";

import {
  usePriceCodes,
  useItemPrices,
  useItemPriceMutation,
} from "../../../Components/Hooks/usePricing";
import { useStockItems } from "../../../Components/Hooks/useStockItems";
import { useCategories } from "../../../Components/Hooks/useCategory";
import { PriceCode } from "../../../types/pricing";
import { StockItem } from "../../../types/stockitem";
import { Category } from "../../../types/category";
import TablePagination from "../../TablePagination";

const CURRENCY = "KES";

interface PriceCodeOption {
  value: string;
  label: string;
  priceCode: PriceCode;
}

interface ItemPriceRow {
  itemId: string;
  priceCode: string;
  sellingPrice: number;
  stockItem?: StockItem;
}

const clampTwoLines: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const selectStyles: StylesConfig<PriceCodeOption, false> = {
  control: (base) => ({ ...base, minHeight: 31, fontSize: 12 }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  dropdownIndicator: (base) => ({ ...base, padding: 4 }),
  clearIndicator: (base) => ({ ...base, padding: 4 }),
  placeholder: (base) => ({ ...base, fontSize: 12 }),
  option: (base) => ({ ...base, fontSize: 12, padding: "6px 10px" }),
  menu: (base) => ({ ...base, zIndex: 5 }),
};

/* ------------------------------------------------------------------ */
/* Add / Edit Selling Price Modal                                     */
/* ------------------------------------------------------------------ */

interface ItemPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceCode: string;
  availableStockItems: StockItem[]; // stock items not yet assigned a price under this code
  lockedRow: ItemPriceRow | null; // set when editing an existing item price
}

const ItemPriceModal: React.FC<ItemPriceModalProps> = ({
  isOpen,
  onClose,
  priceCode,
  availableStockItems,
  lockedRow,
}) => {
  const { upsertItemPrice, isUpserting } = useItemPriceMutation();
  const [error, setError] = useState<string | null>(null);

  const initialValues = {
    itemId: lockedRow?.itemId ?? "",
    sellingPrice: lockedRow ? String(lockedRow.sellingPrice) : "",
  };

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      itemId: Yup.string().required("Select a stock item"),
      sellingPrice: Yup.number()
        .typeError("Enter a valid selling price")
        .min(0, "Price cannot be negative")
        .required("Selling price is required"),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        await upsertItemPrice({
          itemId: values.itemId,
          priceCode,
          sellingPrice: Number(values.sellingPrice),
        });
        onClose();
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to save item price.");
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      formik.resetForm({ values: initialValues });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lockedRow?.itemId]);

  const close = () => !isUpserting && onClose();

  const stockItemOptions = lockedRow
    ? []
    : availableStockItems.map((si) => ({
        value: si.itemId,
        text: `${si.itemCode} - ${si.description} (${si.stockUom})`,
      }));

  const lockedItemLabel =
    lockedRow && lockedRow.stockItem
      ? `${lockedRow.stockItem.itemCode} - ${lockedRow.stockItem.description}`
      : lockedRow?.itemId;

  return (
    <Modal isOpen={isOpen} toggle={close} centered scrollable fullscreen="sm" size="md" className="border-0">
      <ModalHeader className="bg-light p-3 border-bottom" toggle={close}>
        <div className="fs-14 fw-bold">{lockedRow ? "Edit Selling Price" : "Assign Price to Stock Item"}</div>
        <div className="text-muted fs-12 fw-normal text-truncate">Price Code Tier: {priceCode}</div>
      </ModalHeader>
      <Form onSubmit={formik.handleSubmit} className="d-flex flex-column overflow-hidden flex-grow-1">
        <ModalBody className="p-3 p-md-4 overflow-auto">
          {error && (
            <Alert color="danger" className="border-0 fs-12 py-2">
              <i className="ri-error-warning-line me-1 align-middle"></i>
              {error}
            </Alert>
          )}
          <Row className="g-3">
            <Col xs={12}>
              <FormGroup className="mb-0">
                <Label className="form-label fs-12 fw-semibold">
                  Stock Item <span className="text-danger">*</span>
                </Label>
                {lockedRow ? (
                  <Input
                    type="text"
                    bsSize="sm"
                    disabled
                    value={lockedItemLabel || ""}
                    className="font-monospace fs-12 bg-light"
                  />
                ) : (
                  <Input
                    type="select"
                    bsSize="sm"
                    {...formik.getFieldProps("itemId")}
                    invalid={!!(formik.touched.itemId && formik.errors.itemId)}
                  >
                    <option value="">Select stock item...</option>
                    {stockItemOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.text}
                      </option>
                    ))}
                  </Input>
                )}
                <FormFeedback>{formik.errors.itemId}</FormFeedback>
                {!lockedRow && (
                  <div className="form-text fs-11">
                    Only active stock items not yet priced under this code are listed.
                  </div>
                )}
              </FormGroup>
            </Col>

            <Col xs={12}>
              <FormGroup className="mb-0">
                <Label className="form-label fs-12 fw-semibold">
                  Selling Price <span className="text-danger">*</span>
                </Label>
                <InputGroup size="sm">
                  <InputGroupText>{CURRENCY}</InputGroupText>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    autoFocus={!!lockedRow}
                    {...formik.getFieldProps("sellingPrice")}
                    invalid={!!(formik.touched.sellingPrice && formik.errors.sellingPrice)}
                  />
                  <FormFeedback>{formik.errors.sellingPrice}</FormFeedback>
                </InputGroup>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="bg-light p-3 border-top">
          <Button color="light" size="sm" type="button" onClick={close} disabled={isUpserting}>
            Cancel
          </Button>
          <Button type="submit" color="primary" size="sm" disabled={isUpserting} className="px-3">
            {isUpserting ? <Spinner size="sm" /> : "Save Price"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */

const ItemPriceManagement: React.FC = () => {
  document.title = "Item Prices | Pricing";

  const [selectedPriceCode, setSelectedPriceCode] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; row: ItemPriceRow | null }>({
    open: false,
    row: null,
  });

  // Filter + pagination state (same pattern as StockItemManagement)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Debounce the search box
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: priceCodes = [], isLoading: priceCodesLoading } = usePriceCodes();
  const { data: stockItems = [], isLoading: stockItemsLoading } = useStockItems();
  const { data: categoryData } = useCategories("", true);

  const {
    data: itemPrices = [],
    isLoading: pricesLoading,
    isFetching,
    isError,
    refetch,
  } = useItemPrices(selectedPriceCode);

  const fmt = useMemo(
    () => new Intl.NumberFormat("en-KE", { style: "currency", currency: CURRENCY }),
    []
  );

  // Categories (extracted defensively, as in StockItemManagement)
  const categoriesList: Category[] = useMemo(() => {
    if (!categoryData) return [];
    if (Array.isArray(categoryData)) return categoryData;
    return (
      (categoryData as { categories?: Category[]; data?: Category[] }).categories ||
      (categoryData as { categories?: Category[]; data?: Category[] }).data ||
      []
    );
  }, [categoryData]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categoriesList.forEach((cat: any) => {
      const id = cat.categoryId;
      const name = cat.categoryName;
      if (id && name) map.set(id, name);
    });
    return map;
  }, [categoriesList]);

  const getCategoryName = useCallback(
    (item?: StockItem): string => {
      if (!item) return "";
      return (
        (item.categoryId ? categoryMap.get(item.categoryId) : "") ||
        item.categoryName ||
        item.category?.name ||
        ""
      );
    },
    [categoryMap]
  );

  // Map Price Codes to React Select options
  const priceCodeOptions = useMemo<PriceCodeOption[]>(
    () =>
      priceCodes.map((pc) => ({
        value: pc.priceCodeValue,
        label: `${pc.priceCodeValue} - ${pc.description}`,
        priceCode: pc,
      })),
    [priceCodes]
  );

  const selectedOption = useMemo(
    () => priceCodeOptions.find((o) => o.value === selectedPriceCode) ?? null,
    [priceCodeOptions, selectedPriceCode]
  );

  const activePriceCodeMeta = selectedOption?.priceCode;

  // Map stock items by ID for quick lookup
  const stockItemMap = useMemo(
    () => new Map(stockItems.map((si) => [si.itemId, si])),
    [stockItems]
  );

  // Combine item prices with stock item metadata
  const rows = useMemo<ItemPriceRow[]>(() => {
    return itemPrices
      .map((p) => ({
        itemId: p.itemId,
        priceCode: p.priceCode,
        sellingPrice: p.sellingPrice,
        stockItem: stockItemMap.get(p.itemId),
      }))
      .sort((a, b) => {
        const codeA = a.stockItem?.itemCode || "";
        const codeB = b.stockItem?.itemCode || "";
        return codeA.localeCompare(codeB);
      });
  }, [itemPrices, stockItemMap]);

  // Filter by category and by search term (code, description, category)
  const filteredRows = useMemo(() => {
    let list = rows;

    if (selectedCategoryId) {
      list = list.filter((r) => r.stockItem?.categoryId === selectedCategoryId);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter((r) => {
        const si = r.stockItem;
        return (
          si?.itemCode?.toLowerCase().includes(lowerSearch) ||
          si?.description?.toLowerCase().includes(lowerSearch) ||
          getCategoryName(si).toLowerCase().includes(lowerSearch)
        );
      });
    }

    return list;
  }, [rows, selectedCategoryId, searchTerm, getCategoryName]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  // Keep the page in range when data or filters shrink the list
  useEffect(() => {
    if (pageIndex > totalPages - 1) setPageIndex(Math.max(totalPages - 1, 0));
  }, [pageIndex, totalPages]);

  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    },
    previousPage: () => setPageIndex((prev) => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < totalPages - 1,
    getPageCount: () => totalPages,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredRows }),
  };

  const hasActiveFilters = !!selectedCategoryId || !!searchTerm;
  const clearFilters = () => {
    setSelectedCategoryId("");
    setSearchInput("");
    setSearchTerm("");
    setPageIndex(0);
  };

  // Find active stock items not yet assigned to the selected price code
  const availableStockItems = useMemo(() => {
    const assignedIds = new Set(itemPrices.map((p) => p.itemId));
    return stockItems.filter((si) => si.isActive && !assignedIds.has(si.itemId));
  }, [stockItems, itemPrices]);

  const openAdd = () => setModal({ open: true, row: null });
  const openEdit = (row: ItemPriceRow) => setModal({ open: true, row });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const dataReady = !!selectedPriceCode && !isError && !pricesLoading && !stockItemsLoading;

  return (
    <React.Fragment>
      <Container fluid className="px-2 px-md-3">
        <Row>
          <Col lg={12}>
            <Card className="shadow-sm border-0">
              <CardHeader className="border-bottom py-3 px-3 bg-white">
                <Row className="g-2 align-items-center justify-content-between">
                  <Col xl={5} lg={6} md={7} sm={12}>
                    <Select<PriceCodeOption, false>
                      inputId="price-code-select"
                      aria-label="Price Code"
                      styles={selectStyles}
                      options={priceCodeOptions}
                      value={selectedOption}
                      isLoading={priceCodesLoading}
                      isClearable
                      placeholder="Select price code tier (e.g. A, B, VIP)..."
                      noOptionsMessage={() => "No price codes found"}
                      onChange={(opt: SingleValue<PriceCodeOption>) => {
                        setSelectedPriceCode(opt?.value ?? null);
                        setPageIndex(0);
                      }}
                      formatOptionLabel={(o) => (
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="text-truncate" style={{ minWidth: 0 }}>
                            <span className="fw-semibold font-monospace text-primary">
                              {o.priceCode.priceCodeValue}
                            </span>
                            <span className="text-muted ms-2">{o.priceCode.description}</span>
                          </div>
                          {o.priceCode.isDefault && (
                            <Badge color="primary-subtle" className="text-primary fs-10 flex-shrink-0">
                              Default
                            </Badge>
                          )}
                        </div>
                      )}
                    />
                  </Col>

                  <Col xl={5} lg={6} md={5} xs={12} className="d-grid d-md-block text-md-end">
                    <Button
                      color="primary"
                      size="sm"
                      className="fs-12 fw-medium px-3 text-nowrap"
                      onClick={openAdd}
                      disabled={!selectedPriceCode || availableStockItems.length === 0}
                      title={
                        selectedPriceCode && availableStockItems.length === 0
                          ? "All active stock items are already priced under this code"
                          : undefined
                      }
                    >
                      <i className="ri-add-line align-bottom me-1"></i> Assign Price to Item
                    </Button>
                  </Col>
                </Row>
              </CardHeader>

              {/* Price Code Summary Banner */}
              {activePriceCodeMeta && (
                <div className="px-3 py-2 bg-light border-bottom">
                  <div className="d-flex flex-wrap align-items-center column-gap-3 row-gap-1 fs-12">
                    <span>
                      <span className="text-muted me-1">Price Code:</span>
                      <span className="fw-semibold font-monospace text-primary">
                        {activePriceCodeMeta.priceCodeValue}
                      </span>
                    </span>
                    <span>
                      <span className="text-muted me-1">Description:</span>
                      <span className="fw-medium text-break">{activePriceCodeMeta.description}</span>
                    </span>
                    {activePriceCodeMeta.isDefault && (
                      <Badge color="primary-subtle" className="text-primary fs-10">
                        Default Tier
                      </Badge>
                    )}
                    <Badge
                      color={activePriceCodeMeta.isActive ? "success-subtle" : "danger-subtle"}
                      className={`text-${activePriceCodeMeta.isActive ? "success" : "danger"} fs-10`}
                    >
                      {activePriceCodeMeta.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Filters: category + search */}
              {selectedPriceCode && !isError && (
                <div className="px-3 py-2 border-bottom bg-white">
                  <Row className="g-2 align-items-center">
                    <Col xl={3} lg={4} md={5} sm={6} xs={12}>
                      <Input
                        type="select"
                        bsSize="sm"
                        className="form-select form-select-sm fs-12"
                        aria-label="Filter by category"
                        value={selectedCategoryId}
                        onChange={(e) => {
                          setSelectedCategoryId(e.target.value);
                          setPageIndex(0);
                        }}
                      >
                        <option value="">All Categories</option>
                        {categoriesList.map((cat: any) => {
                          const id = cat.categoryId || cat.id;
                          const name = cat.categoryName || cat.name || cat.description;
                          return (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          );
                        })}
                      </Input>
                    </Col>

                    <Col xl={4} lg={5} md={7} sm={6} xs={12}>
                      <div className="search-box position-relative">
                        <Input
                          type="text"
                          className="form-control form-control-sm fs-12 ps-4"
                          aria-label="Filter stock items"
                          placeholder="Filter code, item, or category..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                      </div>
                    </Col>

                    {hasActiveFilters && (
                      <Col xs={12} sm="auto">
                        <Button color="link" size="sm" className="fs-12 text-decoration-none p-0" onClick={clearFilters}>
                          <i className="ri-close-line align-bottom me-1"></i>Clear filters
                        </Button>
                      </Col>
                    )}
                  </Row>
                </div>
              )}

              <CardBody className="p-0">
                {/* No Price Code Selected State */}
                {!selectedPriceCode && (
                  <div className="text-center py-5 px-3">
                    <i className="ri-price-tag-3-line display-6 text-muted opacity-50"></i>
                    <h6 className="mt-3 mb-1 fw-bold text-dark">Select a Price Code Tier</h6>
                    <p className="text-muted fs-12 mb-0">
                      Choose a price code above to view and manage selling prices assigned across all stock items.
                    </p>
                  </div>
                )}

                {selectedPriceCode && isError && (
                  <Alert
                    color="danger"
                    className="m-3 border-0 d-flex flex-wrap align-items-center justify-content-between gap-2 fs-12"
                  >
                    <span>
                      <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
                      Could not retrieve stock item prices for this price code.
                    </span>
                    <Button color="danger" size="sm" outline onClick={() => refetch()}>
                      Try again
                    </Button>
                  </Alert>
                )}

                {selectedPriceCode && !isError && (pricesLoading || stockItemsLoading) && (
                  <div className="text-center py-5">
                    <Spinner size="sm" color="primary" className="me-2" />
                    <span className="text-muted fs-12">Loading item prices...</span>
                  </div>
                )}

                {/* Nothing priced under this code yet */}
                {dataReady && rows.length === 0 && (
                  <div className="text-center py-5 px-3">
                    <i className="ri-inbox-archive-line display-6 text-muted opacity-50"></i>
                    <h6 className="mt-3 mb-1 fw-bold text-dark">No Item Prices Assigned</h6>
                    <p className="text-muted fs-12 mb-3">
                      {availableStockItems.length > 0
                        ? "Assign a stock item to establish a custom selling price under this tier."
                        : "All available stock items have already been assigned prices."}
                    </p>
                    {availableStockItems.length > 0 && (
                      <Button color="primary" size="sm" className="fs-12 fw-medium" onClick={openAdd}>
                        <i className="ri-add-line align-bottom me-1"></i> Assign Price to Item
                      </Button>
                    )}
                  </div>
                )}

                {/* Items are priced, but filters hide all of them */}
                {dataReady && rows.length > 0 && filteredRows.length === 0 && (
                  <div className="text-center py-5 px-3">
                    <i className="ri-filter-off-line display-6 text-muted opacity-50"></i>
                    <h6 className="mt-3 mb-1 fw-bold text-dark">No Matching Stock Items</h6>
                    <p className="text-muted fs-12 mb-3">No priced stock items match your filters.</p>
                    <Button color="light" size="sm" className="fs-12 fw-medium" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                )}

                {/* Table */}
                {dataReady && filteredRows.length > 0 && (
                  <div className="table-responsive d-none d-md-block">
                    <Table hover className="align-middle mb-0 custom-datatable">
                      <thead className="table-light text-muted text-uppercase fs-11">
                        <tr>
                          <th className="ps-3 py-2 text-nowrap">Item Code</th>
                          <th className="py-2">Description</th>
                          <th className="d-none d-lg-table-cell py-2 text-nowrap">Category</th>
                          <th className="py-2 text-center">UoM</th>
                          <th className="py-2 text-end text-nowrap">Selling Price</th>
                          <th className="py-2 pe-3 text-end text-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="fs-12">
                        {paginatedRows.map((r) => {
                          const categoryName = getCategoryName(r.stockItem);
                          return (
                            <tr key={r.itemId} className="align-middle">
                              <td className="py-2 ps-3 text-nowrap">
                                <span className="fw-semibold text-dark font-monospace fs-12">
                                  {r.stockItem?.itemCode || "N/A"}
                                </span>
                              </td>
                              <td className="py-2 text-dark fw-medium">
                                <div
                                  className="text-truncate"
                                  style={{ maxWidth: "min(320px, 28vw)" }}
                                  title={r.stockItem?.description}
                                >
                                  {r.stockItem?.description || "Unknown Item"}
                                </div>
                              </td>
                              <td className="d-none d-lg-table-cell py-2 text-nowrap">
                                {categoryName ? (
                                  <span className="badge bg-info-subtle text-info border fs-10 fw-medium px-1.5 py-0.5">
                                    {categoryName}
                                  </span>
                                ) : (
                                  <span className="text-muted fs-11">-</span>
                                )}
                              </td>
                              <td className="py-2 text-center">
                                <Badge color="light" className="text-dark border font-monospace fs-11">
                                  {r.stockItem?.stockUom || "PCS"}
                                </Badge>
                              </td>
                              <td className="py-2 text-end text-nowrap fw-bold text-primary font-monospace">
                                {fmt.format(r.sellingPrice)}
                              </td>
                              <td className="py-2 pe-3 text-end">
                                <Button
                                  color="soft-primary"
                                  size="sm"
                                  className="btn-icon"
                                  onClick={() => openEdit(r)}
                                  aria-label={`Edit price for ${r.stockItem?.itemCode}`}
                                >
                                  <i className="ri-pencil-fill"></i>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Mobile: one card per priced item */}
                {dataReady && filteredRows.length > 0 && (
                  <ul className="list-group list-group-flush d-md-none">
                    {paginatedRows.map((r) => {
                      const categoryName = getCategoryName(r.stockItem);
                      return (
                        <li key={r.itemId} className="list-group-item px-3 py-3">
                          <div className="d-flex align-items-start justify-content-between gap-2">
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                              <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
                                <span className="fw-semibold text-dark font-monospace fs-12">
                                  {r.stockItem?.itemCode || "N/A"}
                                </span>
                                <Badge color="light" className="text-dark border font-monospace fs-10">
                                  {r.stockItem?.stockUom || "PCS"}
                                </Badge>
                                {categoryName && (
                                  <span className="badge bg-info-subtle text-info border fs-10 fw-medium">
                                    {categoryName}
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-dark fw-medium fs-12 text-break"
                                style={clampTwoLines}
                                title={r.stockItem?.description}
                              >
                                {r.stockItem?.description || "Unknown Item"}
                              </div>
                            </div>
                            <Button
                              color="soft-primary"
                              size="sm"
                              className="btn-icon flex-shrink-0"
                              style={{ width: 34, height: 34 }}
                              onClick={() => openEdit(r)}
                              aria-label={`Edit price for ${r.stockItem?.itemCode}`}
                            >
                              <i className="ri-pencil-fill"></i>
                            </Button>
                          </div>
                          <div className="d-flex align-items-baseline justify-content-between mt-2 pt-2 border-top border-light-subtle">
                            <span className="text-muted fs-10 text-uppercase">Selling price</span>
                            <span className="fw-bold text-primary font-monospace fs-14">
                              {fmt.format(r.sellingPrice)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Summary bar + pagination */}
                {dataReady && filteredRows.length > 0 && (
                  <>
                    <div className="px-3 py-2 border-top text-muted fs-11 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-1 gap-sm-2">
                      <span>
                        Showing <strong className="text-dark">{filteredRows.length}</strong>
                        {hasActiveFilters && <> of {rows.length}</>} priced stock item
                        {filteredRows.length === 1 ? "" : "s"}
                      </span>
                      <span>
                        {isFetching ? "Refreshing..." : `${availableStockItems.length} stock items available to add`}
                      </span>
                    </div>
                    <div className="px-3 py-2 border-top">
                      <TablePagination table={tableInstance} />
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {selectedPriceCode && (
        <ItemPriceModal
          isOpen={modal.open}
          onClose={closeModal}
          priceCode={selectedPriceCode}
          availableStockItems={availableStockItems}
          lockedRow={modal.row}
        />
      )}
    </React.Fragment>
  );
};

export default ItemPriceManagement;