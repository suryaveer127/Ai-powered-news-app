import azure.cognitiveservices.speech as speechsdk
import time
import os

# Azure credentials
speech_key = "DSKcmp4mgQc1MqiN1cbPA7zOAxxZXTOFwyiedc7qElXLQPcgpXJxJQQJ99BDACGhslBXJ3w3AAAYACOGyDin"
service_region = "centralindia"  # e.g., "eastus"

# Initialize speech config
speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
speech_config.speech_synthesis_voice_name = "en-IN-AnanyaNeural"  # Use neural voice

# Set output format to PCM/WAV for speaker playback
speech_config.set_speech_synthesis_output_format(
    speechsdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm
)

# Set up synthesizer to play audio through default speaker
audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

def generate_audio_from_text(text: str) -> str:
    """
    Generate audio from the given text using Azure TTS and return the file path.
    """
    # The generate_audio_from_text function should ONLY generate audio from text and return the file path.
    # Do NOT include any database logic here.
    # All database queries and storage should be handled in your main file.
    filename = f"summary_{int(time.time())}.mp3"
    output_path = os.path.join("audio_outputs", filename)
    os.makedirs("audio_outputs", exist_ok=True)
    result = synthesizer.speak_text_async(text).get()
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        with open(output_path, "wb") as f:
            f.write(result.audio_data)
        # You may want to return a URL if serving files via HTTP
        return output_path
    else:
        raise Exception(f"Synthesis failed: {result.error_details}")
