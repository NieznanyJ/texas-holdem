import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

import { createGlobalStyle } from 'styled-components';


export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #10251b;
    color: white;
  }

  #root {
    min-height: 100svh;
  }

  button, input, select, textarea {
    font: inherit;
  }
`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalStyle />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
