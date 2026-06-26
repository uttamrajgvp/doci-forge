export const FONT_CATEGORIES = {
  serif: [
    'Merriweather',
    'Playfair Display',
    'Lora',
    'PT Serif',
  ],
  sans: [
    'Open Sans',
    'Roboto',
    'Lato',
    'Montserrat',
    'Poppins',
    'Inter',
  ],
  mono: [
    'Fira Code',
    'Roboto Mono',
    'Source Code Pro',
  ],
  display: [
    'Oswald',
    'Bebas Neue',
    'Righteous',
  ]
};

export const DEFAULT_FONTS = [...FONT_CATEGORIES.sans, ...FONT_CATEGORIES.serif];

export function mapPdfFontToGoogle(pdfFontName: string): string {
  const normalized = pdfFontName.toLowerCase().replace(/[^a-z]/g, '');
  
  if (normalized.includes('helvetica') || normalized.includes('arial')) return 'Open Sans';
  if (normalized.includes('times') || normalized.includes('georgia')) return 'Merriweather';
  if (normalized.includes('courier')) return 'Roboto Mono';
  if (normalized.includes('gothic')) return 'Roboto';
  
  return 'Open Sans'; // Fallback
}

export function loadGoogleFont(fontName: string): void {
  const id = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}&display=swap`;
  document.head.appendChild(link);
}

