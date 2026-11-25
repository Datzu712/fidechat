import type { LocalBackend } from '@/shared/backend/local/local-backend';
import {
    currentModelState,
    onModelStateChange,
} from '@/shared/backend/local/tab/replica/model-link';
import { getTab } from '@/shared/backend/local/tab/replica/worker';

export const modelAdmin: Pick<
    LocalBackend,
    'getModelState' | 'onModelStateChange' | 'loadModel' | 'clearModelCache'
> = {
    getModelState: currentModelState,

    onModelStateChange,

    loadModel(modelId) {
        getTab().postModel({ type: 'load', modelId });
    },

    clearModelCache() {
        getTab().postModel({ type: 'clearCache' });
    },
};
