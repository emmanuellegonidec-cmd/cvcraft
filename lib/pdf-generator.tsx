import { Document } from '@react-pdf/renderer';
import { CVFormData } from './types';
import { TemplateId, FontId, getFont } from './cv-config';
import { ClassicPdf } from './pdf-templates/classic';
import { ModernPdf } from './pdf-templates/modern';
import { MinimalPdf } from './pdf-templates/minimal';
import { ElegantPdf } from './pdf-templates/elegant';
import { CreativePdf } from './pdf-templates/creative';
import { ExecutivePdf } from './pdf-templates/executive';

interface CVPdfProps {
  formData: CVFormData;
  template?: TemplateId;
  accentColor?: string;
  font?: FontId;
  photo?: string;
  // Rétrocompatibilité avec l'ancienne API
  content?: string;
}

export function CVPdf({
  formData,
  template = 'classic',
  accentColor = '#E8151B',
  font = 'arial',
  photo,
  content,
}: CVPdfProps) {

  // Si pas de formData (ancien mode markdown), fallback texte brut
  if (!formData && content) {
    const { FallbackPdf } = require('./pdf-templates/fallback');
    return <Document><FallbackPdf content={content} /></Document>;
  }

  const fontConfig = getFont(font);
  const fontFamily = fontConfig.family;

  const props = {
    formData,
    accentColor,
    fontFamily,
    photo,
  };

  return (
    <Document>
      {template === 'modern'    && <ModernPdf    {...props} />}
      {template === 'minimal'   && <MinimalPdf   {...props} />}
      {template === 'elegant'   && <ElegantPdf   {...props} />}
      {template === 'creative'  && <CreativePdf  {...props} />}
      {template === 'executive' && <ExecutivePdf {...props} />}
      {(template === 'classic' || !template) && <ClassicPdf {...props} />}
    </Document>
  );
}