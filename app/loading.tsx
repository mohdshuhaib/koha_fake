import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-grey text-heading-text-black">
      <Image
        src="/loading.gif"
        alt="Loading..."
        width={50}
        height={50}
      />
    </div>
  )
}
