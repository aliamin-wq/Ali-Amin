import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(data: string, options?: { darkColor?: string; lightColor?: string; width?: number }): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: options?.width || 280,
      margin: 1,
      color: {
        dark: options?.darkColor || '#1c1917',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

// Generate stylized barcode lines (Code-128 aesthetic)
export function generateBarcodePattern(seedString: string): number[] {
  const hash = seedString.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000003, 7);
  const pattern: number[] = [2, 1, 1, 2, 3, 1]; // start guard
  
  for (let i = 0; i < 28; i++) {
    const val = ((hash >> (i % 20)) ^ (i * 13)) % 4 + 1;
    pattern.push(val);
  }
  
  pattern.push(2, 1, 1, 2); // end guard
  return pattern;
}
