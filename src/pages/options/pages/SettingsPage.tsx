import { useCallback, useEffect, useState } from 'react';
import {
  type BookmarkOpenMode,
  getBrowserDefaultOpenMode,
  getBrowserTagWorkstationOpenMode,
  saveBrowserDefaultOpenMode,
  saveBrowserTagWorkstationOpenMode
} from '../../../lib/storage';
import './settingsPage.css';

export const SettingsPage = () => {
  const [defaultOpenMode, setDefaultOpenMode] = useState<BookmarkOpenMode>('newTab');
  const [tagWorkstationOpenMode, setTagWorkstationOpenMode] = useState<BookmarkOpenMode>('newTab');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [defaultMode, tagWorkstationMode] = await Promise.all([
        getBrowserDefaultOpenMode(),
        getBrowserTagWorkstationOpenMode()
      ]);
      if (cancelled) return;
      setDefaultOpenMode(defaultMode);
      setTagWorkstationOpenMode(tagWorkstationMode);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDefaultOpenModeChange = useCallback((mode: BookmarkOpenMode) => {
    setDefaultOpenMode(mode);
    void saveBrowserDefaultOpenMode(mode);
  }, []);

  const handleTagWorkstationOpenModeChange = useCallback((mode: BookmarkOpenMode) => {
    setTagWorkstationOpenMode(mode);
    void saveBrowserTagWorkstationOpenMode(mode);
  }, []);

  return (
    <div className="settings-page">
      <section className="pixel-panel settings-module">
        <h3 className="section-title">浏览器</h3>

        <div className="settings-row">
          <label className="settings-row__label" htmlFor="settings-default-open-mode">
            书签默认打开方式
          </label>
          <div className="settings-row__control">
            <select
              id="settings-default-open-mode"
              className="settings-select"
              value={defaultOpenMode}
              onChange={(e) => handleDefaultOpenModeChange(e.target.value as BookmarkOpenMode)}
            >
              <option value="newTab">新标签页</option>
              <option value="newWindow">新独立窗口</option>
            </select>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-row__label" htmlFor="settings-tag-workstation-open-mode">
            标签/工作区书签打开方式
          </label>
          <div className="settings-row__control">
            <select
              id="settings-tag-workstation-open-mode"
              className="settings-select"
              value={tagWorkstationOpenMode}
              onChange={(e) => handleTagWorkstationOpenModeChange(e.target.value as BookmarkOpenMode)}
            >
              <option value="newTab">新标签页</option>
              <option value="newWindow">新独立窗口</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
};


