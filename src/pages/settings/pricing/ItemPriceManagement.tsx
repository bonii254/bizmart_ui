import React, { useEffect, useMemo, useState } from "react";
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

// Adjust the stock item hook/type paths to match your project.
import {
  usePriceCodes,
  useItemPrices,
  useItemPriceMutation,
} from "../../../Components/Hooks/usePricing";
import { useStockItems } from "../../../Components/Hooks/useStockItems";
import { PriceCode } from "../../../types/pricing";
import { StockItem } from "../../../types/stockitem";

const CURRENCY = "KES";

interface ItemOption {
  value: string;
  label: string; // used by the search filter
  item: StockItem;
}

interface PriceRow {
  priceCode: string;
  sellingPrice: number;
  meta?: PriceCode;
}

const selectStyles: StylesConfig<ItemOption, false> = {
  control: (base) => ({ ...base, minHeight: 31, fontSize: 12 }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  dropdownIndicator: (base) => ({ ...base, padding: 4 }),
  clearIndicator: (base) => ({ ...base, padding: 4 }),
  placeholder: (base) => ({ ...base, fontSize: 12 }),
  option: (base) => ({ ...base, fontSize: 12, padding: "6px 10px" }),
  menu: (base) => ({ ...base, zIndex: 5 }),
};

/* ------------------------------------------------------------------ */
/* Add / edit price modal                                              */
/* ------------------------------------------------------------------ */

interface ItemPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemLabel: string;
  availableCodes: PriceCode[]; // active codes not yet assigned to the item
  lockedRow: PriceRow | null; // set when editing an existing price
}

