import qz from "qz-tray";
import { connectToQZ, generateESCPOSText, ReceiptData } from "./qzConfig";
import { GoodsReceiptCreatedData } from "../types/grn";
import { toast } from "react-toastify";

export const printGRNReceipt = async (
  receiptData: GoodsReceiptCreatedData,
  lines: any[],
  supplierName: string,
  warehouseName: string,
  operatorName: string,
  companyName: string,
  selectedPrinter: string,
) => {
  try {
    await connectToQZ();

    const printer = await qz.printers.getDefault();

    const totals = lines.reduce(
      (acc, item) => {
        acc.grandTotal += item.lineTotal;
        return acc;
      },
      { grandTotal: 0 }
    );

    const formattedReceiptData: ReceiptData = {
      companyName: companyName,
      storeName: warehouseName,
      receiptNo: receiptData.documentNumber,
      date: new Date(receiptData.postedAt).toLocaleString("en-KE"),
      cashier: operatorName,
      customerName: `SUPPLIER: ${supplierName}`,
      items: lines.map((l) => {
        const isAltUom = l.selectedUom === l.altUom;
        const printQty = isAltUom ? l.enteredQty * l.conversionFactor : l.enteredQty;

        return {
          name: `${l.itemCode} - ${l.description}`.substring(0, 32), 
          qty: printQty,
          unitPrice: l.unitPrice,
          total: l.lineTotal,
        };
      }),
      subtotal: totals.grandTotal,
      taxTotal: 0,
      grandTotal: totals.grandTotal,
      paymentMethod: "CREDIT / ON ACCOUNT",
    };

    const escPosString = generateESCPOSText(formattedReceiptData);

    const config = qz.configs.create(printer, { encoding: "UTF-8" });
    const printData = [
      {
        type: "raw",
        format: "command",
        flavor: "plain",
        data: escPosString,
      },
    ];

    await qz.print(config, printData);
    toast.info("GRN Receipt sent to printer.");
    
  } catch (error) {
    console.error("QZ Tray Print Error:", error);
    toast.error("Failed to print receipt. Ensure QZ Tray is running.");
  }
};