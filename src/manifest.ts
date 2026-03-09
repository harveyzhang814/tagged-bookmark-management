import { defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'GrapeMark',
  default_locale: 'en',
  description: '快速收藏网页、添加多标签并以简洁优雅的方式管理收藏。',
  version: '0.5.2',
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
  permissions: ['storage', 'tabs', 'bookmarks', 'contextMenus', 'scripting', 'activeTab'],
  commands: {
    'open-global-search': {
      suggested_key: {
        default: 'Ctrl+Shift+K',
        mac: 'Command+Shift+K'
      },
      description: '打开全局搜索（任意网页）'
    }
  },
  content_scripts: [
    {
      matches: ['https://none.invalid/*'],
      js: ['src/content/globalSearch.ts']
    }
  ],
  icons: {
    '16': 'icons/icon-16.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png'
  },
  web_accessible_resources: []
});

export default manifest;


