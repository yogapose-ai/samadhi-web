import Link from "next/link";
import React from "react";

const DetectorLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900'
  >
    {children}
  </Link>
);

interface DetectorCardProps {
  title: string;
  linkHref: string;
  linkText: string;
  children: React.ReactNode;
  className?: string;
}

export default function DetectorCard({
  title,
  linkHref,
  linkText,
  children,
  className = "",
}: DetectorCardProps) {
  return (
    <div className={`w-full lg:basis-1/3 flex-shrink-0 ${className}`}>
      <div className='bg-white p-4 rounded-xl shadow-lg h-full flex flex-col'>
        <div className='flex justify-between items-center mb-4 border-b pb-2'>
          <h2 className='text-xl font-semibold text-gray-800'>{title}</h2>
          <DetectorLink href={linkHref}>{linkText} &rarr;</DetectorLink>
        </div>

        <div className='flex-1 min-h-0 overflow-y-auto w-full space-y-4 md:min-h-[250px]'>
          {children}
        </div>
      </div>
    </div>
  );
}
