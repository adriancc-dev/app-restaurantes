'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Profile } from '@repo/shared'
import AvatarCropper from './AvatarCropper'

interface ProfileStats {
  totalReservations: number
  restaurantsVisited: number
  completeness: number
}

interface ProfileHeroProps {
  profile: Profile
  stats: ProfileStats
  emailVerified: boolean
}

export default function ProfileHero({ profile, stats, emailVerified }: ProfileHeroProps) {
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(profile.avatar_url)
  const [cropFile, setCropFile]     = useState<File | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = profile.full_name
    ? profile.full_name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : (profile.email[0]?.toUpperCase() ?? '?')

  const memberSince = format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: es })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setUploadError('La imagen no puede superar los 10 MB.'); return }
    setCropFile(file)
    if (e.target) e.target.value = ''
  }

  async function handleCropConfirm(blob: Blob) {
    setCropFile(null)
    setUploading(true)
    setUploadError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const filePath = `${user.id}/avatar.jpg`
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })

    const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (uploadErr) { setUploadError('No se pudo subir la imagen.'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  const barColor =
    stats.completeness >= 100 ? 'bg-green-500' :
    stats.completeness >= 66  ? 'bg-primary-500' :
    stats.completeness >= 33  ? 'bg-yellow-400' :
    'bg-red-400'

  return (
    <>
      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      <div className="card overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 relative">
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 60%, white 1.5px, transparent 1.5px), radial-gradient(circle at 75% 25%, white 1.5px, transparent 1.5px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Cambiar foto de perfil"
                className="group relative w-20 h-20 rounded-full ring-4 ring-white dark:ring-gray-900 overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center shadow-md focus:outline-none focus-visible:ring-primary-500"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-300 select-none">
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? (
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Name + meta */}
          <div className="mb-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {profile.full_name ?? 'Sin nombre'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              {emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  Sin verificar
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Miembro desde {memberSince}</p>
            {profile.phone    && <p className="text-xs text-gray-400 dark:text-gray-500">{profile.phone}</p>}
            {profile.location && <p className="text-xs text-gray-400 dark:text-gray-500">{profile.location}</p>}
          </div>

          {uploadError && <p className="text-sm text-red-500 mt-2 mb-1">{uploadError}</p>}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Stat value={stats.totalReservations} label="Reservas" />
            <Stat value={stats.restaurantsVisited} label="Restaurantes" />
            <Stat
              value={`${stats.completeness}%`}
              label="Perfil"
              valueClass={stats.completeness >= 100 ? 'text-green-500' : 'text-primary-600'}
            />
          </div>

          {stats.completeness < 100 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Completa tu perfil para una mejor experiencia</p>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{stats.completeness}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${stats.completeness}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Stat({ value, label, valueClass }: { value: string | number; label: string; valueClass?: string }) {
  return (
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
      <p className={`text-2xl font-bold ${valueClass ?? 'text-gray-900 dark:text-white'}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
