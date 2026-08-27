// Synthèse sonore (Web Audio) et vibration. Auto-contenu : ne dépend que de l'API du
// navigateur et de son propre interrupteur snd.on.
export const snd = {
  on:true, ac:null,
  ready(){
    if(this.ac || typeof AudioContext==='undefined' && typeof webkitAudioContext==='undefined') return this.ac;
    const AC = typeof AudioContext!=='undefined' ? AudioContext : webkitAudioContext;
    try{ this.ac = new AC(); }catch(e){ this.ac = null; }
    return this.ac;
  },
  env(when,dur,peak){
    const g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when+dur);
    g.connect(this.ac.destination);
    return g;
  },
  tone(freq,when,dur,peak,type){
    const o = this.ac.createOscillator();
    o.type = type||'sine'; o.frequency.setValueAtTime(freq, when);
    o.connect(this.env(when,dur,peak)); o.start(when); o.stop(when+dur+0.05);
    return o;
  },
  clac(){                                     // pose : bois mat, hauteur qui retombe
    if(!this.on || !this.ready()) return;
    const t = this.ac.currentTime;
    const o = this.tone(210,t,0.09,0.16,'triangle');
    o.frequency.exponentialRampToValueAtTime(105, t+0.08);
    this.tone(1400,t,0.03,0.05,'square');
  },
  carillon(i,total,delay){                    // fermeture : une note par tuile, montante
    if(!this.on || !this.ready()) return;
    const scale = [523.25,587.33,659.25,783.99,880,1046.5,1174.7,1318.5];
    const f = scale[Math.min(i,scale.length-1)];
    const t = this.ac.currentTime + delay;
    this.tone(f,t,0.55,0.09,'sine');
    if(i===total-1) this.tone(f*1.5,t,0.8,0.05,'sine');
  },
  fanfare(){                                  // trois notes montantes pour un record
    if(!this.on || !this.ready()) return;
    const t = this.ac.currentTime;
    [659.25, 830.61, 987.77].forEach((f,i)=>{
      this.tone(f, t+i*0.13, 0.5, 0.09, 'sine');
      if(i===2) this.tone(f*2, t+i*0.13, 0.7, 0.04, 'sine');
    });
  },
  defausse(){
    if(!this.on || !this.ready()) return;
    const t = this.ac.currentTime;
    const o = this.tone(320,t,0.18,0.08,'sawtooth');
    o.frequency.exponentialRampToValueAtTime(120, t+0.17);
  }
};

export function buzz(ms){ try{ if(typeof navigator!=='undefined' && navigator.vibrate) navigator.vibrate(ms); }catch(e){} }
