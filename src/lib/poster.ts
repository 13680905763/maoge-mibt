import QRCode from "qrcode";

export const posterThemeOptions = [
  { id: "identity", name: "猫格身份证", kicker: "CAT ID" },
  { id: "magazine", name: "主子周刊", kicker: "COVER CAT" },
  { id: "wanted", name: "显眼包通缉令", kicker: "MOST WANTED" },
] as const;

export type PosterTheme = (typeof posterThemeOptions)[number]["id"];

export type PosterDimension = {
  pair: readonly [string, string];
  left: string;
  right: string;
  leftPercent: number;
  rightPercent: number;
};

type PosterInput = {
  catName: string;
  avatar?: string;
  code: string;
  typeName: string;
  tagline: string;
  rows: PosterDimension[];
  resultUrl: string;
  theme?: PosterTheme;
};

const posterThemeStyles: Record<
  PosterTheme,
  {
    background: string;
    surface: string;
    ink: string;
    muted: string;
    accent: string;
    highlight: string;
    decoration: string;
    title: string;
    subtitle: string;
  }
> = {
  identity: {
    background: "#f7f5ef",
    surface: "#fffefa",
    ink: "#1f2924",
    muted: "#6d746f",
    accent: "#2f6f64",
    highlight: "#d7f36b",
    decoration: "rgba(47, 111, 100, 0.08)",
    title: "猫格身份证",
    subtitle: "给最懂它的人看的猫咪性格观察",
  },
  magazine: {
    background: "#f1ede5",
    surface: "#fff9ef",
    ink: "#251e1a",
    muted: "#76675f",
    accent: "#d45b42",
    highlight: "#ffc96b",
    decoration: "rgba(212, 91, 66, 0.1)",
    title: "主子周刊",
    subtitle: "CAT CULTURE · 本期封面猫物",
  },
  wanted: {
    background: "#e9d6ae",
    surface: "#f9e9c8",
    ink: "#302118",
    muted: "#765b43",
    accent: "#92382d",
    highlight: "#d7a94f",
    decoration: "rgba(74, 47, 30, 0.12)",
    title: "显眼包通缉令",
    subtitle: "MOST WANTED · 发现请立即投喂",
  },
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}
function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) {
  const characters = [...text];
  const lines: string[] = [];
  let current = "";

  characters.forEach((character) => {
    const candidate = current + character;
    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = character;
      return;
    }
    current = candidate;
  });
  if (current) lines.push(current);

  lines.slice(0, maxLines).forEach((line, index) => {
    const isLastVisibleLine = index === maxLines - 1 && lines.length > maxLines;
    context.fillText(isLastVisibleLine ? `${line.slice(0, -1)}…` : line, x, y + index * lineHeight);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;

  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, x, y, size, size);
  context.restore();
}

export async function resizeAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");

  const source = URL.createObjectURL(file);
  try {
    const image = await loadImage(source);
    const canvas = document.createElement("canvas");
    const size = 420;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器无法处理图片");
    drawCoverImage(context, image, 0, 0, size);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(source);
  }
}

export async function generateResultPoster(input: PosterInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法生成海报");

  const fontFamily = '"Microsoft YaHei", "PingFang SC", Arial, sans-serif';
  const theme = posterThemeStyles[input.theme ?? "identity"];
  context.fillStyle = theme.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = theme.highlight;
  context.globalAlpha = 0.55;
  context.beginPath();
  context.arc(970, 80, 300, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = theme.decoration;
  context.beginPath();
  context.arc(80, 1320, 260, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = theme.ink;
  context.font = `800 32px ${fontFamily}`;
  context.fillText(theme.title, 72, 82);
  context.fillStyle = theme.accent;
  context.font = `700 22px ${fontFamily}`;
  context.fillText(theme.subtitle, 72, 122);

  const avatarX = 72;
  const avatarY = 180;
  const avatarSize = 190;
  context.fillStyle = theme.highlight;
  context.beginPath();
  context.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  context.fill();

  if (input.avatar) {
    try {
      const avatar = await loadImage(input.avatar);
      drawCoverImage(context, avatar, avatarX, avatarY, avatarSize);
    } catch {
      context.fillStyle = theme.ink;
      context.font = `900 72px ${fontFamily}`;
      context.textAlign = "center";
      context.fillText(input.catName.slice(0, 1) || "喵", avatarX + avatarSize / 2, avatarY + 122);
      context.textAlign = "left";
    }
  } else {
    context.fillStyle = theme.ink;
    context.font = `900 72px ${fontFamily}`;
    context.textAlign = "center";
    context.fillText(input.catName.slice(0, 1) || "喵", avatarX + avatarSize / 2, avatarY + 122);
    context.textAlign = "left";
  }

  context.fillStyle = theme.muted;
  context.font = `700 24px ${fontFamily}`;
  context.fillText(`${input.catName} 的猫格类型`, 310, 220);
  context.fillStyle = theme.accent;
  const codeFontSize = Math.max(70, 112 - Math.max(0, input.code.length - 4) * 14);
  context.font = `900 ${codeFontSize}px ${fontFamily}`;
  context.fillText(input.code, 304, 330);
  context.fillStyle = theme.ink;
  context.font = `800 42px ${fontFamily}`;
  context.fillText(input.typeName, 310, 382);

  context.fillStyle = theme.ink;
  context.font = `700 34px ${fontFamily}`;
  wrapText(context, input.tagline, 72, 485, 900, 52, 2);

  roundedRect(context, 54, 610, 972, 500, 34);
  context.fillStyle = theme.surface;
  context.fill();

  context.fillStyle = theme.ink;
  context.font = `800 26px ${fontFamily}`;
  context.fillText("四维性格倾向", 90, 665);

  input.rows.forEach((row, index) => {
    const y = 730 + index * 96;
    context.fillStyle = theme.ink;
    context.font = `800 22px ${fontFamily}`;
    context.fillText(`${row.pair[0]}  ${row.left}`, 90, y);
    context.textAlign = "right";
    context.fillText(`${row.right}  ${row.pair[1]}`, 990, y);
    context.textAlign = "left";

    roundedRect(context, 90, y + 22, 900, 18, 9);
    context.fillStyle = "#ecece5";
    context.fill();
    roundedRect(context, 90, y + 22, 900 * (row.leftPercent / 100), 18, 9);
    context.fillStyle = theme.accent;
    context.fill();

    context.fillStyle = theme.muted;
    context.font = `700 18px ${fontFamily}`;
    context.fillText(`${row.leftPercent}%`, 90, y + 68);
    context.textAlign = "right";
    context.fillText(`${row.rightPercent}%`, 990, y + 68);
    context.textAlign = "left";
  });

  const qrDataUrl = await QRCode.toDataURL(input.resultUrl, {
    width: 210,
    margin: 1,
    color: { dark: theme.ink, light: theme.surface },
  });
  const qrCode = await loadImage(qrDataUrl);
  context.drawImage(qrCode, 72, 1170, 190, 190);

  context.fillStyle = theme.ink;
  context.font = `800 28px ${fontFamily}`;
  context.fillText("扫码测测你家猫的性格", 310, 1235);
  context.fillStyle = theme.muted;
  context.font = `500 21px ${fontFamily}`;
  context.fillText("结果来自日常行为观察，仅供趣味参考", 310, 1280);
  context.fillText("不代表医学或动物行为诊断", 310, 1317);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("海报生成失败，请稍后重试"));
    }, "image/png");
  });
}
