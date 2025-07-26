"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMockData } from "@/components/mock-data-provider"

export default function ServerPage({
  params,
}: {
  params: { serverId: string }
}) {
  const { getServerChannels } = useMockData()
  const router = useRouter()

  useEffect(() => {
    // Get the first channel in the server
    const channels = getServerChannels(params.serverId)

    if (channels.length > 0) {
      router.push(`/channels/${params.serverId}/${channels[0].id}`)
    }
  }, [params.serverId, getServerChannels, router])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-muted">
      <div className="max-w-md text-center p-6">
        <h1 className="text-2xl font-bold mb-2">No channels available</h1>
        <p className="text-muted-foreground">This server doesn't have any channels yet.</p>
      </div>
    </div>
  )
}
