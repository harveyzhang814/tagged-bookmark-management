import { useState, useEffect, useRef } from 'react';
import { TAG_COLOR_PALETTE_24 } from '../lib/bookmarkService';
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from '../lib/colorUtils';
import './colorPicker.css';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

type ColorPickerTab = 'preset' | 'custom';

export const ColorPicker = ({ value, onChange, disabled = false }: ColorPickerProps) => {
  // 判断当前颜色是否为预设颜色
  const isPresetColor = TAG_COLOR_PALETTE_24.some(
    (presetColor) => presetColor.toLowerCase() === value.toLowerCase()
  );
  
  const [activeTab, setActiveTab] = useState<ColorPickerTab>(isPresetColor ? 'preset' : 'custom');
  const [hexInputValue, setHexInputValue] = useState<string>(value);

  // 当外部传入的 value 改变时，同步 hex 输入框的值
  useEffect(() => {
    setHexInputValue(value);
  }, [value]);

  // 当颜色值改变时，自动切换 tab（如果匹配预设颜色）
  useEffect(() => {
    const matchesPreset = TAG_COLOR_PALETTE_24.some(
      (presetColor) => presetColor.toLowerCase() === value.toLowerCase()
    );
    if (matchesPreset) {
      setActiveTab('preset');
    }
  }, [value]);

  const handlePresetColorClick = (presetColor: string) => {
    onChange(presetColor);
    // 选择预设颜色时，tab 会自动切换到 preset（通过 useEffect）
  };

  const handleCustomColorChange = (customColor: string) => {
    onChange(customColor);
    // 如果自定义颜色匹配预设颜色，tab 会自动切换（通过 useEffect）
  };

  return (
    <div className="color-picker">
      <div className="color-picker__tabs">
        <button
          type="button"
          className={`color-picker__tab ${activeTab === 'preset' ? 'color-picker__tab--active' : ''}`}
          onClick={() => setActiveTab('preset')}
          disabled={disabled}
        >
          预设
        </button>
        <button
          type="button"
          className={`color-picker__tab ${activeTab === 'custom' ? 'color-picker__tab--active' : ''}`}
          onClick={() => setActiveTab('custom')}
          disabled={disabled}
        >
          自定义
        </button>
      </div>
      
      <div className="color-picker__content">
        {activeTab === 'preset' ? (
          <div className="color-picker__preset-colors">
            {TAG_COLOR_PALETTE_24.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                className={`color-picker__color-swatch ${
                  value.toLowerCase() === presetColor.toLowerCase()
                    ? 'color-picker__color-swatch--active'
                    : ''
                }`}
                style={{ backgroundColor: presetColor }}
                onClick={() => handlePresetColorClick(presetColor)}
                title={presetColor}
                aria-label={`选择预设颜色 ${presetColor}`}
                disabled={disabled}
              />
            ))}
          </div>
        ) : (
          <CustomColorPicker
            value={value}
            onChange={handleCustomColorChange}
            disabled={disabled}
            hexInputValue={hexInputValue}
            setHexInputValue={setHexInputValue}
          />
        )}
      </div>
    </div>
  );
};

/**
 * 自定义颜色选择器组件
 * 包含完整的色谱选择器和 Hex 输入框
 */
interface CustomColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  hexInputValue: string;
  setHexInputValue: (value: string) => void;
}

