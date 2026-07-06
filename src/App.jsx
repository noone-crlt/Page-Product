import React from 'react'
import { AppProvider } from './context/AppContext'
import ProductsPage from './pages/ProductsPage'

function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <ProductsPage />
      </div>
    </AppProvider>
  )
}

export default App
