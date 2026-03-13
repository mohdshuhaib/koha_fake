'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, X, AlertCircle } from 'lucide-react'

type BarcodeScannerModalProps = {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (value: string) => void
  title?: string
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode',
}: BarcodeScannerModalProps) {
  const scannerRef = useRef<any>(null)
  const regionId = useMemo(
    () => `barcode-scanner-region-${Math.random().toString(36).slice(2)}`,
    []
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let cancelled = false

    const startScanner = async () => {
      if (!isOpen) return

      try {
        setStarting(true)
        setErrorMessage('')

        const mod = await import('html5-qrcode')
        const Html5Qrcode = mod.Html5Qrcode

        if (cancelled) return

        const scanner = new Html5Qrcode(regionId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 120 },
            aspectRatio: 1.7778,
            disableFlip: false,
          },
          async (decodedText: string) => {
            if (!decodedText) return
            try {
              await scanner.stop()
            } catch {}
            try {
              await scanner.clear()
            } catch {}
            scannerRef.current = null
            onScanSuccess(decodedText)
            onClose()
          },
          () => {
            // ignore scan misses
          }
        )
      } catch (error: any) {
        setErrorMessage(
          error?.message || 'Could not access camera. Please allow camera permission.'
        )
      } finally {
        setStarting(false)
      }
    }

    startScanner()

    return () => {
      cancelled = true
      const stop = async () => {
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop()
          } catch {}
          try {
            await scannerRef.current.clear()
          } catch {}
          scannerRef.current = null
        }
      }
      stop()
    }
  }, [isOpen, onClose, onScanSuccess, regionId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-secondary-white border border-primary-dark-grey shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-primary-dark-grey">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-heading-text-black" />
            <h3 className="text-lg font-bold font-heading text-heading-text-black">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-grey hover:bg-primary-grey transition"
            aria-label="Close scanner"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-text-grey">
            Point the camera at the barcode. On desktop, continue using your barcode scanner machine.
          </p>

          <div className="rounded-lg border border-primary-dark-grey bg-black overflow-hidden">
            <div id={regionId} className="w-full min-h-[260px]" />
          </div>

          {starting && (
            <div className="text-sm text-text-grey font-medium">
              Starting camera...
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-100 text-red-800 text-sm">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}