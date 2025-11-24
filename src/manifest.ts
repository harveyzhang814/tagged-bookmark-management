import { defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: '标签书签管家',
  description: '快速收藏网页、添加多标签并以简洁优雅的方式管理收藏。',
  version: '0.1.0',
  action: {
    default_popup: 'src/pages/popup/main.html',
    default_icon: {
      '16': 'icons/icon-16.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png'
    }
  },
  options_page: 'src/pages/options/main.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  permissions: ['storage', 'tabs', 'bookmarks', 'contextMenus'],
  host_permissions: ['<all_urls>'],
  icons: {
    '16': 'icons/icon-16.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png'
  },
  web_accessible_resources: []
});

export default manifest;


