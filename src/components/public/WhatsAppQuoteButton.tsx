import { hasWhatsApp, quoteWhatsAppUrl } from '../../utils/whatsapp.ts'

type WhatsAppQuoteButtonProps = {
  themeName?: string
  className?: string
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true" fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
      <path d="M12.04 2.02c-5.46 0-9.91 4.44-9.91 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38c1.45.79 3.08 1.21 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01-1.87-1.87-4.36-2.89-7.02-2.89Zm0 18.13h-.01c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.82c0 4.55-3.7 8.24-8.22 8.24Z" />
    </svg>
  )
}

export function WhatsAppQuoteButton({ themeName, className }: WhatsAppQuoteButtonProps) {
  if (!hasWhatsApp()) {
    return null
  }

  return (
    <a
      href={quoteWhatsAppUrl(themeName)}
      target="_blank"
      rel="noreferrer"
      className={
        className ??
        'inline-flex items-center justify-center gap-2 bg-secondary text-textOnPrimary rounded-full min-h-12 px-7 font-heading font-semibold'
      }
    >
      <WhatsAppIcon />
      Faça seu orçamento
    </a>
  )
}
