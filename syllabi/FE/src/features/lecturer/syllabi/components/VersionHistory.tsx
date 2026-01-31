/**
 * VersionHistory Component
 *
 * Displays version timeline with timestamps, change summaries, and comparison functionality.
 * Allows reverting to previous versions.
 *
 * Features:
 * - Display version timeline with timestamps
 * - Show change summaries for each version
 * - Compare versions functionality
 * - Revert to previous versions
 *
 * Requirements: 3.6, 3.7
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  History,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  GitCompare,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { getVersionHistory } from '@/features/lecturer/api/syllabus.api'
import { useTranslation } from '@/features/lecturer/hooks/useTranslation'
import type { VersionHistory as VersionHistoryType } from '@/features/lecturer/types'

export interface VersionHistoryProps {
  syllabusId: number
  currentVersion: string
  onRevert?: (versionId: number) => Promise<void>
  className?: string
}

export function VersionHistory({
  syllabusId,
  currentVersion,
  onRevert,
  className,
}: VersionHistoryProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(
    new Set()
  )
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<{
    from?: VersionHistoryType
    to?: VersionHistoryType
  }>({})
  const [versionToRevert, setVersionToRevert] =
    useState<VersionHistoryType | null>(null)

  // Fetch version history
  const {
    data: versions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lecturer', 'syllabi', syllabusId, 'versions'],
    queryFn: () => getVersionHistory(syllabusId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Revert mutation
  const revertMutation = useMutation({
    mutationFn: async (versionId: number) => {
      if (onRevert) {
        await onRevert(versionId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'syllabi', syllabusId],
      })
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'syllabi', syllabusId, 'versions'],
      })
      setRevertDialogOpen(false)
      setVersionToRevert(null)
    },
  })

  // Toggle version expansion
  const toggleVersion = (versionId: number) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(versionId)) {
        newSet.delete(versionId)
      } else {
        newSet.add(versionId)
      }
      return newSet
    })
  }

  // Handle compare versions
  const handleCompare = (version: VersionHistoryType) => {
    if (!selectedVersions.from) {
      setSelectedVersions({ from: version })
    } else if (!selectedVersions.to) {
      setSelectedVersions({ ...selectedVersions, to: version })
      setCompareDialogOpen(true)
    } else {
      // Reset and start new comparison
      setSelectedVersions({ from: version })
    }
  }

  // Handle revert
  const handleRevert = (version: VersionHistoryType) => {
    setVersionToRevert(version)
    setRevertDialogOpen(true)
  }

  // Confirm revert
  const confirmRevert = () => {
    if (versionToRevert) {
      revertMutation.mutate(versionToRevert.id)
    }
  }

  // Get section display name
  const getSectionName = (section: string): string => {
    const sectionMap: Record<string, string> = {
      courseInformation: t('preview.sections.courseInformation'),
      learningOutcomes: t('preview.sections.learningOutcomes'),
      cloPloMapping: t('preview.sections.cloPloMapping'),
      courseContent: t('preview.sections.courseContent'),
      assessmentMethods: t('preview.sections.assessmentMethods'),
      references: t('preview.sections.references'),
    }
    return sectionMap[section] || section
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get relative time
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return t('autoSave.justNow')
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return t('autoSave.minutesAgo', { count: minutes })
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return t('autoSave.hoursAgo', { count: hours })
    } else {
      return formatDate(dateString)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className='space-y-2 text-center'>
          <div className='mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary' />
          <p className='text-sm text-muted-foreground'>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('', className)}>
        <Card className='border-destructive'>
          <CardContent className='py-6'>
            <div className='flex items-center gap-2 text-destructive'>
              <AlertCircle className='h-5 w-5' />
              <p className='text-sm font-medium'>{t('errors.generic')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty state
  if (!versions || versions.length === 0) {
    return (
      <div className={cn('', className)}>
        <Card>
          <CardContent className='py-8'>
            <div className='space-y-2 text-center'>
              <History className='mx-auto h-12 w-12 text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>
                {t('versionHistory.noVersions')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with compare mode indicator */}
      {selectedVersions.from && !selectedVersions.to && (
        <Card className='border-primary'>
          <CardContent className='py-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <GitCompare className='h-4 w-4 text-primary' />
                <p className='text-sm font-medium'>
                  {t('versionHistory.compareMode')}
                </p>
                <Badge variant='outline'>
                  {t('versionHistory.selected')}:{' '}
                  {selectedVersions.from.version}
                </Badge>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSelectedVersions({})}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version Timeline */}
      <div
        className='space-y-3'
        role='list'
        aria-label={t('versionHistory.title')}
      >
        {versions.map((version, index) => {
          const isExpanded = expandedVersions.has(version.id)
          const isCurrent = version.version === currentVersion
          const isSelected =
            selectedVersions.from?.id === version.id ||
            selectedVersions.to?.id === version.id

          return (
            <Card
              key={version.id}
              role='listitem'
              className={cn(
                'transition-all',
                isCurrent && 'border-primary',
                isSelected && 'ring-2 ring-primary'
              )}
            >
              <CardContent className='p-4'>
                {/* Version Header */}
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex flex-1 items-start gap-3'>
                    {/* Timeline Indicator */}
                    <div className='relative flex flex-col items-center'>
                      <div
                        className={cn(
                          'flex size-8 items-center justify-center rounded-full border-2',
                          isCurrent
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted bg-background text-muted-foreground'
                        )}
                      >
                        {isCurrent ? (
                          <CheckCircle2 className='size-4' />
                        ) : (
                          <History className='size-4' />
                        )}
                      </div>
                      {index < versions.length - 1 && (
                        <div className='mt-2 h-12 w-0.5 bg-muted' />
                      )}
                    </div>

                    {/* Version Info */}
                    <div className='flex-1 space-y-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h4 className='font-semibold'>
                          {t('versionHistory.version')} {version.version}
                        </h4>
                        {isCurrent && (
                          <Badge variant='default'>
                            {t('versionHistory.current')}
                          </Badge>
                        )}
                      </div>

                      <p className='text-sm text-muted-foreground'>
                        {version.changeSummary}
                      </p>

                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <User className='size-3' />
                          <span>{version.changedByName}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Clock className='size-3' />
                          <span>{getRelativeTime(version.changedAt)}</span>
                        </div>
                      </div>

                      {/* Changes Summary */}
                      {version.changes.length > 0 && (
                        <div className='flex items-center gap-2 text-xs'>
                          <Badge variant='secondary' className='text-xs'>
                            {version.changes.length}{' '}
                            {version.changes.length === 1
                              ? t('versionHistory.change')
                              : t('versionHistory.changes')}
                          </Badge>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 px-2 text-xs'
                            onClick={() => toggleVersion(version.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className='mr-1 size-3' />
                                {t('versionHistory.hideDetails')}
                              </>
                            ) : (
                              <>
                                <ChevronDown className='mr-1 size-3' />
                                {t('versionHistory.showDetails')}
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Expanded Changes */}
                      {isExpanded && version.changes.length > 0 && (
                        <div className='mt-3 space-y-2 border-l-2 border-muted pl-4'>
                          {version.changes.map((change, changeIndex) => (
                            <div
                              key={changeIndex}
                              className='space-y-1 text-sm'
                            >
                              <div className='flex items-center gap-2'>
                                <Badge variant='outline' className='text-xs'>
                                  {getSectionName(change.section)}
                                </Badge>
                                <span className='text-xs text-muted-foreground'>
                                  {change.field}
                                </span>
                              </div>
                              <div className='grid grid-cols-2 gap-2 text-xs'>
                                <div className='space-y-1'>
                                  <p className='font-medium text-muted-foreground'>
                                    {t('versionHistory.oldValue')}:
                                  </p>
                                  <p className='rounded bg-destructive/10 p-2 text-destructive'>
                                    {change.oldValue ||
                                      t('versionHistory.empty')}
                                  </p>
                                </div>
                                <div className='space-y-1'>
                                  <p className='font-medium text-muted-foreground'>
                                    {t('versionHistory.newValue')}:
                                  </p>
                                  <p className='rounded bg-primary/10 p-2 text-primary'>
                                    {change.newValue ||
                                      t('versionHistory.empty')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex flex-col gap-2'>
                    {!isCurrent && onRevert && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleRevert(version)}
                        disabled={revertMutation.isPending}
                      >
                        <RotateCcw className='mr-2 size-4' />
                        {t('versionHistory.revert')}
                      </Button>
                    )}
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleCompare(version)}
                      disabled={selectedVersions.to !== undefined}
                    >
                      <GitCompare className='mr-2 size-4' />
                      {t('versionHistory.compare')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Compare Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className='max-h-[80vh] max-w-4xl'>
          <DialogHeader>
            <DialogTitle>{t('versionHistory.compareVersions')}</DialogTitle>
            <DialogDescription>
              {t('versionHistory.comparingVersions', {
                from: selectedVersions.from?.version || '',
                to: selectedVersions.to?.version || '',
              })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className='max-h-[60vh]'>
            <div className='space-y-4 p-4'>
              {selectedVersions.from && selectedVersions.to ? (
                <>
                  {/* Version Info */}
                  <div className='grid grid-cols-2 gap-4'>
                    <Card>
                      <CardContent className='p-4'>
                        <h4 className='mb-2 font-semibold'>
                          {t('versionHistory.version')}{' '}
                          {selectedVersions.from.version}
                        </h4>
                        <p className='mb-2 text-sm text-muted-foreground'>
                          {selectedVersions.from.changeSummary}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {formatDate(selectedVersions.from.changedAt)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-4'>
                        <h4 className='mb-2 font-semibold'>
                          {t('versionHistory.version')}{' '}
                          {selectedVersions.to.version}
                        </h4>
                        <p className='mb-2 text-sm text-muted-foreground'>
                          {selectedVersions.to.changeSummary}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {formatDate(selectedVersions.to.changedAt)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Changes Comparison */}
                  <div className='space-y-3'>
                    <h4 className='font-semibold'>
                      {t('versionHistory.changesBetweenVersions')}
                    </h4>
                    {selectedVersions.to.changes.map((change, index) => {
                      const fromVersion = selectedVersions.from
                      const toVersion = selectedVersions.to

                      return (
                        <Card key={index}>
                          <CardContent className='p-4'>
                            <div className='mb-3 flex items-center gap-2'>
                              <Badge variant='outline'>
                                {getSectionName(change.section)}
                              </Badge>
                              <span className='text-sm text-muted-foreground'>
                                {change.field}
                              </span>
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                              <div className='space-y-2'>
                                <p className='text-sm font-medium text-muted-foreground'>
                                  {fromVersion?.version}:
                                </p>
                                <p className='rounded bg-muted p-3 text-sm'>
                                  {change.oldValue || t('versionHistory.empty')}
                                </p>
                              </div>
                              <div className='space-y-2'>
                                <p className='text-sm font-medium text-muted-foreground'>
                                  {toVersion?.version}:
                                </p>
                                <p className='rounded bg-primary/10 p-3 text-sm'>
                                  {change.newValue || t('versionHistory.empty')}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCompareDialogOpen(false)
                setSelectedVersions({})
              }}
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('versionHistory.revertConfirmation.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('versionHistory.revertConfirmation.description', {
                version: versionToRevert?.version || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revertMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevert}
              disabled={revertMutation.isPending}
            >
              {revertMutation.isPending
                ? t('common.loading')
                : t('versionHistory.revert')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
