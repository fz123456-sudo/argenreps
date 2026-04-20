import VendedorPage from '@/components/VendedorPage'

export default function Page({ params }: { params: { slug: string } }) {
  return <VendedorPage slug={params.slug} />
}
