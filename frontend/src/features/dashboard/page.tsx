import { useQuery } from '@tanstack/react-query'
import { BookOpen, Camera, Mic, FileText, TreePine, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { vignettesApi } from '@/lib/api/vignettes'
import { photosApi } from '@/lib/api/photos'
import { audioApi } from '@/lib/api/audio'
import { filesApi } from '@/lib/api/files'

const quickLinks = [
  { to: '/vignettes', label: 'Vignettes', icon: BookOpen, description: 'Written stories & memories', color: 'text-blue-600' },
  { to: '/photos', label: 'Photos', icon: Camera, description: 'Photo gallery & albums', color: 'text-green-600' },
  { to: '/audio', label: 'Audio', icon: Mic, description: 'Voice recordings', color: 'text-purple-600' },
  { to: '/files', label: 'Files', icon: FileText, description: 'Documents & files', color: 'text-orange-600' },
  { to: '/family-tree', label: 'Family Tree', icon: TreePine, description: 'Interactive family diagram', color: 'text-emerald-600' },
  { to: '/timeline', label: 'Timeline', icon: Clock, description: 'Chronological memories', color: 'text-rose-600' },
]

export function DashboardPage() {
  const { user } = useAuthStore()

  const vignettes = useQuery({ queryKey: ['vignettes'], queryFn: vignettesApi.list })
  const photos = useQuery({ queryKey: ['photos'], queryFn: () => photosApi.list({ limit: 0 }) })
  const audio = useQuery({ queryKey: ['audio'], queryFn: audioApi.list })
  const files = useQuery({ queryKey: ['files'], queryFn: () => filesApi.list() })

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.full_name || user?.username || 'Family'}!`}
        description="Your family's stories, photos, and memories — all in one place."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Vignettes" value={vignettes.data?.length} icon={BookOpen} loading={vignettes.isLoading} />
        <StatsCard title="Photos" value={photos.data?.length} icon={Camera} loading={photos.isLoading} />
        <StatsCard title="Recordings" value={audio.data?.length} icon={Mic} loading={audio.isLoading} />
        <StatsCard title="Files" value={files.data?.length} icon={FileText} loading={files.isLoading} />
      </div>

      {/* Quick Links */}
      <h2 className="text-xl font-semibold mb-4">Explore</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(({ to, label, icon: Icon, description, color }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-lg bg-muted p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string
  value: number | undefined
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  )
}

export default DashboardPage
