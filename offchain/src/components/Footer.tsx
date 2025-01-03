import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer footer-center p-10">
      <div>
        <p className="font-bold text-lg">
          Treeconomy <br />
          Real men plant trees 
        </p>
        <p>Copyright © 2024 - All right reserved</p>
      </div>
      <div>
        <div className="grid grid-flow-col gap-4">
          <Link href="https://twitter.com/elementalpool">
            <Image
              className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] "
              src="/img/icon.jpg"
              alt="Next.js Logo"
              width={50}
              height={100}
              priority
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
