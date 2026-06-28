type NavbarProps = {
  className?: string;
  children?: React.ReactNode;
};

export function Navbar({ className, children }: NavbarProps) {
  return (
    <nav
      className={[
        "py-2 px-4 text-white",
        "w-full border-b-2 border-[#FF99D7] shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]",
        "bg-[linear-gradient(90deg,#C40873_2.02%,#B01070_78.46%,#8C1D6B_99.58%)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
        {children}
    </nav>
  );
}