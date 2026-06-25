type ButtonProps = {
    className?: string;
    children?: React.ReactNode;
};

export function Button({ className, children }: ButtonProps) {
    return (
        <button
            className={[
                "inline-flex items-center justify-center px-4 py-2",
                "text-sm font-bold italic uppercase font-sans",
                "bg-[#BD2C85] text-white rounded-lg shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]",
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