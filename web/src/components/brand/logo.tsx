import Image from "next/image";
import Link from "next/link";

export function Logo({ className }: { className?: string }) {
    return (
        <Link href="/" className={`flex items-center gap-2 ${className}`}>
            <div className="relative w-8 h-8">
                <Image
                    src="/logo.png"
                    alt="Reimburse AI Logo"
                    fill
                    sizes="32px"
                    priority
                    className="object-contain"
                />
            </div>
            <span className="font-bold text-white tracking-tight">Reimburse AI</span>
        </Link>
    );
}
