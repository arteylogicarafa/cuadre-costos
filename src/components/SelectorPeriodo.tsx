/** Selector de mes que recarga la página con ?periodo=AAAA-MM (formulario GET, sin JavaScript). */
export function SelectorPeriodo({ periodo }: { periodo: string }) {
  return (
    <form className="flex items-end gap-2 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-ink-2">Período</span>
        <input
          type="month"
          name="periodo"
          defaultValue={periodo}
          className="rounded-md border border-line-strong bg-field px-3 py-2"
        />
      </label>
      <button className="rounded-md border border-line-strong px-3 py-2 hover:bg-hover">Ver</button>
    </form>
  );
}
