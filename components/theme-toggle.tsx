'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const current = mounted ? (theme === 'system' ? resolvedTheme : theme) : null
  const isDark = current === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-12 w-12 rounded-full"
    >
      {mounted && isDark ? (
        <Sun className="h-6 w-6" aria-hidden />
      ) : (
        <Moon className="h-6 w-6" aria-hidden />
      )}
    </Button>
  )
}
