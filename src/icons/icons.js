import {
  Plus, Trash2, Pencil, Copy, Check, Undo2, Download, FileUp,
  FileSpreadsheet, Search, Calculator, Tag, Layers, Ruler,
  CalendarClock, ScanBarcode, Package, TriangleAlert, CircleAlert,
  Info, CircleCheck, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, X, Eraser
} from 'lucide-vue-next'

/** @type {Record<string, import('vue').Component>} */
export const icons = {
  add: Plus,
  remove: Trash2,
  edit: Pencil,
  duplicate: Copy,
  save: Check,
  cancel: Undo2,
  download: Download,
  upload: FileUp,
  spreadsheet: FileSpreadsheet,
  search: Search,
  hpp: Calculator,
  'price-tag': Tag,
  variant: Layers,
  unit: Ruler,
  batch: CalendarClock,
  barcode: ScanBarcode,
  product: Package,
  warning: TriangleAlert,
  error: CircleAlert,
  info: Info,
  success: CircleCheck,
  expand: ChevronDown,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  close: X,
  clear: Eraser,
}
