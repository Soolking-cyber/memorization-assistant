import { state } from './state.js';

export async function getAudioContext() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioCtx.state === 'suspended') {
        try {
            await state.audioCtx.resume();
        } catch (e) {
            console.warn("Failed to resume AudioContext:", e);
        }
    }
    return state.audioCtx;
}

export async function playUISound(type) {
    if (!state.soundEnabled) return;
    try {
        const ctx = await getAudioContext();
        const now = ctx.currentTime;
        
        if (type === 'click') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
            
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
            
            osc.start(now);
            osc.stop(now + 0.015);
        } else if (type === 'tooltip') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2000, now);
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.012);
            
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
            
            osc.start(now);
            osc.stop(now + 0.012);
        } else if (type === 'success') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.15, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'fail') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(164.81, now); // E3
            osc.frequency.exponentialRampToValueAtTime(130.81, now + 0.2); // C3
            
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'complete') {
            const notes = [261.63, 329.63, 392.00, 523.25];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                
                gain.gain.setValueAtTime(0.0, now + idx * 0.08);
                gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);
                
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.3);
            });
        }
    } catch (e) {
        console.warn("Failed to play synthesized sound:", e);
    }
}

export function initSoundSystem() {
    // Global listener to unlock AudioContext on first user gesture
    const unlockAudio = () => {
        if (!state.audioCtx) {
            state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (state.audioCtx && state.audioCtx.state === 'suspended') {
            state.audioCtx.resume().then(() => {
                // Play a brief silent buffer to warm up/prime Web Audio on iOS Safari
                try {
                    const buffer = state.audioCtx.createBuffer(1, 1, 22050);
                    const source = state.audioCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(state.audioCtx.destination);
                    source.start(0);
                } catch (e) {}
            });
        }
        // Remove listeners
        document.removeEventListener('click', unlockAudio, true);
        document.removeEventListener('touchstart', unlockAudio, true);
    };
    document.addEventListener('click', unlockAudio, true);
    document.addEventListener('touchstart', unlockAudio, true);

    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    if (!btnSoundToggle) return;
    
    const onIcon = btnSoundToggle.querySelector('.sound-icon-on');
    const offIcon = btnSoundToggle.querySelector('.sound-icon-off');
    
    const updateSoundUI = () => {
        if (state.soundEnabled) {
            onIcon.classList.remove('hidden');
            offIcon.classList.add('hidden');
        } else {
            onIcon.classList.add('hidden');
            offIcon.classList.remove('hidden');
        }
    };
    
    updateSoundUI();
    
    btnSoundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem('soundEnabled', state.soundEnabled);
        updateSoundUI();
        if (state.soundEnabled) {
            playUISound('click');
        }
    });

    // Global capture-phase click listener for micro-interaction sounds
    document.addEventListener('click', (e) => {
        const interactive = e.target.closest('button, .btn, .nav-btn, .header-icon-btn, [role="button"], .user-avatar, .card-type-tab, .node-btn, .toolbar-close-btn, .link-toolbar-btn, .color-swatch');
        if (interactive) {
            if (interactive.id === 'btn-sound-toggle') {
                return;
            }
            playUISound('click');
        }
    }, true);
}
