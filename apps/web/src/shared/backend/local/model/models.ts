import type { ModelState } from '@/shared/backend/local/model/model-protocol';

interface ModelOption {
    id: string;
    label: string;
    sizeMb: number;
}

/** The models a visitor can load; the first one is the default. */
export const MODELS: readonly ModelOption[] = [
    {
        id: 'onnx-community/LFM2.5-350M-ONNX',
        label: 'LFM2.5 350M',
        sizeMb: 255,
    },
    { id: 'onnx-community/Qwen3-0.6B-ONNX', label: 'Qwen3 0.6B', sizeMb: 570 },
    {
        id: 'onnx-community/gemma-3-1b-it-ONNX',
        label: 'Gemma 3 1B',
        sizeMb: 764,
    },
];

/** The model's label, or its id when it is not one of MODELS. */
export const modelLabel = (modelId: string) =>
    MODELS.find((model) => model.id === modelId)?.label ?? modelId;

/** One line on what the bots' model is doing, for the status bar and the settings. */
export function modelStatus(state: ModelState): string {
    switch (state.status) {
        case 'off':
            return 'Bots off';
        case 'loading':
            return `Loading ${modelLabel(state.modelId)} · ${Math.round(state.progress * 100)}%`;
        case 'ready':
            return `Bots on · ${modelLabel(state.modelId)}`;
        case 'unsupported':
        case 'error':
            return `Bots off: ${state.reason}`;
    }
}
