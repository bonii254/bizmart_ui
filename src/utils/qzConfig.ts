import qz from "qz-tray"

export const QZ_PUBLIC_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIUH+MozYrPFC42y6bR92E/y+/rNCUwDQYJKoZIhvcNAQEL
BQAwEzERMA8GA1UEAwwITG9jYWxQT1MwHhcNMjYwODEyMTQzMzE2WhcNMzYwODA5
MTQzMzE2WjATMREwDwYDVQQDDAhMb2NhbFBPUzCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBANDb1uZThw5HvX22BBN4ISwc+O3mIFAuFukBIQ5TiJb9zEjX
lenDcaHq9grc9MUOXMibWKRGQeY5usir12jvVY8QViIh2VZQEuroWRXBd9mc4fCK
tf6PRsycmiFt2twtqNhRPmQ6gTH07e8p5PnUP68N1tcI+QpESB+MpkO8JK9DNhPt
rzRZx4zpn1gNIdsxktzmEUCALnz42xst8GJAxlknXjlEFoO+ma4l5jENLlWZms3Z
dQ+giCdTfGQn3fxt6wD3D+rZiL2jvz37FML7U1vKO80DvXNbZA2/IZ8N34ueLBMJ
ugTKLhjiQss8aAdUYm+ijdquUckEG2Q1cMklav8CAwEAAaNTMFEwHQYDVR0OBBYE
FFGJTVkuGgW9Otxbs2+81ajQEmjDMB8GA1UdIwQYMBaAFFGJTVkuGgW9Otxbs2+8
1ajQEmjDMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAEfE+ECh
SMzzJF+PbKmhx8DJ2z44M6foKPsjRuKoJpXucD2E8dw9zGep94lNP6OUO7kAzKoX
6z4iP6PLPS6cD2HYHWz5x2PUNgXrQJXMsVWVvAODwfduEKUDUfrRK1YECYmu2fjM
DDd0EslyidBjb/gQhMll1oZlKlxdhn65nAyBdvGsOBEejzd6TzC6vBluO8MHqhdZ
ExJXaueyKtqWQN0qhEikrUa7UFGw5C7/EPDOh2z0+gwXy+g9YmjJvNneJgPah2A6
bZJq7iClojLTp1IMSDaoNyCBwZZ6eJTErgS43YV776+Pn7kEUiDuHi2Boxdjii11
EBRCRcQST9AGLRg=
-----END CERTIFICATE-----`;

export const QZ_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDQ29bmU4cOR719
tgQTeCEsHPjt5iBQLhbpASEOU4iW/cxI15Xpw3Gh6vYK3PTFDlzIm1ikRkHmObrI
q9do71WPEFYiIdlWUBLq6FkVwXfZnOHwirX+j0bMnJohbdrcLajYUT5kOoEx9O3v
KeT51D+vDdbXCPkKREgfjKZDvCSvQzYT7a80WceM6Z9YDSHbMZLc5hFAgC58+Nsb
LfBiQMZZJ145RBaDvpmuJeYxDS5VmZrN2XUPoIgnU3xkJ938besA9w/q2Yi9o789
+xTC+1NbyjvNA71zW2QNvyGfDd+LniwTCboEyi4Y4kLLPGgHVGJvoo3arlHJBBtk
NXDJJWr/AgMBAAECggEASj5Dk4eQpEZjOSs5IrSa0iQQZvzdcrMXiMdSeVW/YbEh
a6lbDIhhveWYhb8KsXvMBrGWHnstFMpjt87CGXauatcrTyHKMNDxEJj8hevKj0wh
0tB0JmPHDpgCgCydVpRSh2bF73oOj/QZmmFBmH9XDgK04qa5ZGlmW/Sy67QXNEdj
Lic+HiCBtlhIR9nQsRf3TWWLahUFrnAa0EEIfE2Z+lG8sxK+7aqHFwaczJjiFRGe
CQR3zUMGUjOlg8XVKguzxWXGuK4qHzTexHuCntspSNjtB6lWKArjOxAhjRTOGXaP
EguLCEtMcrl/lco6TRmINXorLMGUv08FJGAowKswQQKBgQDmjxKQgAxHJL19a+PR
n7t/Nzkn8kL3MxQpmCuYDDcuJGIdgGbu00CR2S4M68RR44KoCkS0Em4X8nYb/quU
oU8PivzsGwDYx90KoD4r5vL4IrTiJLuZ7TBw2f4S65u0JhJNVDmylES/MSQcEfHn
2ewZ18s4CmoldtmNTS2ckRP3wQKBgQDn58WxwIVZKupf0iC/R8RVnqqRPBSz9OzL
fDsT1XfFOl9XvBWODmtaNANqlBJ29wCOuefJexjqfLLgBVzkbk2Lizv/81SX7GzB
18AHf2e4i4kNaSiCc7Nd/dsPpMcM4iV3ICT6GG/jFtz85FBqyiRgApZjzv6Jh2o2
q38h+NQSvwKBgQCa/SLlsK6QRMp9PcHwcQiCBIWPrPQHaXbsXzcvB0cw5ZRvcJnB
gpGteenTFcrroZ17iSuWQa1wu7VaLGD7kVSshipwLdbr469cLUyeBqre07X1L+xN
FX2y31hFL82D1PQIt83xlmqAfHBhzk5oJb7pwH8ENTwV40dsDa3TylM6AQKBgQDa
bjuOlpjDiSGjSYegw5dRUha0n5OcgSj87TG0F9AtTDL7r2PaHwjMuMsy+u99cF/t
D3wcEb9BNl1BlquNWbveoTHNfkOCqaUy2+W66i0m7P8VS6RlY1diQ7avQHRgVS4W
y4corhXNHv7dkKuSOn4SlL1Um2ay4YKQpe4kcHxIfwKBgQDAtRgr/tvH38fMoEah
l6hFsl/zQtrJCoJnySS0DogibQY6igD2pL79hjOZ4Vn+V/t3tTa88ksDz2ViQ1eK
451RwviHWw2NUpAUITeepcaEE4QpewF2B2RYdE8tfFgXgbNRkO8y0Lk4gNaGZX0f
HlOM5PzhGEqSJCRzHs5oNvOotg==
-----END PRIVATE KEY-----`;

