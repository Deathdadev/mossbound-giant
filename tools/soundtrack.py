"""Synthesize the original soundtrack. Requires Python and NumPy; no samples or models."""
import sys
import wave
import numpy as np

RATE = 44100
LENGTH = 42
rng = np.random.default_rng(711)
t = np.arange(RATE * LENGTH) / RATE
mix = np.zeros((len(t), 2))


def band(seconds, low, high):
    count = int(seconds * RATE)
    noise = rng.normal(0, 1, count)
    freq = np.fft.rfftfreq(count, 1 / RATE)
    mask = (1 - np.exp(-(freq / low) ** 4)) * np.exp(-(freq / high) ** 4)
    out = np.fft.irfft(np.fft.rfft(noise) * mask, n=count)
    return out / (np.std(out) + 1e-9)


def put(at, signal, gain, pan=0):
    start = int(at * RATE)
    n = min(len(signal), len(t) - start)
    if n <= 0:
        return
    a = signal[:n] * gain
    mix[start:start + n, 0] += a * np.sqrt((1 - pan) / 2)
    mix[start:start + n, 1] += a * np.sqrt((1 + pan) / 2)


for channel in range(2):
    wind = band(LENGTH, 150, 1800) * .013 + band(LENGTH, 1250, 5000) * .004
    mix[:, channel] += wind * (.72 + .19 * np.sin(t * .39 + channel) + .12 * np.sin(t * 1.07))

for start in [1.3, 2.1, 3.8, 5.9, 7.8, 10.1, 12.5, 14.4, 15.2, 15.6, 16.2, 36.9, 38.7, 40.2]:
    pan = rng.uniform(-.75, .75)
    base = rng.uniform(1600, 2700)
    for j in range(rng.integers(2, 5)):
        duration = rng.uniform(.074, .17)
        u = np.arange(int(duration * RATE)) / RATE
        f = base * (1 + .32 * np.sin(u / duration * 3 + j * .2))
        chirp = np.sin(np.cumsum(f) * 2 * np.pi / RATE) * np.sin(np.pi * u / duration) ** 2
        put(start + j * .145, chirp, .022 + rng.uniform(0, .014), pan)

for start in np.arange(5, 32, 2.38):
    u = np.arange(int(1.7 * RATE)) / RATE
    pulse = (np.sin(u * 2 * np.pi * 76) + .21 * np.sin(u * 2 * np.pi * 152))
    pulse *= (1 - np.exp(-u * 9)) * np.exp(-u * 2.7)
    put(start, pulse, .035 + min(start / 300, .07), .16)

u = np.arange(13 * RATE) / RATE
groan = np.sin(2 * np.pi * (46 * u + .92 * u ** 2) + .29 * np.sin(u * 11))
groan += .3 * np.sin(2 * np.pi * (92 * u + 1.84 * u ** 2))
groan += band(13, 22, 165) * .72
put(14.2, groan * np.sin(np.pi * u / 13) ** 1.6, .075, .15)

for j in range(89):
    start = rng.uniform(16, 26)
    u = np.arange(int(.24 * RATE)) / RATE
    gravel = (band(.24, 350, rng.uniform(900, 4200)) + np.sin(u * rng.uniform(400, 1000))) * np.exp(-u * rng.uniform(28, 69))
    put(start, gravel, rng.uniform(.009, .029), rng.uniform(-.5, .8))

u = np.arange(int(8.1 * RATE)) / RATE
env = np.minimum(1, (u / 2.63) ** 2) * np.exp(-np.maximum(0, u - 3.09) * .92)
engine = band(8.1, 33, 1180) * .72 + np.sin(2 * np.pi * (39 * u + 7.3 * u ** 2)) * .59
put(29.6, engine * env, .16, .17)
u = np.arange(3 * RATE) / RATE
put(32.25, (band(3, 17, 145) + .69 * np.sin(2 * np.pi * (83 * u - 6 * u ** 2))) * np.exp(-u * 2.14) * (1 - np.exp(-u * 65)), .23)
for channel in range(2):
    u = np.arange(7 * RATE) / RATE
    leaves = band(7, 850, 4900) * (1 - np.exp(-u * 3)) * np.exp(-u * .51)
    mix[int(32.3 * RATE):int(32.3 * RATE) + len(u), channel] += leaves * .048

mix *= np.minimum(t / .45, 1)[:, None] * np.minimum((LENGTH - t) / 1.1, 1)[:, None]
mix = np.tanh(mix * 1.6) * .91
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav', 'wb') as file:
    file.setnchannels(2)
    file.setsampwidth(2)
    file.setframerate(RATE)
    file.writeframes((mix * 32767).astype('<i2').tobytes())