import type { Table } from '@/domain/models/databaseSchema';
import { calculateTableWidth, calculateTableHeight } from '@/domain/diagram/tableDimensions';
import { downloadFile } from './helpers';
import { toastSuccess, toastError } from '@/services/toastService';

export interface DiagramBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateDiagramBounds(
  tables: Record<string, Table>,
  positions: Record<string, { x: number; y: number }>,
  padding = 80
): DiagramBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  Object.entries(tables || {}).forEach(([name, table]) => {
    const pos = positions[name];
    if (!pos) return;

    const width = calculateTableWidth(table);
    const height = calculateTableHeight(table);

    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + width);
    maxY = Math.max(maxY, pos.y + height);
  });

  if (minX === Infinity) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

function prepareSvgClone(svgElement: SVGSVGElement, bounds: DiagramBounds): SVGSVGElement {
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

  svgClone.removeAttribute("style");
  svgClone.setAttribute("width", Math.ceil(bounds.width).toString());
  svgClone.setAttribute("height", Math.ceil(bounds.height).toString());
  svgClone.setAttribute("viewBox", `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
  svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const viewportLayer = svgClone.querySelector("#viewport-layer") as HTMLElement | null;
  if (viewportLayer) {
    viewportLayer.removeAttribute("transform");
    viewportLayer.style.transform = "";
  }

  // Remove seleções temporárias e grade de fundo
  const unwantedSelectors = [
    'rect[fill="rgba(59, 130, 246, 0.1)"]',
    '.grid-background',
    '.column-hover-area',
    '.connector-hitbox',
  ];

  svgClone.querySelectorAll(unwantedSelectors.join(', ')).forEach((el) => el.remove());

  // Coleta regras CSS ativas para manter fontes e estilos intactos
  let cssText = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || (sheet as any).rules;
      if (rules) {
        for (const rule of Array.from(rules)) {
          cssText += rule.cssText + "\n";
        }
      }
    } catch (e) {
      // Ignora folhas de estilos com restrição de CORS
    }
  }

  const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleEl.textContent = cssText;

  const defsElement = svgClone.querySelector("defs");
  if (defsElement) {
    defsElement.appendChild(styleEl);
  } else {
    svgClone.insertBefore(styleEl, svgClone.firstChild);
  }

  return svgClone;
}

export async function exportSvg(
  svgElement: SVGSVGElement,
  tables: Record<string, Table>,
  positions: Record<string, { x: number; y: number }>
): Promise<void> {
  try {
    const bounds = calculateDiagramBounds(tables, positions);
    const svgClone = prepareSvgClone(svgElement, bounds);
    const svgString = new XMLSerializer().serializeToString(svgClone);

    downloadFile(svgString, "diagrama.svg", "image/svg+xml;charset=utf-8");
    toastSuccess("SVG Exportado", "O diagrama vetorial foi baixado.");
  } catch (err: any) {
    toastError("Falha na Exportação", "Não foi possível gerar o SVG.");
  }
}

export async function exportPng(
  svgElement: SVGSVGElement,
  tables: Record<string, Table>,
  positions: Record<string, { x: number; y: number }>
): Promise<void> {
  try {
    const bounds = calculateDiagramBounds(tables, positions);
    const svgClone = prepareSvgClone(svgElement, bounds);
    const svgString = new XMLSerializer().serializeToString(svgClone);

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Erro ao renderizar imagem SVG"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    const MAX_DIMENSION = 16000;
    let scale = 2; // Alta resolução 2x

    if (bounds.width * scale > MAX_DIMENSION || bounds.height * scale > MAX_DIMENSION) {
      scale = Math.min(MAX_DIMENSION / bounds.width, MAX_DIMENSION / bounds.height);
    }

    canvas.width = Math.floor(bounds.width * scale);
    canvas.height = Math.floor(bounds.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Contexto 2D não suportado");

    // Fundo branco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, bounds.width, bounds.height);
    ctx.restore();

    URL.revokeObjectURL(url);

    // Carrega a logo completa oficial (/logo-completa.svg)
    await drawWatermark(ctx, bounds.width, bounds.height, scale);

    canvas.toBlob((pngBlob) => {
      if (pngBlob) {
        downloadFile(pngBlob, "diagrama.png", "image/png");
        toastSuccess("PNG Exportado", "A imagem em alta definição foi baixada.");
      }
    }, "image/png");
  } catch (err: any) {
    toastError("Falha na Exportação", "Não foi possível gerar a imagem PNG.");
  }
}

async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  boundsWidth: number,
  boundsHeight: number,
  scale: number
): Promise<void> {
  return new Promise((resolve) => {
    const logoImg = new Image();
    logoImg.onload = () => {
      ctx.save();
      ctx.scale(scale, scale);

      const logoHeight = 50;
      const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
      const logoPadding = 20;

      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.globalAlpha = 0.7;
      ctx.drawImage(
        logoImg,
        boundsWidth - logoWidth - logoPadding,
        boundsHeight - logoHeight - logoPadding,
        logoWidth,
        logoHeight
      );
      ctx.restore();
      resolve();
    };
    logoImg.onerror = () => {
      // Se não carregar a logo, exporta sem ela
      resolve();
    };
    logoImg.src = "/logo-completa.svg";
  });
}