const CustomColorPicker = ({
  value,
  onChange,
  disabled = false,
  hexInputValue,
  setHexInputValue,
}: CustomColorPickerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // 从当前颜色值初始化 HSL
  useEffect(() => {
    try {
      const [r, g, b] = hexToRgb(value);
      const [h, s, l] = rgbToHsl(r, g, b);
      setHue(h);
      setSaturation(s);
      setLightness(l);
    } catch {
      // 如果颜色值无效，使用默认值
    }
  }, [value]);


  // 处理窗口大小变化和初始渲染
  useEffect(() => {
    const updateCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = rect.width || 200;
      const displayHeight = rect.height || 150;
      const width = Math.floor(displayWidth * dpr);
      const height = Math.floor(displayHeight * dpr);
      
      // 只在尺寸变化时更新 canvas 尺寸
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        ctx.scale(dpr, dpr);
      }
      
      // 重新绘制
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const s = (x / width) * 100;
          const l = 100 - (y / height) * 100;
          const [r, g, b] = hslToRgb(hue, s, l);
          const index = (y * width + x) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    // 延迟执行以确保 DOM 已渲染
    const timeoutId = setTimeout(updateCanvas, 0);
    
    window.addEventListener('resize', updateCanvas);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvas);
    };
  }, [hue]);

  // 色相条使用 CSS 渐变，不需要 canvas

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 使用显示尺寸计算百分比
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    const s = Math.max(0, Math.min(100, Math.round((x / displayWidth) * 100)));
    const l = Math.max(0, Math.min(100, Math.round(100 - (y / displayHeight) * 100)));

    setSaturation(s);
    setLightness(l);

    const [r, g, b] = hslToRgb(hue, s, l);
    const newColor = rgbToHex(r, g, b);
    onChange(newColor);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || disabled) return;
    handleCanvasClick(e);
  };

  const handleHueBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const bar = e.currentTarget;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newHue = Math.round((x / rect.width) * 360);
    setHue(Math.max(0, Math.min(360, newHue)));

    const [r, g, b] = hslToRgb(newHue, saturation, lightness);
    const newColor = rgbToHex(r, g, b);
    onChange(newColor);
  };

  const handleHueBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingHue || disabled) return;
    handleHueBarClick(e);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hexValue = e.target.value.trim();
    if (!hexValue.startsWith('#')) {
      hexValue = '#' + hexValue.replace(/^#*/, '');
    }
    hexValue = hexValue.slice(0, 7);
    if (/^#[0-9A-Fa-f]*$/.test(hexValue)) {
      setHexInputValue(hexValue);
      if (hexValue.length === 7 && /^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
        onChange(hexValue);
      }
    }
  };

  const handleHexInputBlur = () => {
    let hexValue = hexInputValue.trim();
    if (!hexValue.startsWith('#')) {
      hexValue = '#' + hexValue.replace(/^#*/, '');
    }
    if (hexValue.length > 1 && hexValue.length < 7) {
      const hexDigits = hexValue.slice(1);
      const paddedHex = hexDigits.padEnd(6, '0').slice(0, 6);
      hexValue = '#' + paddedHex;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
      setHexInputValue(hexValue);
      onChange(hexValue);
    } else {
      setHexInputValue(value);
    }
  };

  const saturationPercent = saturation;
  const lightnessPercent = lightness;
  const huePercent = (hue / 360) * 100;

  return (
    <div className="color-picker__custom-section">
      <div className="color-picker__spectrum">
        <div className="color-picker__canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="color-picker__canvas"
            onClick={handleCanvasClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          />
          <div
            className="color-picker__canvas-indicator"
            style={{
              left: `${saturationPercent}%`,
              top: `${100 - lightnessPercent}%`,
            }}
          />
        </div>
        <div
          className="color-picker__hue-bar"
          onClick={handleHueBarClick}
          onMouseDown={() => setIsDraggingHue(true)}
          onMouseMove={handleHueBarMouseMove}
          onMouseUp={() => setIsDraggingHue(false)}
          onMouseLeave={() => setIsDraggingHue(false)}
        >
          <div
            className="color-picker__hue-indicator"
            style={{ left: `${huePercent}%` }}
          />
        </div>
      </div>
      <div className="color-picker__custom-inputs">
        <div className="color-picker__preview" style={{ backgroundColor: value }} />
        <input
          type="text"
          className="color-picker__hex-input"
          value={hexInputValue}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          placeholder="#000000"
          disabled={disabled}
          maxLength={7}
        />
      </div>
    </div>
  );
};
