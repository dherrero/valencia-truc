import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import App from './app';
import { LanguageProvider } from './i18n/LanguageProvider';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>,
    );
    expect(baseElement).toBeTruthy();
  });

  it('should render the home title', () => {
    const { getByText } = render(
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>,
    );
    expect(getByText(/Truc Valencia/i)).toBeTruthy();
  });
});
