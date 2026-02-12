type ChatHeaderProps = {
  title: string;
  user: string;
  tempUser: string;
  onTempUserChange: (value: string) => void;
  onConfirmUser: () => void;
};

export function ChatHeader({
  title,
  user,
  tempUser,
  onTempUserChange,
  onConfirmUser,
}: ChatHeaderProps) {
  return (
    <header className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.17)]" />
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
            Public
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Real-time messaging for all online users.
        </p>
        <p className="text-[11px] text-slate-500">
          Current:
          <span className="font-medium text-slate-900">{user}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="h-8 w-32 rounded-full border border-slate-300 bg-slate-50 px-3 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
          value={tempUser}
          maxLength={20}
          onChange={(e) => onTempUserChange(e.target.value)}
          placeholder="New name"
        />
        <button
          className="h-8 rounded-full bg-slate-900 px-3 text-xs font-medium text-slate-50 shadow-sm transition hover:bg-black hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onConfirmUser}
          disabled={!tempUser.trim()}
        >
          Change
        </button>
      </div>
    </header>
  );
}

