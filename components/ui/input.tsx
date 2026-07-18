import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full border-[2.5px] border-ink bg-paper px-4 py-3 font-sans text-base text-ink placeholder:text-gray-600 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ink focus-visible:shadow-hard-sm transition-shadow disabled:opacity-50";

export function Input({
  className,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input type={type} className={cn(fieldBase, "rounded-full", className)} {...props} />
  );
}

export function Textarea({
  className,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea rows={rows} className={cn(fieldBase, "rounded-2xl", className)} {...props} />
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-2 block font-sans text-sm font-bold text-ink", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {hint ? <p className="mt-1.5 text-sm text-gray-600">{hint}</p> : null}
    </div>
  );
}
