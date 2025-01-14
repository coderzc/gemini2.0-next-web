import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { useCallback, useEffect, useState } from 'react';

interface UseSpeechServiceProps {
  subscriptionKey?: string;
  region?: string;
  language?: string;
  voice?: string;
}

export function useSpeechService({
  subscriptionKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY,
  region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION,
  language = 'zh-CN',
  voice = 'zh-CN-XiaoxiaoNeural'
}: UseSpeechServiceProps = {}) {
  const [synthesizer, setSynthesizer] = useState<sdk.SpeechSynthesizer | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!subscriptionKey || !region) {
      console.warn('Azure Speech Service credentials not provided');
      return;
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
    speechConfig.speechSynthesisLanguage = language;
    speechConfig.speechSynthesisVoiceName = voice;

    const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
    const newSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    setSynthesizer(newSynthesizer);

    return () => {
      newSynthesizer.close();
    };
  }, [subscriptionKey, region, language, voice]);

  const speak = useCallback(async (text: string) => {
    if (!synthesizer) {
      console.warn('Speech synthesizer not initialized');
      return;
    }

    setSpeaking(true);
    return new Promise<void>((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            setSpeaking(false);
            resolve();
          } else {
            console.error('Speech synthesis failed:', result.errorDetails);
            setSpeaking(false);
            reject(new Error(result.errorDetails));
          }
        },
        (error) => {
          console.error('Speech synthesis error:', error);
          setSpeaking(false);
          reject(error);
        }
      );
    });
  }, [synthesizer]);

  return {
    speak,
    speaking,
    synthesizer
  };
} 