import { BOT_DEFINITIONS } from '@fidechat/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cpu, Database, SlidersHorizontal, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

import { useErrorToast } from '@/shared/api/use-error-toast';
import { localBackend } from '@/shared/backend/local/local-backend';
import type { ModelState } from '@/shared/backend/local/model/model-protocol';
import { MODELS, modelStatus } from '@/shared/backend/local/model/models';
import {
    BOT_SETTING_LIMITS,
    type BotSettings,
} from '@/shared/backend/local/protocol';
import {
    Divider,
    SectionHeading,
    SettingsRow,
    SubHeading,
} from '@/shared/backend/local/ui/settings-layout';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

const BOT_SETTINGS_KEY = ['local-bot-settings'];
const RESET_CONFIRM_MS = 4000;

/** Discord's grey secondary button. */
const GREY_BUTTON = 'bg-zinc-600 text-white hover:bg-zinc-500';

const PAGES = [
    { id: 'model', label: 'Model', icon: Cpu },
    { id: 'bots', label: 'Bots', icon: SlidersHorizontal },
    { id: 'demo-data', label: 'Demo data', icon: Database },
] as const;

type PageId = (typeof PAGES)[number]['id'];

interface LocalAdminDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modelState: ModelState;
}

/**
 * The local mode's settings: the bots' model, how the bots answer and the
 * demo data. Laid out like Discord's user settings: a nav on the left and one
 * page at a time on the right. Every page stays mounted (only hidden), so
 * unsaved edits survive switching pages.
 */
