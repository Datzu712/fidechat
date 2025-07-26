"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useMockData } from "@/components/mock-data-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PlusCircle } from "lucide-react"
import { CreateServerModal } from "@/components/create-server-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ServerSidebar() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { currentUser, getUserServers } = useMockData()
  const router = useRouter()
  const pathname = usePathname()

  if (!currentUser) return null

  const userServers = getUserServers(currentUser.id)

  const handleServerClick = (serverId: string) => {
    router.push(`/channels/${serverId}`)
  }

  return (
    <TooltipProvider>
      <div className="server-sidebar w-[72px] h-full flex flex-col items-center py-3 overflow-y-auto">
        <ScrollArea className="w-full">
          <div className="flex flex-col items-center gap-2 px-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 transition-all"
                  onClick={() => router.push("/channels")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M9 9.85v4.3"></path>
                    <path d="M15 9.85v4.3"></path>
                    <path d="M21 15.17V8.83a2 2 0 0 0-1-1.73l-7-4.02a2 2 0 0 0-2 0l-7 4.02a2 2 0 0 0-1 1.73v6.34a2 2 0 0 0 1 1.73l7 4.02a2 2 0 0 0 2 0l7-4.02a2 2 0 0 0 1-1.73Z"></path>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Home</TooltipContent>
            </Tooltip>

            <Separator className="h-[2px] w-10 bg-zinc-700 rounded-md my-2" />

            {userServers.map((server) => (
              <Tooltip key={server.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-12 w-12 rounded-full relative group",
                      pathname?.includes(server.id)
                        ? "bg-primary/30 text-white"
                        : "hover:bg-primary/20 text-zinc-400 hover:text-white",
                    )}
                    onClick={() => handleServerClick(server.id)}
                  >
                    <div
                      className={cn(
                        "absolute left-0 bg-white rounded-r-full transition-all w-1",
                        pathname?.includes(server.id) ? "h-8" : "h-2 group-hover:h-5",
                      )}
                    />
                    <Avatar className="h-full w-full">
                      {server.image_url ? (
                        <AvatarImage src={server.image_url || "/placeholder.svg"} alt={server.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/30">
                          {server.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{server.name}</TooltipContent>
              </Tooltip>
            ))}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-12 w-12 rounded-full bg-zinc-700 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all"
                  onClick={() => setIsModalOpen(true)}
                >
                  <PlusCircle className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Create a server</TooltipContent>
            </Tooltip>
          </div>
        </ScrollArea>

        <CreateServerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </TooltipProvider>
  )
}
