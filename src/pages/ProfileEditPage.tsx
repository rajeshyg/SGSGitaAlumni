import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAlumniProfile } from '../hooks/useAlumniData'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { LoadingSpinner } from '../components/ui/loading-spinner'
import { Alert, AlertDescription } from '../components/ui/alert'
import { logger as appLogger } from '../lib/monitoring'

const logger = {
  info: (message: string, ...args: unknown[]) => appLogger.info(`[ProfileEditPage] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => appLogger.warn(`[ProfileEditPage] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => appLogger.error(`[ProfileEditPage] ${message}`, ...args)
}

export default function ProfileEditPage() {
  const { user } = useAuth()
  const userId = useMemo(() => (user?.id ? String(user.id) : undefined), [user])
  const { profile, isLoading, error, fetchProfile, updateProfile } = useAlumniProfile(userId)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [currentPosition, setCurrentPosition] = useState('')
  const [location, setLocation] = useState('')
  const [company, setCompany] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      logger.info('Fetching profile', { userId })
      fetchProfile(userId)
    }
  }, [userId, fetchProfile])

  useEffect(() => {
    if (profile) {
      setFirstName(String(profile.firstName ?? ''))
      setLastName(String(profile.lastName ?? ''))
      setCurrentPosition(String(profile.currentPosition ?? ''))
      setLocation(String(profile.location ?? ''))
      setCompany(String(profile.company ?? ''))
      setLinkedinUrl(String(profile.linkedinUrl ?? ''))
      setBio(String(profile.bio ?? ''))
    }
  }, [profile])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const updated = await updateProfile({
        firstName,
        lastName,
        currentPosition,
        company,
        location,
        linkedinUrl,
        bio
      })
      logger.info('Profile updated')
      setSaveSuccess('Profile updated successfully')
      // Optimistically reflect updated values
      if (updated) {
        // Reflect updated first name if present
        setFirstName(String((updated as any).firstName ?? firstName))
      }
    } catch (e) {
      logger.error('Failed to update profile', e as any)
      setSaveError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="container mx-auto max-w-3xl">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
            {saveSuccess && (
              <Alert>
                <AlertDescription>{saveSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First name</label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div>
                <label className="text-sm font-medium">Last name</label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Current position</label>
                <Input value={currentPosition} onChange={e => setCurrentPosition(e.target.value)} placeholder="e.g., Software Engineer" />
              </div>
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" />
              </div>
              <div>
                <label className="text-sm font-medium">LinkedIn URL</label>
                <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself" rows={4} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => fetchProfile(userId)} disabled={saving || !userId}>Reload</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


