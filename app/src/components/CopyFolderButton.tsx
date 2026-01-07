import { FolderIcon, CheckIcon } from './icons'

type CopyFolderButtonProps = {
  folderPath: string
  isCopied: boolean
  onCopy: (e: React.MouseEvent) => void
  variant: 'icon' | 'full'
  muted?: boolean
}

export function CopyFolderButton({ folderPath, isCopied, onCopy, variant, muted = false }: CopyFolderButtonProps) {
  if (variant === 'icon') {
    return (
      <button
        onClick={onCopy}
        className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all duration-200 ${
          isCopied
            ? 'opacity-100 bg-emerald-500/20 text-emerald-400'
            : 'bg-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-700'
        }`}
        title="Copiar caminho da pasta"
        aria-label="Copiar caminho da pasta"
      >
        {isCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <FolderIcon className="w-3.5 h-3.5" />}
      </button>
    )
  }

  const baseStyles = muted
    ? 'bg-neutral-800/60 text-neutral-500 border-neutral-700/50 hover:text-neutral-300 hover:bg-neutral-700/60'
    : 'bg-neutral-800/80 text-neutral-400 border-neutral-700/50 hover:text-white hover:bg-neutral-700/80 hover:border-neutral-600'

  return (
    <button
      onClick={onCopy}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
        isCopied
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : baseStyles
      }`}
      title={folderPath}
      aria-label="Copiar caminho da pasta"
    >
      {isCopied ? (
        <>
          <CheckIcon />
          Copiado
        </>
      ) : (
        <>
          <FolderIcon />
          Pasta
        </>
      )}
    </button>
  )
}
