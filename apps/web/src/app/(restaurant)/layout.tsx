import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RestaurantNavbar from '@/components/RestaurantNavbar'

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'restaurant') redirect('/home')

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
