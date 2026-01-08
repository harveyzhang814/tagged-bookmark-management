import { useState, useEffect, useRef } from 'react';
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from '../lib/colorUtils';
import './customColorPicker.css';

interface CustomColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  hexInputValue: string;
  setHexInputValue: (value: string) => void;
}

export const CustomColorPicker = ({
  value,
  onChange,
  disabled = false,
  hexInputValue,
  setHexInputValue,
}: CustomColorPickerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // 从当前颜色值初始化 HSL
  useEffect(() => {
    const [r, g, b] = hexToRgb(value);
    const [h, s, l] = rgbToHsl(r, g, b);
    setHue(h);
    setSaturation(s);
    setLightness(l);
  }, [value]);

  // 绘制饱和度/亮度选择区域
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 创建渐变：水平方向是饱和度（左到右：0% 到 100%），垂直方向是亮度（上到下：100% 到 0%）
    // 使用当前色相
    for (let x = 0; x < width; x++) {
      const s = (x / width) * 100;
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      
      // 从上到下：从白色到纯色到黑色
      gradient.addColorStop(0, `hsl(${hue}, ${s}%, 100%)`); // 顶部：白色
      gradient.addColorStop(0.5, `hsl(${hue}, ${s}%, 50%)`); // 中间：纯色
      gradient.addColorStop(1, `hsl(${hue}, ${s}%, 0%)`); // 底部：黑色

      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, 1, height);
    }
  }, [hue]);

  // 当 HSL 改变时，更新颜色值（但排除外部 value 变化导致的 HSL 初始化）
  const isInitializing = useRef(true);
  useEffect(() => {
    if (isInitializing.current) {
      isInitializing.current = false;
      return;
    }
    const [r, g, b] = hslToRgb(hue, saturation, lightness);
    const newColor = rgbToHex(r, g, b);
    if (newColor.toLowerCase() !== value.toLowerCase()) {
      onChange(newColor);
      setHexInputValue(newColor);
    }
  }, [hue, saturation, lightness]);

  // 当外部 value 改变时，重置初始化标志
  useEffect(() => {
    isInitializing.current = true;
  }, [value]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const s = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const l = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));

    setSaturation(s);
    setLightness(l);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || disabled) return;
    handleCanvasClick(e);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDragging(true);
    handleCanvasClick(e);
  };

  const handleHueSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const slider = hueSliderRef.current;
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const h = Math.max(0, Math.min(360, (x / rect.width) * 360));
    setHue(h);
  };

  const handleHueSliderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingHue || disabled) return;
    handleHueSliderClick(e);
  };

  const handleHueSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDraggingHue(true);
    handleHueSliderClick(e);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingHue(false);
    };

    if (isDragging || isDraggingHue) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isDraggingHue]);

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

  const handleHexInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let hexValue = e.target.value.trim();
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

  const canvasX = (saturation / 100) * 200;
  const canvasY = (1 - lightness / 100) * 150;
  const hueX = (hue / 360) * 100;

  return (
    <div className="custom-color-picker">
      <div className="custom-color-picker__canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={200}
          height={150}
          className="custom-color-picker__canvas"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          style={{ cursor: disabled ? 'not-allowed' : 'crosshair' }}
        />
        <div
          className="custom-color-picker__picker-indicator"
          style={{
            left: `${canvasX}px`,
            top: `${canvasY}px`,
            pointerEvents: 'none',
          }}
        />
      </div>
      <div className="custom-color-picker__hue-slider-wrapper">
        <div
          ref={hueSliderRef}
          className="custom-color-picker__hue-slider"
          onClick={handleHueSliderClick}
          onMouseMove={handleHueSliderMouseMove}
          onMouseDown={handleHueSliderMouseDown}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        <div
          className="custom-color-picker__hue-indicator"
          style={{
            left: `${hueX}%`,
            pointerEvents: 'none',
          }}
        />
      </div>
      <div className="custom-color-picker__inputs">
        <input
          type="text"
          className="custom-color-picker__hex-input"
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
