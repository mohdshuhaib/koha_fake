import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <Image
        src="/Book.gif"
        alt="Loading..."
        width={50}
        height={50}
      />
    </div>
  )
}
