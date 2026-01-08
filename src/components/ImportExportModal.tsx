import { useEffect, useRef, useState } from 'react';
import { PixelButton } from './PixelButton';
import { ToggleSwitch } from './ToggleSwitch';
import {
  exportData,
  generateExportFilename,
  importData,
  parseImportFile,
  downloadFile
} from '../lib/importExportService';
import type { ImportFileData } from '../lib/types';
import './importExportModal.css';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const ImportExportModal = ({ isOpen, onClose, onImportSuccess }: ImportExportModalProps) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [fileData, setFileData] = useState<ImportFileData | null>(null);
  const [importMode, setImportMode] = useState<'overwrite' | 'incremental'>('incremental');
  const [includeHistory, setIncludeHistory] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportSuccess, setIsImportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importStartTimeRef = useRef<number>(0);

  // 当弹窗打开时，重置状态
  useEffect(() => {
    if (isOpen) {
      setFileData(null);
      setImportMode('incremental');
      setIncludeHistory(false);
      setIsDragOver(false);
      setIsImporting(false);
      setIsImportSuccess(false);
      setIsExporting(false);
      setError(null);
      importStartTimeRef.current = 0;
    }
  }, [isOpen]);

  // 根据文件数据更新includeHistory的默认值
  useEffect(() => {
    if (fileData && fileData.metadata.hasClickHistory) {
      setIncludeHistory(true);
    } else {
      setIncludeHistory(false);
    }
  }, [fileData]);

  const handleFileSelect = async (file: File) => {
    setError(null);
    try {
      const parsed = await parseImportFile(file);
      setFileData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败');
      setFileData(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/json') {
      void handleFileSelect(file);
    } else {
      setError('请选择JSON格式的文件');
    }
  };

  const handleImport = async () => {
    if (!fileData) return;

    setIsImporting(true);
    setIsImportSuccess(false);
    setError(null);
    importStartTimeRef.current = Date.now();

    try {
      await importData(importMode, includeHistory, fileData);
      
      // 确保最少显示0.5s的加载动画
      const elapsed = Date.now() - importStartTimeRef.current;
      const minDuration = 500;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      // 显示成功状态
      setIsImporting(false);
      setIsImportSuccess(true);

      // 1秒后关闭并刷新
      setTimeout(() => {
        onClose();
        if (onImportSuccess) {
          onImportSuccess();
        }
      }, 1000);
    } catch (err) {
      setIsImporting(false);
      setIsImportSuccess(false);
      setError(err instanceof Error ? err.message : '导入失败');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const jsonString = await exportData(includeHistory);
      const filename = generateExportFilename();
      downloadFile(jsonString, filename);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="import-export-modal__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="import-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="import-export-modal__header">
          <h2 className="import-export-modal__title">数据迁移</h2>
          <button
            className="import-export-modal__close"
            onClick={onClose}
            aria-label="关闭"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="import-export-modal__tabs">
          <button
            type="button"
            className={`import-export-modal__tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>导入</span>
          </button>
          <button
            type="button"
            className={`import-export-modal__tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>导出</span>
          </button>
        </div>

        <div className="import-export-modal__content">
          {error && (
            <div className="import-export-modal__error">
              {error}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-export-modal__import">
              {isImporting || isImportSuccess ? (
                <div className="import-export-modal__status">
                  {isImporting && (
                    <>
                      <div className="import-export-modal__spinner">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="47"
                            strokeDashoffset="47"
                            opacity="0.3"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="47"
                            strokeDashoffset="11.75"
                            className="import-export-modal__spinner-circle"
                          />
                        </svg>
                      </div>
                      <p className="import-export-modal__status-text">导入中...</p>
                    </>
                  )}
                  {isImportSuccess && (
                    <>
                      <div className="import-export-modal__success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <p className="import-export-modal__status-text">导入完成</p>
                    </>
                  )}
                </div>
              ) : !fileData ? (
                <>
                  <div
                    className={`import-export-modal__dropzone ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <p className="import-export-modal__dropzone-text">
                      拖拽文件到此处，或
                      <button
                        type="button"
                        className="import-export-modal__dropzone-button"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        点击选择文件
                      </button>
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="import-export-modal__file-info">
                    <h3 className="import-export-modal__file-info-title">文件信息</h3>
                    <div className="import-export-modal__file-info-item">
                      <span className="import-export-modal__file-info-label">书签数量：</span>
                      <span className="import-export-modal__file-info-value">{fileData.bookmarksCount}</span>
                    </div>
                    <div className="import-export-modal__file-info-item">
                      <span className="import-export-modal__file-info-label">标签数量：</span>
                      <span className="import-export-modal__file-info-value">{fileData.tagsCount}</span>
                    </div>
                    <div className="import-export-modal__file-info-item">
                      <span className="import-export-modal__file-info-label">包含历史记录：</span>
                      <span className="import-export-modal__file-info-value">
                        {fileData.metadata.hasClickHistory ? '是' : '否'}
                      </span>
                    </div>
                  </div>

                  <div className="import-export-modal__field">
                    <label className="import-export-modal__label">导入模式</label>
                    <div className="import-export-modal__radio-group">
                      <label className="import-export-modal__radio">
                        <input
                          type="radio"
                          name="importMode"
                          value="incremental"
                          checked={importMode === 'incremental'}
                          onChange={(e) => setImportMode(e.target.value as 'incremental')}
                        />
                        <span>增量（仅新增不存在的数据）</span>
                      </label>
                      <label className="import-export-modal__radio">
                        <input
                          type="radio"
                          name="importMode"
                          value="overwrite"
                          checked={importMode === 'overwrite'}
                          onChange={(e) => setImportMode(e.target.value as 'overwrite')}
                        />
                        <span>覆盖（替换所有现有数据）</span>
                      </label>
                    </div>
                  </div>

                  {fileData.metadata.hasClickHistory && (
                    <div className="import-export-modal__field">
                      <ToggleSwitch
                        checked={includeHistory}
                        onChange={setIncludeHistory}
                        label="导入历史点击记录"
                      />
                    </div>
                  )}

                  <div className="import-export-modal__actions">
                    <PixelButton
                      variant="secondary"
                      onClick={() => {
                        setFileData(null);
                        setError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      disabled={isImporting}
                    >
                      重新选择
                    </PixelButton>
                    <PixelButton onClick={handleImport} disabled={isImporting}>
                      {isImporting ? '导入中...' : '导入'}
                    </PixelButton>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="import-export-modal__export">
              <div className="import-export-modal__field">
                <ToggleSwitch
                  checked={includeHistory}
                  onChange={setIncludeHistory}
                  label="导出历史点击记录"
                />
                <p className="import-export-modal__hint">
                  导出后将包含所有书签的点击历史数据
                </p>
              </div>

              <div className="import-export-modal__actions">
                <PixelButton variant="secondary" onClick={onClose} disabled={isExporting}>
                  取消
                </PixelButton>
                <PixelButton onClick={handleExport} disabled={isExporting}>
                  {isExporting ? '导出中...' : '导出'}
                </PixelButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
