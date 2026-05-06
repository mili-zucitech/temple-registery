import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  useSuspendTempleMutation, useReactivateTempleMutation,
  useFreezeTempleMutation, useArchiveTempleMutation,
} from '@/features/admin/adminApi'
import { useSearchTemplesQuery } from '@/features/temple/templeApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Archive, Pause, Play, Snowflake, Search, Building2, Star, Info, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TempleSearchResultResponse } from '@/features/temple-profile/hooks/templeTypes'

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  FROZEN: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-700',
}

