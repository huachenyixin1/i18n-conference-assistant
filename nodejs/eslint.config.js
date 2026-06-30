import js from '@eslint/js'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // Node globals
        process: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        // 全局函数（在其他JS文件中定义）
        get: 'readonly',
        post: 'readonly',
        put: 'readonly',
        delete: 'readonly',
        postForm: 'readonly',
        showToast: 'readonly',
        navigateTo: 'readonly',
        showPage: 'readonly',
        showView: 'readonly',
        loadDashboard: 'readonly',
        loadConferenceList: 'readonly',
        loadConferenceManage: 'readonly',
        initConferenceCreate: 'readonly',
        updateConferenceManageTab: 'readonly',
        toggleSidebar: 'readonly',
        openConferenceModal: 'readonly',
        handleLogin: 'readonly',
        handleRegister: 'readonly',
        handleForgotPassword: 'readonly',
        isLoggedIn: 'readonly',
        i18n: 'readonly',
        APP_CONFIG: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      // 1. 禁止使用 eval 类函数 (防止 XSS)
      'no-implied-eval': 'error',

      // 2. 禁止使用 var (使用 const/let)
      'no-var': 'error',

      // 3. 禁止未使用的变量 (防止垃圾代码)
      'no-unused-vars': 'warn',

      // 4. Prettier 格式约束
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: false,
          printWidth: 100,
          trailingComma: 'none',
        },
      ],
    },
  },
  {
    // 忽略检查的文件
    ignores: [
      'dist/**',
      '.wrangler/**',
      'node_modules/**',
      '**/*.min.js',
      'functions/api/[[path]].js', // Cloudflare Pages Functions 入口
    ],
  },
]