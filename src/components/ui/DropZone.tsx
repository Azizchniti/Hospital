import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DropZoneProps {
  accept: string
  onFile: (file: File) => void
  label: string
  sublabel?: string
  className?: string
}

export function DropZone({ accept, onFile, label, sublabel, className }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 rounded-xl',
        'border-2 border-dashed cursor-pointer transition-all',
        dragging
          ? 'border-brand-500 bg-brand-50'
          : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50',
        className
      )}
    >
      <Upload className="w-8 h-8 text-gray-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          <span className="text-brand-600">{label}</span>
        </p>
        {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}
