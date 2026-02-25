export default function Spinner({ text, size = 'md' }: { text?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-5 w-5', md: 'h-10 w-10', lg: 'h-14 w-14' }[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`animate-spin rounded-full border-2 border-zinc-700 border-t-sky-500 ${s}`} />
      {text && <p className="text-zinc-500 text-sm">{text}</p>}
    </div>
  );
}