const ItemPriceModal: React.FC<ItemPriceModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemLabel,
  availableCodes,
  lockedRow,
}) => {
  const { upsertItemPrice, isUpserting } = useItemPriceMutation();
  const [error, setError] = useState<string | null>(null);

  const initialValues = {
    priceCode: lockedRow?.priceCode ?? "",
    sellingPrice: lockedRow ? String(lockedRow.sellingPrice) : "",
  };

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      priceCode: Yup.string().required("Select a price code"),
      sellingPrice: Yup.number()
        .typeError("Enter a valid selling price")
        .min(0, "Price cannot be negative")
        .required("Selling price is required"),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        await upsertItemPrice({
          itemId,
          priceCode: values.priceCode,
          sellingPrice: Number(values.sellingPrice),
        });
        onClose();
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to save item price.");
      }
    },
  });

  // Fresh form every time the modal opens.
  useEffect(() => {
    if (isOpen) {
      formik.resetForm({ values: initialValues });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lockedRow?.priceCode]);

  const close = () => !isUpserting && onClose();

  const codeOptions: { value: string; text: string }[] = lockedRow
    ? [
        {
          value: lockedRow.priceCode,
          text: `${lockedRow.priceCode}${lockedRow.meta ? ` - ${lockedRow.meta.description}` : ""}`,
        },
      ]
    : availableCodes.map((c) => ({
        value: c.priceCodeValue,
        text: `${c.priceCodeValue} - ${c.description}${c.isDefault ? " (default)" : ""}`,
      }));

  return (
    <Modal isOpen={isOpen} toggle={close} centered size="md">
      <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={close}>
        <div>{lockedRow ? "Edit Selling Price" : "Add Price Code to Item"}</div>
        <div className="text-muted fs-12 fw-normal text-truncate">{itemLabel}</div>
      </ModalHeader>
      <Form onSubmit={formik.handleSubmit}>
        <ModalBody className="p-3 p-md-4">
          {error && (
            <Alert color="danger" className="border-0 fs-12 py-2">
              <i className="ri-error-warning-line me-1 align-middle"></i>
              {error}
            </Alert>
          )}
          <Row className="g-3">
            <Col xs={12}>
              <FormGroup className="mb-0">
                <Label className="form-label fs-12 fw-medium">
                  Price Code <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  bsSize="sm"
                  disabled={!!lockedRow}
                  {...formik.getFieldProps("priceCode")}
                  invalid={!!(formik.touched.priceCode && formik.errors.priceCode)}
                >
                  <option value="">Select price code...</option>
                  {codeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.text}
                    </option>
                  ))}
                </Input>
                <FormFeedback>{formik.errors.priceCode}</FormFeedback>
                {!lockedRow && (
                  <div className="form-text fs-11">
                    Only active price codes not yet assigned to this item are listed.
                  </div>
                )}
              </FormGroup>
            </Col>

            <Col xs={12}>
              <FormGroup className="mb-0">
                <Label className="form-label fs-12 fw-medium">
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
        <ModalFooter className="bg-light p-3">
          <Button color="link" size="sm" type="button" onClick={close} disabled={isUpserting}>
            Cancel
          </Button>
          <Button type="submit" color="primary" size="sm" disabled={isUpserting}>
            {isUpserting ? <Spinner size="sm" /> : "Save Price"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const ItemPriceManagement: React.FC = () => {
  document.title = "Item Prices | Pricing";

  const [itemId, setItemId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; row: PriceRow | null }>({
    open: false,
    row: null,
  });

  const { data: stockItems = [], isLoading: itemsLoading } = useStockItems();
  const { data: priceCodes = [] } = usePriceCodes();
  const {
    data: itemPrices = [],
    isLoading: pricesLoading,
    isFetching,
    isError,
    refetch,
  } = useItemPrices(itemId);

  const fmt = useMemo(
    () => new Intl.NumberFormat("en-KE", { style: "currency", currency: CURRENCY }),
    []
  );

  const options = useMemo<ItemOption[]>(
    () =>
      stockItems.map((item) => ({
        value: item.itemId,
        label: `${item.itemCode} ${item.description}`,
        item,
      })),
    [stockItems]
  );

  const selected = useMemo(() => options.find((o) => o.value === itemId) ?? null, [options, itemId]);
  const item = selected?.item;

  const rows = useMemo<PriceRow[]>(() => {
    const meta = new Map(priceCodes.map((c) => [c.priceCodeValue, c]));
    return itemPrices
      .map((p) => ({ priceCode: p.priceCode, sellingPrice: p.sellingPrice, meta: meta.get(p.priceCode) }))
      .sort(
        (a, b) =>
          Number(!!b.meta?.isDefault) - Number(!!a.meta?.isDefault) ||
          a.priceCode.localeCompare(b.priceCode)
      );
  }, [itemPrices, priceCodes]);

  const availableCodes = useMemo(() => {
    const assigned = new Set(itemPrices.map((p) => p.priceCode));
    return priceCodes.filter((c) => c.isActive && !assigned.has(c.priceCodeValue));
  }, [priceCodes, itemPrices]);

  const openAdd = () => setModal({ open: true, row: null });
  const openEdit = (row: PriceRow) => setModal({ open: true, row });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const itemLabel = item ? `${item.itemCode} - ${item.description}` : "";

  const CodeCell = ({ r }: { r: PriceRow }) => (
    <>
      <span className="fw-semibold text-primary font-monospace fs-11">{r.priceCode}</span>
      {r.meta?.isDefault && (
        <Badge color="primary-subtle" className="text-primary border fs-10 fw-medium ms-2">
          Default
        </Badge>
      )}
      {r.meta && !r.meta.isActive && (
        <Badge color="danger-subtle" className="text-danger fs-10 fw-normal ms-2">
          Deactivated
        </Badge>
      )}
    </>
  );

  return (
    <React.Fragment>
      <Container fluid className="px-2 px-md-3">
        <Row>
          <Col lg={12}>
            <Card className="shadow-sm border-0">
              <CardHeader className="border-bottom py-3 px-3 bg-white">
                <Row className="g-2 align-items-center justify-content-between">
                  <Col xl={6} lg={6} md={7} sm={12}>
                    <Select<ItemOption, false>
                      inputId="item-price-stock-item"
                      aria-label="Stock item"
                      styles={selectStyles}
                      options={options}
                      value={selected}
                      isLoading={itemsLoading}
                      isClearable
                      placeholder="Select stock item by code or description..."
                      noOptionsMessage={() => "No stock items found"}
                      onChange={(opt: SingleValue<ItemOption>) => setItemId(opt?.value ?? null)}
                      formatOptionLabel={(o) => (
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="text-truncate" style={{ minWidth: 0 }}>
                            <span className="fw-semibold">{o.item.itemCode}</span>
                            <span className="text-muted ms-2">{o.item.description}</span>
                          </div>
                          {!o.item.isActive && (
                            <Badge color="secondary-subtle" className="text-secondary fs-10 flex-shrink-0">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      )}
                    />
                  </Col>

                  <Col xl={6} lg={6} md={5} sm={12} className="text-md-end">
                    <Button
                      color="primary"
                      size="sm"
                      className="fs-12 fw-medium px-3 text-nowrap w-100 w-md-auto"
                      onClick={openAdd}
                      disabled={!item || availableCodes.length === 0}
                      title={
                        item && availableCodes.length === 0
                          ? "All active price codes are already assigned to this item"
                          : undefined
                      }
                    >
                      <i className="ri-add-line align-bottom me-1"></i> Add Price Code
                    </Button>
                  </Col>
                </Row>
              </CardHeader>

              {/* Item summary */}
              {item && (
                <div className="px-3 py-2 bg-light border-bottom">
                  <div className="d-flex flex-wrap align-items-center gap-x-3 gap-y-1 fs-12 column-gap-4 row-gap-1">
                    <span>
                      <span className="text-muted me-1">Item</span>
                      <span className="fw-semibold">{item.itemCode}</span>
                    </span>
                    <span className="text-break">
                      <span className="text-muted me-1">Description</span>
                      <span className="fw-medium">{item.description}</span>
                    </span>
                    <span>
                      <span className="text-muted me-1">UoM</span>
                      <span className="fw-medium">{item.stockUom}</span>
                    </span>
                    <span>
                      <span className="text-muted me-1">Catalogue price</span>
                      <span className="fw-medium">{fmt.format(item.sellingPrice ?? 0)}</span>
                    </span>
                    <Badge
                      color={item.isActive ? "success-subtle" : "danger-subtle"}
                      className={`text-${item.isActive ? "success" : "danger"} fs-10 fw-normal`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              )}

              <CardBody className="p-0">
                {/* No item selected */}
                {!item && (
                  <div className="text-center py-5 px-3">
                    <i className="ri-search-line display-6 text-muted"></i>
                    <h6 className="mt-3 mb-1">Select a stock item</h6>
                    <p className="text-muted fs-12 mb-0">
                      Choose an item above to see the price codes assigned to it and their selling prices.
                    </p>
                  </div>
                )}

                {item && isError && (
                  <Alert color="danger" className="m-3 border-0 d-flex flex-wrap align-items-center justify-content-between gap-2 fs-12">
                    <span>
                      <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
                      Could not load prices for this item.
                    </span>
                    <Button color="danger" size="sm" outline onClick={() => refetch()}>
                      Try again
                    </Button>
                  </Alert>
                )}

                {item && !isError && pricesLoading && (
                  <div className="text-center py-4">
                    <Spinner size="sm" color="primary" />
                  </div>
                )}

                {/* Item has no prices yet */}
                {item && !isError && !pricesLoading && rows.length === 0 && (
                  <div className="text-center py-5 px-3">
                    <i className="ri-price-tag-3-line display-6 text-muted"></i>
                    <h6 className="mt-3 mb-1">No price codes assigned</h6>
                    <p className="text-muted fs-12 mb-3">
                      {availableCodes.length > 0
                        ? "Add a price code to set a selling price for this item."
                        : "There are no active price codes to assign. Create one in Price Codes Management first."}
                    </p>
                    {availableCodes.length > 0 && (
                      <Button color="primary" size="sm" className="fs-12 fw-medium" onClick={openAdd}>
                        <i className="ri-add-line align-bottom me-1"></i> Add Price Code
                      </Button>
                    )}
                  </div>
                )}

                {/* Tablet / desktop table */}
                {item && !isError && !pricesLoading && rows.length > 0 && (
                  <div className="table-responsive d-none d-md-block">
                    <Table hover size="sm" className="align-middle mb-0 custom-datatable table-sm">
                      <thead className="table-light text-muted text-uppercase fs-10">
                        <tr>
                          <th className="ps-3 py-2 text-nowrap">Price Code</th>
                          <th className="py-2">Description</th>
                          <th className="py-2 text-end text-nowrap">Selling Price</th>
                          <th className="py-2 pe-3 text-end text-nowrap" style={{ width: 90 }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="fs-12">
                        {rows.map((r) => (
                          <tr key={r.priceCode} className="align-middle">
                            <td className="py-2 ps-3 text-nowrap">
                              <CodeCell r={r} />
                            </td>
                            <td className="py-2 text-dark fw-medium">{r.meta?.description || "-"}</td>
                            <td className="py-2 text-end text-nowrap fw-semibold">{fmt.format(r.sellingPrice)}</td>
                            <td className="py-2 pe-3 text-end">
                              <Button
                                color="soft-primary"
                                size="sm"
                                className="btn-icon"
                                onClick={() => openEdit(r)}
                                aria-label={`Edit price for ${r.priceCode}`}
                              >
                                <i className="ri-pencil-fill"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Mobile list */}
                {item && !isError && !pricesLoading && rows.length > 0 && (
                  <ul className="list-group list-group-flush d-md-none fs-12">
                    {rows.map((r) => (
                      <li key={r.priceCode} className="list-group-item d-flex align-items-center gap-3">
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="d-flex flex-wrap align-items-center">
                            <CodeCell r={r} />
                          </div>
                          <div className="text-muted text-truncate">{r.meta?.description || "-"}</div>
                          <div className="fw-semibold mt-1">{fmt.format(r.sellingPrice)}</div>
                        </div>
                        <Button
                          color="soft-primary"
                          size="sm"
                          className="btn-icon flex-shrink-0"
                          onClick={() => openEdit(r)}
                          aria-label={`Edit price for ${r.priceCode}`}
                        >
                          <i className="ri-pencil-fill"></i>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {item && !isError && rows.length > 0 && (
                  <div className="px-3 py-2 border-top text-muted fs-11 d-flex justify-content-between">
                    <span>
                      {rows.length} price code{rows.length === 1 ? "" : "s"} assigned
                    </span>
                    <span>
                      {isFetching ? "Refreshing..." : `${availableCodes.length} available to add`}
                    </span>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {item && (
        <ItemPriceModal
          isOpen={modal.open}
          onClose={closeModal}
          itemId={item.itemId}
          itemLabel={itemLabel}
          availableCodes={availableCodes}
          lockedRow={modal.row}
        />
      )}
    </React.Fragment>
  );
};

export default ItemPriceManagement;
