import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// Supabase sometimes redirects invite links to the Site URL (/) instead of
// /set-password when the redirect_to wasn't recorded in the token. Catch any
// invite token that arrives on the wrong page and reroute before React renders.
;(() => {
  const hash   = window.location.hash
  const search = window.location.search
  const path   = window.location.pathname

  const hasInviteInHash   = hash.includes('type=invite')
  const hasInviteInSearch = new URLSearchParams(search).get('type') === 'invite'

  if ((hasInviteInHash || hasInviteInSearch) && path !== '/set-password') {
    window.history.replaceState(null, '', '/set-password' + search + hash)
  }
})()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
