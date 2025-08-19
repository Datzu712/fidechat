'use client';

import '@/styles/serverPage.css';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useAppContext from '@/hooks/useAppContext';
import { ChatArea } from '@/components/chat-area';
import Image from 'next/image';

export default function ServerPage() {
    const router = useRouter();
    const params = useParams<{
        id: string; // guildId
        channelId: string;
    }>();

    const { status } = useSession();
    const { currentUser, channels, guilds } = useAppContext();
    if (status !== 'authenticated' || !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Check if channel exists and belongs to the server
    const guildChannels = channels.filter((c) => c.guildId === params.id);

    if (guildChannels.length === 0) {
        const currentGuild = guilds.find((g) => g.id === params.id);

        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-900">
                <div className="max-w-md text-center p-8 relative animate-fade-in">
                    {/* Decoración visual - círculos con gradientes */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-xl"></div>
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-xl"></div>

                    {/* Icono animado */}
                    <div className="mb-6 flex justify-center">
                        <div className="h-20 w-20 relative animate-bounce-gentle">
                            <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping"></div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary/60 w-full h-full p-2 animate-pulse"
                            >
                                <rect
                                    x="2"
                                    y="7"
                                    width="20"
                                    height="15"
                                    rx="2"
                                />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
                            </svg>
                            <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse"></div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-3 text-zinc-100 drop-shadow-md">
                        No Channels Yet
                    </h1>

                    <p className="text-zinc-400 mb-6">
                        {currentGuild?.name
                            ? `"${currentGuild.name}" doesn't have any channels yet.`
                            : "This server doesn't have any channels yet."}
                    </p>

                    <div className="relative p-4 mb-6 border border-zinc-700/50 rounded-lg bg-zinc-800/30 group hover:bg-zinc-800/50 transition-all duration-300">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-zinc-900 px-2 text-xs font-medium text-primary/70">
                            TIP
                        </div>
                        <p className="text-zinc-500 text-sm italic group-hover:text-zinc-400 transition-colors">
                            Channels are where you can talk with
                        </p>
                        <div className="h-0.5 w-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 group-hover:w-full transition-all duration-700 mt-2 mx-auto"></div>
                    </div>

                    {/* Botón decorativo - no funcional pero visualmente atractivo */}
                    <div className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-md text-zinc-300 text-sm border border-zinc-700 cursor-not-allowed opacity-70">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 mr-2"
                        >
                            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                            <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                        </svg>
                        Only admins can create channels
                    </div>
                </div>
            </div>
        );
    }

    // If no channel is selected, show a default view
    if (!params.channelId) {
        const currentGuild = guilds.find((g) => g.id === params.id);

        return (
            <div className="message-area flex flex-col h-full flex-1 min-w-0">
                <div className="flex items-center px-4 py-3 border-b border-zinc-700">
                    <h1 className="font-semibold text-white">
                        {currentGuild?.name || 'Server'}
                    </h1>
                    <div className="ml-4 text-sm text-zinc-400">
                        {currentGuild?.description ||
                            `Welcome to ${currentGuild?.name || 'this server'}!`}
                    </div>
                </div>

                <div className="flex-1 px-4 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-center">
                        {/* Icono principal con múltiples efectos de animación */}
                        {/* 
                          - rounded-full: crea un círculo perfecto
                          - bg-primary/20: color primario con 20% de opacidad
                          - animate-pulse: efecto de pulsación nativo de Tailwind
                          - relative: permite posicionar elementos hijos de forma absoluta
                        */}
                        {/* Contenedor principal del icono con animaciones */}
                        <div className="h-20 w-20 rounded-full flex items-center justify-center mb-5 animate-pulse relative">
                            {/* 
                              Efectos decorativos alrededor del icono
                              - Múltiples capas para crear profundidad visual
                            */}
                            <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping"></div>
                            <div className="absolute inset-0 rounded-full bg-gradient-radial from-primary/20 to-transparent"></div>

                            {/* Anillo exterior con brillo sutil */}
                            <div className="absolute inset-[-4px] rounded-full border border-primary/30 animate-pulse"></div>

                            {currentGuild?.iconUrl ? (
                                /* Contenedor mejorado para iconos personalizados con proporción ajustada */
                                <div className="relative h-14 w-14 rounded-full overflow-hidden shadow-xl shadow-primary/15 server-icon-container">
                                    {/* Resplandor exterior para enfatizar el icono */}
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-primary/10 to-primary/40 rounded-full animate-rotate-slow"></div>

                                    {/* Fondo con gradiente suave para asegurar buen contraste */}
                                    <div className="absolute inset-0 bg-zinc-900/80"></div>

                                    {/* Imagen con efectos visuales mejorados */}
                                    <Image
                                        src={currentGuild.iconUrl}
                                        alt={`${currentGuild.name} Icon`}
                                        fill
                                        sizes="64px"
                                        priority
                                        className="object-cover scale-90 hover:scale-100 transition-all duration-500 ease-out rounded-full p-0.5"
                                        style={{
                                            filter: 'contrast(1.05) brightness(1.05)',
                                        }}
                                    />
                                </div>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-primary animate-glow"
                                >
                                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                                </svg>
                            )}
                        </div>

                        {/* 
                          Título con efecto de aparición suave (fade-in)
                          - animate-fade-in: animación personalizada que cambia la opacidad de 0 a 1
                        */}
                        <h3 className="text-xl font-semibold text-zinc-300 mb-2 animate-fade-in">
                            Welcome to {currentGuild?.name || 'this server'}!
                        </h3>

                        {/* 
                          Texto descriptivo con efecto de deslizamiento hacia arriba
                          - animate-slide-up: animación personalizada que combina movimiento y opacidad
                          - opacity-0: comienza invisible
                          - animationDelay: retrasa la animación 0.2s para crear efecto escalonado
                          - animationFillMode: 'forwards': mantiene el estado final de la animación
                        */}
                        <p
                            className="text-zinc-400 max-w-md animate-slide-up opacity-0"
                            style={{
                                animationDelay: '0.2s',
                                animationFillMode: 'forwards',
                            }}
                        >
                            Select a channel from the sidebar to start chatting.
                        </p>

                        {/* 
                          Contenedor de canales disponibles con efectos interactivos
                          - hover:shadow-md: añade sombra al pasar el cursor
                          - hover:shadow-primary/20: la sombra es del color primario con 20% opacidad
                          - transition-all: suaviza todas las transiciones
                          - duration-300: transiciones duran 300ms
                        */}
                        <div
                            className="mt-4 text-sm border border-zinc-700 rounded-md px-4 py-2 bg-zinc-800/50 animate-slide-up opacity-0 hover:shadow-md hover:shadow-primary/20 transition-all duration-300"
                            style={{
                                animationDelay: '0.4s',
                                animationFillMode: 'forwards',
                            }}
                        >
                            <p className="text-zinc-300">
                                Available channels:{' '}
                                {/* El número de canales con efecto pulsante para llamar la atención */}
                                <span className="text-primary font-medium animate-pulse">
                                    {guildChannels.length}
                                </span>
                            </p>
                        </div>

                        {/* 
                          Lista de botones de canales con animación retrasada
                          - gap-2: espacio de 0.5rem entre elementos
                          - El último retraso (0.6s) para que aparezca al final
                        */}
                        <div
                            className="flex gap-2 mt-6 animate-slide-up opacity-0"
                            style={{
                                animationDelay: '0.6s',
                                animationFillMode: 'forwards',
                            }}
                        >
                            {/* Muestra solo los primeros 3 canales como botones interactivos */}
                            {guildChannels.slice(0, 3).map((channel) => (
                                <button
                                    key={channel.id}
                                    className="px-3 py-1 bg-primary/10 rounded-full text-primary text-xs hover:bg-primary/20 transition-colors cursor-pointer"
                                    onClick={() =>
                                        router.push(
                                            `/servers/${params.id}/channels/${channel.id}`,
                                        )
                                    }
                                >
                                    #{channel.name}
                                </button>
                            ))}
                            {/* Muestra cuántos canales adicionales hay si son más de 3 */}
                            {guildChannels.length > 3 && (
                                <div className="px-3 py-1 bg-zinc-800 rounded-full text-zinc-400 text-xs">
                                    +{guildChannels.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Handle the selected channel case
    const selectedChannel = channels.find(
        (channel) => channel.id === params.channelId,
    );

    if (!selectedChannel) {
        // Pantalla de error cuando el canal seleccionado no existe
        // Similar a otras páginas de estado para mantener consistencia
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-muted">
                <div className="max-w-md text-center p-6">
                    <h1 className="text-2xl font-bold mb-2">
                        Channel not found
                    </h1>
                    <p className="text-muted-foreground">
                        The selected channel doesn&apos;t exist or you
                        don&apos;t have access to it.
                    </p>
                </div>
            </div>
        );
    }

    /**
     * Renderiza el componente ChatArea cuando hay un canal seleccionado
     *
     * - Estructura de datos adaptada al formato esperado por ChatArea
     * - Proporciona el ID del usuario actual para identificar los mensajes propios
     * - Mantiene la consistencia visual entre componentes al usar ChatArea
     */
    return <ChatArea channel={selectedChannel} />;
}
