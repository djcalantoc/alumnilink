import { cn } from "@/lib/cn";

type Props = {
  name: string;
  className?: string;
  filled?: boolean;
};

export function MaterialIcon({ name, className, filled }: Props) {
  return (
    <span
      className={cn(
        "material-symbols-outlined select-none leading-none",
        filled && "filled",
        className,
      )}
      aria-hidden
    >
      {name}
    </span>
  );
}
