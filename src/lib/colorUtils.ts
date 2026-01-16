/**
 * 颜色工具函数
 * 用于根据 WCAG 2.1 标准计算颜色对比度和选择文字颜色
 * 以及 Tag 颜色的主题适配
 */

import type { Theme } from './theme';
import { getCurrentEffectiveThemeFromDOM, getEffectiveTheme } from './theme';

/**
 * 将 hex 颜色字符串转换为 RGB 值数组
 * 支持 #rgb 和 #rrggbb 格式
 */
export function hexToRgb(hex: string): [number, number, number] {
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
 * 将 RGB 值转换为 hex 颜色字符串
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 将 RGB 转换为 HSL
 * @param r 0-255
 * @param g 0-255
 * @param b 0-255
 * @returns [h, s, l] 其中 h: 0-360, s: 0-100, l: 0-100
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * 将 HSL 转换为 RGB
 * @param h 0-360
 * @param s 0-100
 * @param l 0-100
 * @returns [r, g, b] 其中每个值 0-255
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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
 * @deprecated 现在文本应使用主题中性色 var(--text-main)，此函数保留以保持向后兼容
 * @param backgroundColor 背景色（hex 格式）
 * @param theme 主题模式：'light' 或 'dark'
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

/**
 * 对颜色进行柔化处理（用于 Dark 模式的 Border）
 * 降低饱和度 20-30%，限制亮度上限为 70%
 * @param baseColor hex 颜色字符串
 * @returns 柔化后的 hex 颜色
 */
export function softenColorForDark(baseColor: string): string {
  const [r, g, b] = hexToRgb(baseColor);
  let [h, s, l] = rgbToHsl(r, g, b);
  
  // 降低饱和度 20-30%（根据原饱和度调整）
  // 如果原饱和度很高（>80%），降低 30%；否则降低 20%
  const saturationReduction = s > 80 ? 30 : 25;
  s = Math.max(0, s - saturationReduction);
  
  // 限制亮度上限为 70%
  l = Math.min(70, l);
  
  const [newR, newG, newB] = hslToRgb(h, s, l);
  return rgbToHex(newR, newG, newB);
}

/**
 * 获取用于 Tint 背景色的颜色（用于 Dark 模式）
 * 相比 Border 颜色，Tint 需要更亮一些以提高在暗色背景下的可见度
 * @param baseColor hex 颜色字符串
 * @returns 适合做 tint 的 hex 颜色
 */
export function getTintColorForDark(baseColor: string): string {
  const [r, g, b] = hexToRgb(baseColor);
  let [h, s, l] = rgbToHsl(r, g, b);
  
  // 对于 tint，在暗黑模式下需要：
  // 1. 适当降低饱和度（但不如 border 那么低）
  const saturationReduction = s > 80 ? 20 : 15;
  s = Math.max(0, s - saturationReduction);
  
  // 2. 提高亮度以确保在暗色背景上可见
  // 如果原亮度较低，提高更多；如果原亮度较高，稍微提高即可
  if (l < 50) {
    l = Math.min(75, l + 20); // 低亮度颜色提高 20%
  } else {
    l = Math.min(75, l + 10); // 中等亮度颜色提高 10%
  }
  
  const [newR, newG, newB] = hslToRgb(h, s, l);
  return rgbToHex(newR, newG, newB);
}

/**
 * 对颜色进行增强处理（用于 Light 模式）
 * 提高饱和度和适当调整亮度，使颜色在明亮背景下更鲜明、区分度更高
 * @param baseColor hex 颜色字符串
 * @returns 增强后的 hex 颜色
 */
export function enhanceColorForLight(baseColor: string): string {
  const [r, g, b] = hexToRgb(baseColor);
  let [h, s, l] = rgbToHsl(r, g, b);
  
  // 提高饱和度 20-30%（根据原饱和度调整）
  // 如果原饱和度较低（<60%），提高 30%；否则提高 20%
  const saturationIncrease = s < 60 ? 30 : 20;
  s = Math.min(100, s + saturationIncrease);
  
  // 如果亮度太低（<40%），适当提高亮度以提高对比度
  // 如果亮度太高（>75%），适当降低亮度以避免与白色背景太接近
  if (l < 40) {
    l = Math.min(50, l + 10); // 提高暗色，但不超过50%
  } else if (l > 75) {
    l = Math.max(60, l - 10); // 降低过亮的颜色，但不低于60%
  }
  
  // 对于灰色系（饱和度<10%），提高饱和度以增加区分度
  if (s < 10) {
    s = Math.min(30, s + 20); // 给灰色增加一些颜色倾向
  }
  
  const [newR, newG, newB] = hslToRgb(h, s, l);
  return rgbToHex(newR, newG, newB);
}

/**
 * 获取 Tag 的 Border 颜色（根据主题适配）
 * @param baseColor 用户选择的基础颜色
 * @param theme 主题模式
 * @returns Border 颜色（hex 格式）
 */
export function getTagBorderColor(baseColor: string, theme: Theme): string {
  // 优化：如果主题是 'system'，直接从 DOM 读取（最快的方式）
  // 如果是 'light' 或 'dark'，直接使用（避免重复检测系统偏好）
  const effectiveTheme = theme === 'system' 
    ? getCurrentEffectiveThemeFromDOM() 
    : theme;
  const bgColor = effectiveTheme === 'light' ? '#ffffff' : '#252525'; // 对应 --bg-card
  let borderColor: string;
  
  if (effectiveTheme === 'light') {
    // Light 模式：增强颜色以提高对比度和区分度
    borderColor = enhanceColorForLight(baseColor);
  } else {
    // Dark 模式：柔化颜色以避免刺眼
    borderColor = softenColorForDark(baseColor);
  }
  
  // 确保 border 与背景的对比度 ≥ 3:1
  return ensureContrastRatio(borderColor, bgColor, 3.0);
}

/**
 * 获取 Tag 的 Tint 背景色（极浅的填充）
 * @param baseColor 用户选择的基础颜色
 * @param theme 主题模式
 * @returns Tint 颜色（rgba 格式）
 */
export function getTagTintColor(baseColor: string, theme: Theme): string {
  // 优化：如果主题是 'system'，直接从 DOM 读取（最快的方式）
  // 如果是 'light' 或 'dark'，直接使用（避免重复检测系统偏好）
  const effectiveTheme = theme === 'system' 
    ? getCurrentEffectiveThemeFromDOM() 
    : theme;
  let colorForTint: string;
  let opacity: number;
  
  if (effectiveTheme === 'light') {
    // Light 模式：使用增强后的颜色，10% 透明度（增强的颜色会让tint更明显）
    colorForTint = enhanceColorForLight(baseColor);
    opacity = 0.10;
  } else {
    // Dark 模式：使用专门优化的 tint 颜色，提高透明度和亮度以确保可见度
    colorForTint = getTintColorForDark(baseColor);
    opacity = 0.20; // 从 15% 提高到 20%，让 tint 更明显
  }
  
  // 注意：tint 是半透明的，对比度验证在最终渲染时进行
  // 这里直接返回 tint 颜色，文本对比度由 CSS 变量 var(--text-main) 保证
  const [r, g, b] = hexToRgb(colorForTint);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * 获取 Tag 的 Dot 颜色（用于辅助识别）
 * @param baseColor 用户选择的基础颜色
 * @param theme 主题模式
 * @returns Dot 颜色（hex 格式）
 */
export function getTagDotColor(baseColor: string, theme: Theme): string {
  // 优化：如果主题是 'system'，直接从 DOM 读取（最快的方式）
  // 如果是 'light' 或 'dark'，直接使用（避免重复检测系统偏好）
  const effectiveTheme = theme === 'system' 
    ? getCurrentEffectiveThemeFromDOM() 
    : theme;
  // Dot 颜色与 Border 颜色逻辑一致
  // Dot 通常显示在较暗的背景上，使用 --bg-panel 作为参考
  const bgColor = effectiveTheme === 'light' ? '#ffffff' : '#1e1e1e'; // 对应 --bg-panel
  const borderColor = getTagBorderColor(baseColor, theme);
  
  // 确保 dot 与背景的对比度 ≥ 3:1
  return ensureContrastRatio(borderColor, bgColor, 3.0);
}

/**
 * 确保两个颜色之间的对比度达到最低要求
 * 如果不达标，逐步调整第一个颜色直到达标
 * @param color1 需要调整的颜色
 * @param color2 参考颜色（通常是背景色）
 * @param minRatio 最低对比度要求（默认 3.0）
 * @returns 调整后的颜色（如果已达标则返回原色）
 */
export function ensureContrastRatio(
  color1: string,
  color2: string,
  minRatio: number = 3.0
): string {
  let currentRatio = getContrastRatio(color1, color2);
  
  if (currentRatio >= minRatio) {
    return color1; // 已达标，直接返回
  }
  
  // 需要调整颜色以提高对比度
  const [r, g, b] = hexToRgb(color1);
  const [bgR, bgG, bgB] = hexToRgb(color2);
  
  // 判断背景是亮还是暗
  const bgLuminance = getRelativeLuminance(color2);
  const isDarkBackground = bgLuminance < 0.5;
  
  // 调整策略：如果背景是暗的，让颜色更亮；如果背景是亮的，让颜色更暗
  let adjustedColor = color1;
  let attempts = 0;
  const maxAttempts = 20;
  
  while (currentRatio < minRatio && attempts < maxAttempts) {
    const [currR, currG, currB] = hexToRgb(adjustedColor);
    let [h, s, l] = rgbToHsl(currR, currG, currB);
    
    // 根据背景亮度调整
    if (isDarkBackground) {
      // 背景暗，让颜色更亮
      l = Math.min(100, l + 5);
    } else {
      // 背景亮，让颜色更暗
      l = Math.max(0, l - 5);
    }
    
    const [newR, newG, newB] = hslToRgb(h, s, l);
    adjustedColor = rgbToHex(newR, newG, newB);
    currentRatio = getContrastRatio(adjustedColor, color2);
    attempts++;
  }
  
  return adjustedColor;
}
