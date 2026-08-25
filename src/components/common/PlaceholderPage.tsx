import logo from '../../assets/logo/claramel-logo.png'

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main className="bg-background min-h-svh flex flex-col items-center justify-center gap-6 p-6">
      <img
        src={logo}
        alt="Claramel Artigos para festas"
        className="h-24 w-auto max-w-[280px] object-contain"
      />
      <h1 className="font-heading text-title text-3xl font-semibold text-center">{title}</h1>
    </main>
  )
}
