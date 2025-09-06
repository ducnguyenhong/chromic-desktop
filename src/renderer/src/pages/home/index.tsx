import '../../assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider as ChakraProvider } from '../../components/ui/provider'
import Home from './home'

createRoot(document.getElementById('home-root')!).render(
  <StrictMode>
    <ChakraProvider>
      <Home />
    </ChakraProvider>
  </StrictMode>
)