export function LocalAdminDialog({
    open,
    onOpenChange,
    modelState,
}: LocalAdminDialogProps) {
    const [page, setPage] = useState<PageId>('model');
    const current = PAGES.find(({ id }) => id === page) ?? PAGES[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-dvh max-w-none flex-col gap-0 overflow-hidden border-none bg-discord-chat p-0 sm:h-[min(750px,90vh)] sm:w-[min(1350px,90vw)] sm:max-w-none sm:flex-row sm:rounded-lg [&>button:last-child]:hidden">
                <SettingsNav page={page} onSelect={setPage} />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between px-4 pt-4 sm:px-10 sm:pt-6">
                        <p className="text-sm font-semibold text-muted-foreground">
                            {current.label}
                        </p>
                        <DialogClose className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-muted-foreground/60 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 sm:px-10">
                        <div className="mx-auto max-w-[760px]">
                            <SettingsPage id="model" active={page}>
                                <ModelSection modelState={modelState} />
                            </SettingsPage>
                            <SettingsPage id="bots" active={page}>
                                <BotsSection />
                            </SettingsPage>
                            <SettingsPage id="demo-data" active={page}>
                                <DemoDataSection modelState={modelState} />
                            </SettingsPage>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** The left column; a row of tabs on top on narrow screens. */
function SettingsNav({
    page,
    onSelect,
}: {
    page: PageId;
    onSelect: (page: PageId) => void;
}) {
    return (
        <nav className="flex shrink-0 flex-col bg-discord-sidebar sm:w-[260px] sm:py-6">
            <div className="px-4 pb-2 pt-4 sm:px-4 sm:pb-4 sm:pt-0">
                <DialogTitle className="text-base">Demo settings</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                    Shared by every tab of this demo.
                </DialogDescription>
            </div>
            <div className="mx-4 hidden h-px bg-white/10 sm:block" />
            <p className="hidden px-4 pb-1 pt-4 text-xs font-semibold uppercase text-muted-foreground sm:block">
                Settings
            </p>
            <div
                role="tablist"
                className="flex gap-1 overflow-x-auto px-2 pb-2 sm:flex-col sm:overflow-visible sm:pb-0"
            >
                {PAGES.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        id={`local-settings-tab-${id}`}
                        aria-selected={page === id}
                        aria-controls={`local-settings-page-${id}`}
                        onClick={() => onSelect(id)}
                        className={cn(
                            'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                            page === id && 'bg-white/10 text-foreground',
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>
        </nav>
    );
}

function SettingsPage({
    id,
    active,
    children,
}: {
    id: PageId;
    active: PageId;
    children: React.ReactNode;
}) {
    return (
        <div
            role="tabpanel"
            id={`local-settings-page-${id}`}
            aria-labelledby={`local-settings-tab-${id}`}
            hidden={id !== active}
            className="pt-6"
        >
            {children}
        </div>
    );
}

function ModelSection({ modelState }: { modelState: ModelState }) {
    const activeId =
        modelState.status === 'off' || modelState.status === 'unsupported'
            ? undefined
            : modelState.modelId;
    const [selectedId, setSelectedId] = useState(activeId ?? MODELS[0].id);
    const selected =
        MODELS.find((model) => model.id === selectedId) ?? MODELS[0];
    const isActive =
        selected.id === activeId &&
        (modelState.status === 'loading' || modelState.status === 'ready');

    const size = `(${selected.sizeMb} MB)`;
    let action = `Load ${selected.label} ${size}`;
    if (modelState.status === 'off') {
        action = `Download model ${size}`;
    } else if (modelState.status === 'error' && selected.id === activeId) {
        action = `Retry ${size}`;
    }
    const showsWebGpu =
        modelState.status === 'off' ||
        modelState.status === 'loading' ||
        modelState.status === 'ready';

    return (
        <section>
            <SectionHeading>Model</SectionHeading>
            {modelState.status === 'unsupported' && (
                <SettingsRow label="WebGPU">
                    <p className="text-right text-sm text-muted-foreground">
                        {modelState.reason}
                    </p>
                </SettingsRow>
            )}
            {showsWebGpu && (
                <SettingsRow label="WebGPU">
                    <p className="text-sm text-muted-foreground">
                        WebGPU supported
                    </p>
                </SettingsRow>
            )}
            {modelState.status !== 'unsupported' && (
                <>
                    <SettingsRow label="Model" htmlFor="local-model">
                        <select
                            id="local-model"
                            aria-label="Bots' model"
                            value={selected.id}
                            onChange={(event) =>
                                setSelectedId(event.target.value)
                            }
                            className="h-9 max-w-full rounded-md border border-input bg-discord-sidebar px-2 text-sm text-foreground"
                        >
                            {MODELS.map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.label} ({model.sizeMb} MB)
                                </option>
                            ))}
                        </select>
                        <Button
                            size="sm"
                            disabled={isActive}
                            onClick={() => localBackend.loadModel(selected.id)}
                        >
                            {action}
                        </Button>
                    </SettingsRow>
                    {modelState.status !== 'off' && (
                        <p
                            className={
                                modelState.status === 'error'
                                    ? 'text-sm text-destructive'
                                    : 'text-sm text-muted-foreground'
                            }
                        >
                            {modelStatus(modelState)}
                        </p>
                    )}
                </>
            )}
        </section>
    );
}

function BotsSection() {
    const { data, isPending, isError } = useQuery({
        queryKey: BOT_SETTINGS_KEY,
        queryFn: () => localBackend.getBotSettings(),
        staleTime: 0,
    });

    return (
        <section>
            <SectionHeading>Bots</SectionHeading>
            {isPending && (
                <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {isError && (
                <p className="text-sm text-destructive">
                    Could not load the bot settings.
                </p>
            )}
            {data && (
                // A new key resets the form whenever the stored settings change.
                <BotSettingsForm key={JSON.stringify(data)} settings={data} />
            )}
        </section>
    );
}

type NumberKey = keyof typeof BOT_SETTING_LIMITS;
/** The input text of each numeric setting. */
type NumberInputs = Record<NumberKey, string>;

const NUMBER_FIELDS: { key: NumberKey; label: string; step: string }[] = [
    { key: 'temperature', label: 'Temperature', step: 'any' },
    { key: 'maxNewTokens', label: 'Max new tokens', step: '1' },
    { key: 'historyLimit', label: 'Messages read before replying', step: '1' },
];

/** An empty input becomes NaN, so the server rejects it instead of reading 0. */
const toNumber = (value: string) =>
    value.trim() === '' ? Number.NaN : Number(value);

function changedSettings({
    settings,
    numbers,
    disabledBotIds,
}: {
    settings: BotSettings;
    numbers: NumberInputs;
    disabledBotIds: string[];
}): Partial<BotSettings> {
    const changes: Partial<BotSettings> = {};
    for (const { key } of NUMBER_FIELDS) {
        const value = toNumber(numbers[key]);
        if (value !== settings[key]) changes[key] = value;
    }
    const sameBots =
        disabledBotIds.length === settings.disabledBotIds.length &&
        disabledBotIds.every((id) => settings.disabledBotIds.includes(id));
    if (!sameBots) {
        changes.disabledBotIds = disabledBotIds;
    }
    return changes;
}

function BotSettingsForm({ settings }: { settings: BotSettings }) {
    const [numbers, setNumbers] = useState<NumberInputs>({
        temperature: String(settings.temperature),
        maxNewTokens: String(settings.maxNewTokens),
        historyLimit: String(settings.historyLimit),
    });
    const [disabledBotIds, setDisabledBotIds] = useState(
        settings.disabledBotIds,
    );
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const onError = useErrorToast('Failed to save the bot settings');

    const changes = changedSettings({ settings, numbers, disabledBotIds });
    const hasChanges = Object.keys(changes).length > 0;

    const { mutate, isPending } = useMutation({
        mutationFn: (partial: Partial<BotSettings>) =>
            localBackend.updateBotSettings(partial),
        onSuccess: (saved) => {
            queryClient.setQueryData(BOT_SETTINGS_KEY, saved);
            toast({ title: 'Bot settings saved' });
        },
        onError,
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        mutate(changes);
    };

    const setBotEnabled = (botId: string, enabled: boolean) =>
        setDisabledBotIds((ids) =>
            enabled
                ? ids.filter((id) => id !== botId)
                : [...ids.filter((id) => id !== botId), botId],
        );

    return (
        <form onSubmit={handleSubmit}>
            {NUMBER_FIELDS.map(({ key, label, step }) => (
                <SettingsRow key={key} label={label} htmlFor={`local-${key}`}>
                    <Input
                        id={`local-${key}`}
                        type="number"
                        min={BOT_SETTING_LIMITS[key].min}
                        max={BOT_SETTING_LIMITS[key].max}
                        step={step}
                        required
                        value={numbers[key]}
                        onChange={(event) => {
                            const { value } = event.target;
                            setNumbers((current) => ({
                                ...current,
                                [key]: value,
                            }));
                        }}
                        disabled={isPending}
                        className="w-28 bg-discord-sidebar text-right"
                    />
                </SettingsRow>
            ))}
            <Divider />
            <SubHeading>Bots</SubHeading>
            {BOT_DEFINITIONS.map(({ user }) => {
                const id = `local-bot-${user.id}`;
                return (
                    <SettingsRow
                        key={user.id}
                        label={user.username}
                        htmlFor={id}
                    >
                        <Checkbox
                            id={id}
                            checked={!disabledBotIds.includes(user.id)}
                            onCheckedChange={(checked) =>
                                setBotEnabled(user.id, checked === true)
                            }
                            disabled={isPending}
                            className="h-5 w-5"
                        />
                    </SettingsRow>
                );
            })}
            <Divider />
            <div className="flex justify-end">
                <Button
                    type="submit"
                    size="sm"
                    disabled={isPending || !hasChanges}
                >
                    {isPending ? 'Saving…' : 'Save'}
                </Button>
            </div>
        </form>
    );
}

function DemoDataSection({ modelState }: { modelState: ModelState }) {
    const [confirming, setConfirming] = useState(false);
    const onError = useErrorToast('Failed to reset the demo');
    const { toast } = useToast();
    const { mutate: reset, isPending } = useMutation({
        mutationFn: () => localBackend.resetDemo(),
        onError,
    });

    useEffect(() => {
        if (!confirming) return;
        const timer = setTimeout(() => setConfirming(false), RESET_CONFIRM_MS);
        return () => clearTimeout(timer);
    }, [confirming]);

    const handleReset = () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }
        setConfirming(false);
        reset();
    };

    const handleClear = () => {
        localBackend.clearModelCache();
        toast({ title: 'Downloaded models deleted' });
    };

    return (
        <section>
            <SectionHeading>Demo data</SectionHeading>
            <SettingsRow
                label="Reset demo"
                description="Restores the starting users, servers, messages and bot settings; every tab returns to the entry screen."
            >
                <Button
                    size="sm"
                    variant={confirming ? 'destructive' : 'secondary'}
                    className={confirming ? undefined : GREY_BUTTON}
                    disabled={isPending}
                    onClick={handleReset}
                >
                    {confirming ? 'Click again to reset' : 'Reset demo'}
                </Button>
            </SettingsRow>
            {modelState.status !== 'unsupported' && (
                <>
                    <Divider />
                    <SettingsRow
                        label="Clear downloaded models"
                        description="Turns the bots off, stops a download and deletes the model files this browser downloaded."
                    >
                        <Button
                            size="sm"
                            variant="secondary"
                            className={GREY_BUTTON}
                            onClick={handleClear}
                        >
                            Clear downloaded models
                        </Button>
                    </SettingsRow>
                </>
            )}
        </section>
    );
}
