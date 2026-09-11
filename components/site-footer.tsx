import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Reveal } from '@/components/reveal'
import {
  EnvelopeIcon,
  FacebookIcon,
  InstagramIcon,
  MapPinIcon,
  PhoneIcon,
  TikTokIcon,
  WhatsAppIcon,
} from '@/components/social-icons'
import {
  STORE_ADDRESS,
  STORE_ADDRESS_AR,
  STORE_EMAIL,
  STORE_MAPS_URL,
  STORE_PHONE,
  STORE_PHONE_E164,
} from '@/lib/contact'
import type { Dictionary, Locale } from '@/lib/i18n'
import {
  FACEBOOK_URL,
  INSTAGRAM_URL,
  SOCIAL_HANDLE,
  TIKTOK_HANDLE,
  TIKTOK_URL,
  WHATSAPP_URL,
} from '@/lib/social-links'
import type { StoreCategory } from '@/lib/store-categories'

const plaqueLink =
  'text-[#f3e4cc] transition-colors hover:text-[#e0c15a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#160d10]'

const actionCls =
  'inline-flex min-h-12 w-full items-center justify-center gap-2.5 border border-[#c9a44a]/45 bg-[#160d10] px-4 text-sm text-[#f3e4cc] transition-colors hover:border-[#e0c15a] hover:bg-[#e0c15a]/10 hover:text-[#e0c15a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#160d10] sm:text-[13px]'

const socialCls =
  'flex size-11 items-center justify-center border border-[#c9a44a]/45 text-[#e0c15a] transition-colors hover:border-[#e0c15a] hover:bg-[#e0c15a] hover:text-[#160d10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#160d10]'

export function SiteFooter({
  locale,
  dictionary,
  categories,
}: {
  locale: Locale
  dictionary: Dictionary
  categories: StoreCategory[]
}) {
  const rtl = locale === 'ar'
  const year = new Date().getFullYear()
  const address = rtl ? STORE_ADDRESS_AR : STORE_ADDRESS
  const phoneDisplay = `+216 ${STORE_PHONE}`
  const collectionLinks = [
    { href: '/products', label: dictionary.footer.shop },
    ...categories.map((category) => ({
      href: `/products?category=${category.slug}`,
      label: category.name,
    })),
  ]

  return (
    <footer
      className={`site-footer pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-16 ${rtl ? 'font-arabic' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <Reveal>
          <div className="site-footer-plaque px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
            <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:gap-6 md:text-start">
              <Logo size="md" className="border border-[#c9a44a]/30" />
              <div>
                <p
                  className={`font-serif text-[#f3e4cc] ${
                    rtl ? 'text-2xl font-medium tracking-normal' : 'text-2xl font-light tracking-[0.18em]'
                  }`}
                >
                  {dictionary.hero.title}
                </p>
                <p className={`mt-1.5 text-[#cbb89a] ${rtl ? 'text-sm' : 'text-xs tracking-wide'}`}>
                  {dictionary.footer.tagline}
                </p>
                <p className={`mt-0.5 text-[#e0c15a] ${rtl ? 'text-sm' : 'text-[11px] tracking-[0.22em]'}`}>
                  {dictionary.footer.location}
                </p>
              </div>
            </div>

            <nav aria-label={dictionary.footer.collections} className="site-footer-rule mt-8 pt-7">
              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start md:gap-x-7">
                {collectionLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch
                      className={`font-serif text-[#f3e4cc] transition-colors hover:text-[#e0c15a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#160d10] ${
                        rtl ? 'text-xl font-medium tracking-normal' : 'text-lg font-light tracking-wide'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="site-footer-rule mt-8 grid gap-8 pt-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:items-start lg:gap-12">
              <address className="flex flex-col gap-3 not-italic">
                <a
                  href={STORE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${plaqueLink} inline-flex items-start gap-3 text-sm leading-relaxed`}
                >
                  <MapPinIcon className="mt-0.5 shrink-0 text-[#e0c15a]" />
                  <span>{address}</span>
                </a>
                <a
                  href={`tel:+${STORE_PHONE_E164}`}
                  className={`${plaqueLink} inline-flex items-center gap-3 text-sm`}
                  dir="ltr"
                >
                  <PhoneIcon className="shrink-0 text-[#e0c15a]" />
                  {phoneDisplay}
                </a>
                <a
                  href={`mailto:${STORE_EMAIL}`}
                  className={`${plaqueLink} inline-flex items-center gap-3 text-sm break-all`}
                  dir="ltr"
                >
                  <EnvelopeIcon className="shrink-0 text-[#e0c15a]" />
                  {STORE_EMAIL}
                </a>
              </address>

              <div className="flex flex-col gap-2.5">
                <a href={STORE_MAPS_URL} target="_blank" rel="noopener noreferrer" className={actionCls}>
                  <MapPinIcon />
                  {dictionary.footer.visit}
                </a>
                <a href={`tel:+${STORE_PHONE_E164}`} className={actionCls}>
                  <PhoneIcon />
                  {dictionary.footer.call}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={actionCls}>
                  <WhatsAppIcon />
                  {dictionary.footer.whatsapp}
                </a>
              </div>
            </div>

            <div className="site-footer-rule mt-8 flex flex-col items-center gap-4 pt-7 sm:flex-row sm:justify-between">
              <p className={`text-[#cbb89a] ${rtl ? 'text-sm' : 'text-[11px] tracking-[0.22em]'}`}>
                {dictionary.footer.follow}
              </p>
              <nav aria-label={dictionary.footer.follow} className="flex items-center gap-2.5">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram @${SOCIAL_HANDLE}`}
                  className={socialCls}
                >
                  <InstagramIcon />
                </a>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`TikTok @${TIKTOK_HANDLE}`}
                  className={socialCls}
                >
                  <TikTokIcon />
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook Beit El Otour"
                  className={socialCls}
                >
                  <FacebookIcon />
                </a>
              </nav>
            </div>
          </div>
        </Reveal>

        <p
          className={`mt-6 flex flex-col items-center justify-between gap-2 text-[#cbb89a] sm:flex-row ${
            rtl ? 'text-sm' : 'text-[11px] tracking-wide'
          }`}
        >
          <span dir="ltr">{dictionary.footer.copyright(year)}</span>
          <span>
            {dictionary.footer.madeBy}{' '}
            <a
              href="https://www.revixa.agency/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e0c15a] transition-colors hover:text-[#f3e4cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#160d10]"
            >
              Revixa Agency
            </a>
          </span>
        </p>
      </div>
    </footer>
  )
}
