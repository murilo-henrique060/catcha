type NavbarButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export function NavbarButton({ className, children }: NavbarButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center px-3 py-2",
        "text-sm font-bold italic uppercase font-sans",
        "hover:text-white/75 transition-colors duration-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}