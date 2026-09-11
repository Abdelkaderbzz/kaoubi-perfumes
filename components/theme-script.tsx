import Script from 'next/script'
import { THEME_STORAGE_KEY } from '@/lib/theme'

/** Runs before paint so the first frame matches theme and storefront scale. */
export function ThemeScript() {
  const script = `!function(){try{var r=document.documentElement;var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"){r.classList.add("dark");r.style.colorScheme="dark"}if(location.pathname.indexOf("/admin")!==0)r.classList.add("storefront")}catch(e){}}()`

  return (
    <Script id="kaoubi-theme" strategy="beforeInteractive">
      {script}
    </Script>
  )
}
