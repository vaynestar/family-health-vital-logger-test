export function isSpeechSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function createSpeechRecognizer({ onResult, onError, onEnd, onStart }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  // continuous = true allows long speech with pauses without auto-stopping prematurely!
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    // Accumulate total transcript across all continuous speech chunks
    let totalText = '';
    for (let i = 0; i < event.results.length; ++i) {
      totalText += event.results[i][0].transcript;
    }

    const currentText = totalText || finalTranscript || interimTranscript;
    if (onResult) {
      onResult({
        transcript: currentText,
        isFinal: !!finalTranscript
      });
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    let userMsg = '语音识别遇到问题，请重试或手动输入';
    if (event.error === 'no-speech') {
      userMsg = '未检测到声音，请重新点击大麦克风说话';
    } else if (event.error === 'audio-capture') {
      userMsg = '未检测到麦克风，请检查麦克风权限';
    } else if (event.error === 'not-allowed') {
      userMsg = '麦克风权限被拒绝，请在浏览器中开启麦克风权限';
    }
    if (onError) onError({ error: event.error, message: userMsg });
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
