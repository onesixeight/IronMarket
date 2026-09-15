import { Conversation } from '@elevenlabs/client'
import rawAudioProcessor from '@elevenlabs/client/worklets/rawAudioProcessor.js?url&no-inline'
import audioConcatProcessor from '@elevenlabs/client/worklets/audioConcatProcessor.js?url&no-inline'

export { Conversation }
export const workletPaths = { rawAudioProcessor, audioConcatProcessor }
