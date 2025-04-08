import Image from "next/image";

const Logo = () => {
  return (
    <div className="hidden md:flex">
      <Image src="/logo.svg" alt="logo" height={60} width={180} />
    </div>
  );
};

export default Logo;