let isQZInitialized = false;

const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const signSHA512Native = async (toSign: string, privateKeyPem: string): Promise<string> => {
  const keyBuffer = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(toSign)
  );

  // Clean loop replaces spread operator to prevent TS2802 iteration error
  const bytes = new Uint8Array(signatureBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
};

export const setupQZTray = async (): Promise<void> => {
  if (isQZInitialized) return;

  qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
    resolve(QZ_PUBLIC_CERTIFICATE);
  });

  qz.security.setSignatureAlgorithm("SHA512");

  qz.security.setSignaturePromise(
    (toSign: string) =>
      (resolve: (sig: string) => void, reject: (err: unknown) => void) => {
        signSHA512Native(toSign, QZ_PRIVATE_KEY)
          .then(resolve)
          .catch((err) => {
            console.error("Native WebCrypto signing error:", err);
            reject(err);
          });
      }
  );

  isQZInitialized = true;
};

export const connectToQZ = async (): Promise<void> => {
  await setupQZTray();
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount).replace("KES", "Ksh");


export interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  companyName?: string;
  storeName?: string;
  receiptNo: string;
  date: string;
  cashier: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  grandTotal: number;
  paymentMethod: string;
  amountTendered?: number;
  changeAmount?: number;
}

export const generateESCPOSText = (data: ReceiptData): string => {
  const LINE_WIDTH = 32;

  const center = (text: string): string => {
    const space = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
    return `${" ".repeat(space)}${text}\n`;
  };

  const justify = (left: string, right: string): string => {
    const space = Math.max(1, LINE_WIDTH - (left.length + right.length));
    return `${left}${" ".repeat(space)}${right}\n`;
  };

  // ESC/POS Commands
  const INIT = "\x1B\x40";
  const BOLD_ON = "\x1B\x45\x01";
  const BOLD_OFF = "\x1B\x45\x00";
  const DOUBLE_HEIGHT = "\x1B\x21\x10";
  const NORMAL_TEXT = "\x1B\x21\x00";
  const PAPER_CUT = "\x1D\x56\x00";

  let receipt = INIT;

  // Header Section
  receipt += `${BOLD_ON}${DOUBLE_HEIGHT}`;
  receipt += center((data.companyName ?? "FRESHA ENTERPRISES").toUpperCase());
  receipt += NORMAL_TEXT;
  receipt += center(data.storeName ?? "MAIN WAREHOUSE");
  receipt += `${"-".repeat(LINE_WIDTH)}\n`;

  // Receipt Meta
  receipt += justify("Receipt No:", data.receiptNo);
  receipt += justify("Date:", data.date);
  receipt += justify("Cashier:", data.cashier);
  receipt += justify("Customer:", data.customerName);
  receipt += `${"=".repeat(LINE_WIDTH)}\n`;

  // Items Header
  receipt += `${BOLD_ON}`;
  receipt += justify("Item / Qty x Price", "Amount");
  receipt += BOLD_OFF;
  receipt += `${"-".repeat(LINE_WIDTH)}\n`;

  // Items List
  for (const item of data.items) {
    const nameStr = item.name.length > 32 ? item.name.slice(0, 32) : item.name;
    receipt += `${nameStr}\n`;
    const qtyPriceStr = `  ${item.qty} x ${item.unitPrice.toFixed(2)}`;
    receipt += justify(qtyPriceStr, item.total.toFixed(2));
  }

  // Totals Section
  receipt += `${"-".repeat(LINE_WIDTH)}\n`;
  receipt += `${BOLD_ON}`;
  receipt += justify("TOTAL:", formatCurrency(data.grandTotal));
  receipt += BOLD_OFF;
  receipt += justify("Payment Mode:", data.paymentMethod);

  if (data.paymentMethod === "CASH" && data.amountTendered !== undefined) {
    receipt += justify("Tendered:", formatCurrency(data.amountTendered));
    receipt += justify("Change:", formatCurrency(data.changeAmount ?? 0));
  }

  // Footer & Auto-Cut
  receipt += `${"=".repeat(LINE_WIDTH)}\n`;
  receipt += center("Thank you for your business!");
  receipt += center("Quality Fresh Products");
  receipt += `\n\n\n${PAPER_CUT}`;

  return receipt;
};