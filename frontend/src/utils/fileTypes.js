/**
 * File type -> icon/color mapping, mirrors the category logic in the
 * backend's app/utils/file_helpers.py (get_file_category) so a file's
 * icon in the UI always matches how the backend classifies it.
 *
 * Note: this file is in your original frontend/src/utils/ tree but
 * hadn't been sent yet — added now because components/files/ needs it
 * for thumbnails/icons. Same pattern as star_service.py earlier.
 */
import {
  Image, Video, Music, FileText, Archive, FileSpreadsheet,
  File as FileIcon,
} from 'lucide-react'

const CATEGORY_RULES = [
  { prefix: 'image/', category: 'image' },
  { prefix: 'video/', category: 'video' },
  { prefix: 'audio/', category: 'audio' },
  { exact: 'application/pdf', category: 'pdf' },
  { exact: 'application/zip', category: 'archive' },
  { exact: 'application/x-zip-compressed', category: 'archive' },
  { prefix: 'text/', category: 'text' },
  { exact: 'application/msword', category: 'document' },
  {
    exact: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'document',
  },
  { exact: 'application/vnd.ms-excel', category: 'spreadsheet' },
  {
    exact: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'spreadsheet',
  },
]

export function getFileCategory(mimeType = '') {
  for (const rule of CATEGORY_RULES) {
    if (rule.exact && mimeType === rule.exact) return rule.category
    if (rule.prefix && mimeType.startsWith(rule.prefix)) return rule.category
  }
  return 'file'
}

const CATEGORY_ICON_MAP = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  text: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  archive: Archive,
  file: FileIcon,
}

const CATEGORY_COLOR_MAP = {
  image: { bg: 'bg-emerald-50', fg: 'text-emerald-500' },
  video: { bg: 'bg-rose-50', fg: 'text-rose-500' },
  audio: { bg: 'bg-amber-50', fg: 'text-amber-500' },
  pdf: { bg: 'bg-red-50', fg: 'text-red-500' },
  text: { bg: 'bg-gray-100', fg: 'text-gray-500' },
  document: { bg: 'bg-blue-50', fg: 'text-blue-500' },
  spreadsheet: { bg: 'bg-green-50', fg: 'text-green-600' },
  archive: { bg: 'bg-orange-50', fg: 'text-orange-500' },
  file: { bg: 'bg-brand-50', fg: 'text-brand-500' },
}

export function getFileIcon(mimeType) {
  return CATEGORY_ICON_MAP[getFileCategory(mimeType)] || FileIcon
}

export function getFileColors(mimeType) {
  return CATEGORY_COLOR_MAP[getFileCategory(mimeType)] || CATEGORY_COLOR_MAP.file
}

export function isPreviewable(mimeType = '') {
  const category = getFileCategory(mimeType)
  return category === 'image' || mimeType === 'application/pdf' || category === 'text'
}