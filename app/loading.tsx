import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <Image
        src="/Book.gif"
        alt="Loading..."
        width={50}
        height={50}
      />
    </div>
  )
}
