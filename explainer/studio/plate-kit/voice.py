# python3 tools/voice.py <dir> [voice]  → <dir>/lesson.voiced.json: each step gets audio[] = one mp3 data URI per sentence (same split as the shell)
import json, re, sys, os, base64, subprocess, tempfile
from kokoro_onnx import Kokoro; import soundfile as sf
d = sys.argv[1]; voice = sys.argv[2] if len(sys.argv) > 2 else "bf_emma"; K = os.environ.get("KOKORO", "")
k = Kokoro(os.path.join(K, "kokoro.onnx"), os.path.join(K, "voices.bin"))
L = json.load(open(os.path.join(d, "lesson.json"))); total = 0
for st in L["steps"]:
    st["audio"] = []
    for sent in [x for x in re.split(r"(?<=[.!?])\s+", st.get("say", "")) if x]:
        a, sr = k.create(sent, voice=voice, speed=1.0, lang="en-gb")
        with tempfile.TemporaryDirectory() as t:
            sf.write(t + "/s.wav", a, sr); subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", t + "/s.wav", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "48k", t + "/s.mp3"], check=True)
            b = open(t + "/s.mp3", "rb").read()
        st["audio"].append("data:audio/mpeg;base64," + base64.b64encode(b).decode()); total += len(a) / sr
json.dump(L, open(os.path.join(d, "lesson.voiced.json"), "w"))
print(f"{d}: {sum(len(s['audio']) for s in L['steps'])} sentences, {total:.0f} s of narration, {os.path.getsize(os.path.join(d, 'lesson.voiced.json'))//1024} KB")
