"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

interface FotosModalProps {
  open: boolean
  onClose: () => void
  fotos: string[]
}

export default function FotosModal({ open, onClose, fotos }: FotosModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fotos del Defecto</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {fotos.map((url, idx) => (
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
              <Image
                src={url}
                alt={`Foto ${idx + 1}`}
                width={200}
                height={200}
                className="rounded border object-cover"
              />
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
