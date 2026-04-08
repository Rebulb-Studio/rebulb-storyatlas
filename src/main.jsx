import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import StoryAtlasWorkspace from './StoryAtlas.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoryAtlasWorkspace />
    <Analytics />
  </React.StrictMode>
)
