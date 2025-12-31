/**
 * 颜色工具函数
 * 用于根据 WCAG 2.1 标准计算颜色对比度和选择文字颜色
 */

/**
 * 将 hex 颜色字符串转换为 RGB 值数组
 * 支持 #rgb 和 #rrggbb 格式
 */
function hexToRgb(hex: string): [number, number, number] {
  // 移除 # 前缀
  hex = hex.replace('#', '');
  
  // 如果是 3 位 hex，扩展为 6 位
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // 解析为 RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
}

/**
 * 根据 WCAG 2.1 标准计算颜色的相对亮度
 * @param color hex 颜色字符串（如 #ffffff 或 #fff）
 * @returns 相对亮度值（0-1 之间）
 */
export function getRelativeLuminance(color: string): number {
  const [r, g, b] = hexToRgb(color);
  
  // 归一化到 0-1
  const normalize = (value: number) => value / 255;
  
  // 应用 gamma 校正
  const gammaCorrect = (value: number) => {
    const normalized = normalize(value);
    if (normalized <= 0.03928) {
      return normalized / 12.92;
    }
    return Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  
  const rCorrected = gammaCorrect(r);
  const gCorrected = gammaCorrect(g);
  const bCorrected = gammaCorrect(b);
  
  // 计算相对亮度
  return 0.2126 * rCorrected + 0.7152 * gCorrected + 0.0722 * bCorrected;
}

/**
 * 计算两个颜色之间的对比度
 * @param color1 第一个颜色
 * @param color2 第二个颜色
 * @returns 对比度比值（1-21 之间，通常 4.5 以上为 AA 级别）
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  
  // 确保 L1 是较亮的颜色
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 根据背景色和主题模式选择文字颜色
 * @param backgroundColor 背景色（hex 格式）
 * @param theme 主题模式：'light' 或 'dark'（当前未使用，保留以保持接口兼容性）
 * @returns 文字颜色（hex 格式）
 */
export function getTextColor(
  backgroundColor: string,
  theme: 'light' | 'dark'
): string {
  // 项目风格的文字颜色选项
  const lightText = '#e0e0e0'; // 近白色（项目风格）
  const darkText = '#2c2c2c'; // 近黑色（项目风格）
  
  // 用于对比度计算的参考颜色（使用纯色以获得更准确的对比度判断）
  const pureBlack = '#000000';
  const pureWhite = '#ffffff';
  
  // 使用 WCAG 算法选择对比度更高的颜色
  // 明模式和暗模式使用相同的逻辑，不再取反
  const contrastWithBlack = getContrastRatio(backgroundColor, pureBlack);
  const contrastWithWhite = getContrastRatio(backgroundColor, pureWhite);
  
  // 选择对比度更高的颜色，使用项目风格的近色
  if (contrastWithBlack > contrastWithWhite) {
    return darkText; // #2c2c2c
  } else {
    return lightText; // #e0e0e0
  }
}
