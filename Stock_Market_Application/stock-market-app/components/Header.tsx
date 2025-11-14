import Image from "next/image";
import Link from "next/link";
import React from "react";
import NavItems from "@/components/NavItems";
import UserDropDown from "@/components/UserDropDown";

type User = {
  id: string;
  name: string;
  email: string;
};

const Header = async ({ user }: { user: User }) => {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href={"/"} className="flex items-center gap-2">
          <Image
            height={32}
            width={140}
            alt="Invisly AI"
            src={"/assets/icons/Invsily_logo.png"}
            className="h-8 w-auto cursor-pointer"
          />
          <h1 className="text-white text-2xl font-semibold">Invisly</h1>
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>
        <UserDropDown user={user} />
      </div>
    </header>
  );
};

export default Header;
