import QRCode from "qrcode";

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
  context.fillStyle = "#f7f5ef";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(215, 243, 107, 0.55)";
  context.beginPath();
  context.arc(970, 80, 300, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(47, 111, 100, 0.08)";
  context.beginPath();
  context.arc(80, 1320, 260, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#1f2924";
  context.font = `800 32px ${fontFamily}`;
  context.fillText("猫格 MIBT", 72, 82);
  context.fillStyle = "#2f6f64";
  context.font = `700 22px ${fontFamily}`;
  context.fillText("给最懂它的人看的猫咪性格观察", 72, 122);

  const avatarX = 72;
  const avatarY = 180;
  const avatarSize = 190;
  context.fillStyle = "#d7f36b";
  context.beginPath();
  context.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  context.fill();

  if (input.avatar) {
    try {
      const avatar = await loadImage(input.avatar);
      drawCoverImage(context, avatar, avatarX, avatarY, avatarSize);
    } catch {
      context.fillStyle = "#1f2924";
      context.font = `900 72px ${fontFamily}`;
      context.textAlign = "center";
      context.fillText(input.catName.slice(0, 1) || "喵", avatarX + avatarSize / 2, avatarY + 122);
      context.textAlign = "left";
    }
  } else {
    context.fillStyle = "#1f2924";
    context.font = `900 72px ${fontFamily}`;
    context.textAlign = "center";
    context.fillText(input.catName.slice(0, 1) || "喵", avatarX + avatarSize / 2, avatarY + 122);
    context.textAlign = "left";
  }

  context.fillStyle = "#6d746f";
  context.font = `700 24px ${fontFamily}`;
  context.fillText(`${input.catName} 的猫格类型`, 310, 220);
  context.fillStyle = "#2f6f64";
  context.font = `900 112px ${fontFamily}`;
  context.fillText(input.code, 304, 330);
  context.fillStyle = "#1f2924";
  context.font = `800 42px ${fontFamily}`;
  context.fillText(input.typeName, 310, 382);

  context.fillStyle = "#1f2924";
  context.font = `700 34px ${fontFamily}`;
  wrapText(context, input.tagline, 72, 485, 900, 52, 2);

  roundedRect(context, 54, 610, 972, 500, 34);
  context.fillStyle = "#fffefa";
  context.fill();

  context.fillStyle = "#1f2924";
  context.font = `800 26px ${fontFamily}`;
  context.fillText("四维性格倾向", 90, 665);

  input.rows.forEach((row, index) => {
    const y = 730 + index * 96;
    context.fillStyle = "#1f2924";
    context.font = `800 22px ${fontFamily}`;
    context.fillText(`${row.pair[0]}  ${row.left}`, 90, y);
    context.textAlign = "right";
    context.fillText(`${row.right}  ${row.pair[1]}`, 990, y);
    context.textAlign = "left";

    roundedRect(context, 90, y + 22, 900, 18, 9);
    context.fillStyle = "#ecece5";
    context.fill();
    roundedRect(context, 90, y + 22, 900 * (row.leftPercent / 100), 18, 9);
    context.fillStyle = "#2f6f64";
    context.fill();

    context.fillStyle = "#6d746f";
    context.font = `700 18px ${fontFamily}`;
    context.fillText(`${row.leftPercent}%`, 90, y + 68);
    context.textAlign = "right";
    context.fillText(`${row.rightPercent}%`, 990, y + 68);
    context.textAlign = "left";
  });

  const qrDataUrl = await QRCode.toDataURL(input.resultUrl, {
    width: 210,
    margin: 1,
    color: { dark: "#1f2924", light: "#fffefa" },
  });
  const qrCode = await loadImage(qrDataUrl);
  context.drawImage(qrCode, 72, 1170, 190, 190);

  context.fillStyle = "#1f2924";
  context.font = `800 28px ${fontFamily}`;
  context.fillText("扫码测测你家猫的性格", 310, 1235);
  context.fillStyle = "#6d746f";
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
