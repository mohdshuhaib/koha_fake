import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <Image
          src="/loading.gif"
          alt="Loading..."
          width={72}
          height={72}
          className="h-[72px] w-[72px] object-contain"
          priority
          unoptimized
        />
        <p className="mt-3 text-sm font-medium text-text-grey">Loading...</p>
      </div>
    </div>
  )
}