"use client";

export default function FormField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  trailing,
  error,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink">{label}</span>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition-colors ${
          error ? "border-red-300" : "border-line focus-within:border-ink/30"
        }`}
      >
        <span className="text-muted">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-muted focus:outline-none"
        />
        {trailing}
      </div>
      {error && <span className="mt-1 block text-[12px] text-red-500">{error}</span>}
    </label>
  );
}