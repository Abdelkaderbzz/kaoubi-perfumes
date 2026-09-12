'use client'

import { useServerInsertedHTML } from 'next/navigation'
import { useRef } from 'react'
import { THEME_STORAGE_KEY } from '@/lib/theme'

const THEME_BOOTSTRAP = `!function(){try{var r=document.documentElement;var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"){r.classList.add("dark");r.style.colorScheme="dark"}if(location.pathname.indexOf("/admin")!==0)r.classList.add("storefront")}catch(e){}}()`

/** Injected during SSR, outside the hydrated tree, so the first frame matches theme. */
export function ThemeScript() {
  const inserted = useRef(false)

  useServerInsertedHTML(() => {
    if (inserted.current) return null
    inserted.current = true

    return (
      <script
        id="wog-theme"
        dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
      />
    )
  })

  return null
}
