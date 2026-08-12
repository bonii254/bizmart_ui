import { useQuery, useMutation } from "@tanstack/react-query";
import qz from "qz-tray";
import { toast } from "react-toastify";
import { 
    connectToQZ, 
    generateESCPOSText, 
    ReceiptData 
} from "../../utils/qzConfig";

export const usePrinters = () => {
  return useQuery({
    queryKey: ["qzPrinters"],
    queryFn: async (): Promise<string[]> => {
      await connectToQZ();
      const printers = await qz.printers.find();
      return Array.isArray(printers) ? printers : [printers];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

export const usePrintReceiptMutation = () => {
  const printMutation = useMutation({
    mutationFn: async ({
      printerName,
      receiptData,
    }: {
      printerName: string;
      receiptData: ReceiptData;
    }) => {
      if (!printerName) {
        throw new Error("No printer selected.");
      }

      await connectToQZ();
      const config = qz.configs.create(printerName);
      const formattedContent = generateESCPOSText(receiptData);

      await qz.print(config, [formattedContent]);
    },
    onSuccess: () => {
      toast.success("Receipt printed successfully!");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to print via QZ Tray.";
      toast.error(message);
    },
  });

  return {
    printReceipt: printMutation.mutateAsync,
    isPrinting: printMutation.isPending,
  };
};