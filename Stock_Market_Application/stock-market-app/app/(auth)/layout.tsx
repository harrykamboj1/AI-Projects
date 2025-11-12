import Image from "next/image";
import Link from "next/link";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="h-screen">
      <section className="flex flex-col justify-center items-center h-full">
        <Link href={"/"} className="flex items-center gap-2 mr-1">
          <Image
            height={32}
            width={140}
            alt="Invisly AI"
            src={"/assets/icons/Invsily_logo.png"}
            priority
            className="h-10 w-auto cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
          />
          <h1 className="text-white text-4xl font-semibold">Invisly</h1>
        </Link>
        <div className="py-3 lg:py-7 flex flex-col justify-center items-center">
          {children}
        </div>
      </section>
    </main>
  );
};

export default Layout;
