import { Routes, Route } from 'react-router-dom';
import { Page } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { HomePage } from './HomePage';

export const App = () => {
  return (
    <Page.Main>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </Page.Main>
  );
};

export default App;
