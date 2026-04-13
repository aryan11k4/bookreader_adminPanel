import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ✅ Change this object to switch the entire theme
const theme = {
  token: {
    colorPrimary: '#0d9488',      // teal-600
    colorSuccess: '#16a34a',
    colorLink: '#0d9488',
    colorBgLayout: '#f0fdf9',     // very light teal page background
    colorBgContainer: '#ffffff',
    borderRadius: 8,
  },
  components: {
    Menu: {
      darkItemBg: '#0f2724',
      darkSubMenuItemBg: '#0f2724',
      darkItemSelectedBg: '#0d9488',
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
