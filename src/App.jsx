import { useState, useRef } from 'react'
import { saveLetter, loadLetter } from './db.js'

/* ─── constants ─────────────────────────────────────────── */
const PAPERS = [
  { id:'cream',    bg:'#fdfaf3', lines:'rgba(180,160,120,0.13)', label:'cream'    },
  { id:'blush',    bg:'#fdf0ed', lines:'rgba(200,140,130,0.11)', label:'blush'    },
  { id:'sage',     bg:'#f0f5f0', lines:'rgba(100,140,100,0.10)', label:'sage'     },
  { id:'midnight', bg:'#131020', lines:'rgba(255,255,255,0.05)', label:'midnight' },
  { id:'ivory',    bg:'#faf8f0', lines:'rgba(160,150,100,0.10)', label:'ivory'    },
]
const INKS = [
  { color:'#2c1f0e', label:'walnut'    },
  { color:'#8b3a3a', label:'crimson'   },
  { color:'#2a4a6a', label:'navy'      },
  { color:'#4a3a6e', label:'violet'    },
  { color:'#2a5a3a', label:'forest'    },
  { color:'#7a5a20', label:'amber'     },
  { color:'#ede8e0', label:'moonlight' },
]
const FONTS = [
  { name:'Georgia, serif',           label:'classic'    },
  { name:"'Courier New', monospace", label:'typewriter' },
  { name:'Palatino, serif',          label:'elegant'    },
]
const STICKERS = ['🌸','✨','🌙','💌','🌷','⭐','🎀','🍵','🌿','🕊️','🫧','🪷']
const SPOTS = [
  { top:12,   right:18  }, { top:12, right:64   }, { top:12, right:110 },
  { bottom:80,left:18   }, { bottom:80,left:64  }, { top:12, right:156 },
]

/* ─── global styles ─────────────────────────────────────── */
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f7f0e6; }
  textarea, input { font-size: 16px; }
  @keyframes floatUp {
    0%   { transform:translateY(0) rotate(-10deg); opacity:0 }
    10%  { opacity:.35 }
    90%  { opacity:.12 }
    100% { transform:translateY(-110vh) rotate(10deg); opacity:0 }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(22px) }
    to   { opacity:1; transform:translateY(0) }
  }
  @keyframes stickerPop {
    from { transform:scale(0) rotate(-20deg) }
    to   { transform:scale(1) rotate(0) }
  }
  @keyframes letterIn {
    from { opacity:0; transform:translateY(36px) scale(.97) }
    to   { opacity:1; transform:translateY(0) scale(1) }
  }
`

/* ─── helpers ───────────────────────────────────────────── */
function SLabel({ t }) {
  return (
    <p style={{ fontFamily:"'Courier New',monospace", fontSize:'.57rem', letterSpacing:'.18em',
      color:'#5a4030', opacity:.52, marginBottom:'.5rem', textTransform:'uppercase' }}>{t}</p>
  )
}

function Chip({ active, onClick, children, extraStyle = {} }) {
  return (
    <button onClick={onClick} style={{
      padding:'.4rem 1rem', borderRadius:2, cursor:'pointer',
      fontFamily:'Georgia,serif', fontSize:'.85rem', transition:'all .18s',
      border: active ? 'none' : '1.5px solid rgba(44,32,24,.17)',
      background: active ? '#2c1f0e' : 'transparent',
      color: active ? '#f7f0e6' : '#5a4030', ...extraStyle,
    }}>{children}</button>
  )
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background:'none', border:'none', cursor:'pointer',
      fontFamily:"'Courier New',monospace", fontSize:'.63rem', letterSpacing:'.12em',
      color:'#5a4030', opacity:.52, marginBottom:'1.4rem', display:'block', padding:0,
      transition:'opacity .2s',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = 1}
      onMouseLeave={e => e.currentTarget.style.opacity = .52}
    >← back</button>
  )
}

/* ─── floating hearts ───────────────────────────────────── */
function Hearts() {
  const cfg = [
    {left:'9%',  delay:0,   size:'.7rem'  },
    {left:'23%', delay:1.5, size:'1.1rem' },
    {left:'38%', delay:3,   size:'.85rem' },
    {left:'52%', delay:.8,  size:'.6rem'  },
    {left:'64%', delay:2.2, size:'1rem'   },
    {left:'76%', delay:4,   size:'.75rem' },
    {left:'88%', delay:5.5, size:'.5rem'  },
  ]
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {cfg.map((c,i) => (
        <span key={i} style={{
          position:'absolute', left:c.left, bottom:'-5%',
          fontSize:c.size, color:'#c97b6e', opacity:0,
          animation:`floatUp ${7+i*.7}s ease-in ${c.delay}s infinite`,
        }}>♡</span>
      ))}
    </div>
  )
}

/* ─── paper component ───────────────────────────────────── */
function Paper({ paper, ink, ruled, stickers, font, photo, onPhotoClick, onRemovePhoto, readOnly, children }) {
  const dark = paper.id === 'midnight'
  const tc   = (ink.color === '#2c1f0e' && dark) ? '#ede8e0' : ink.color

  return (
    <div style={{
      position:'relative', background:paper.bg, borderRadius:2, overflow:'hidden', minHeight:440,
      padding:'clamp(1.4rem,5vw,2.8rem) clamp(1.2rem,5vw,3.2rem)',
      boxShadow: dark
        ? '0 14px 60px rgba(0,0,0,.55),0 3px 12px rgba(0,0,0,.3)'
        : '0 8px 40px rgba(44,32,24,.13),0 2px 8px rgba(44,32,24,.07)',
    }}>
      {/* top stripe */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
        background:'linear-gradient(90deg,#c97b6e,#c9a96e,#c97b6e)', opacity:dark?.9:.55 }}/>

      {/* ruled lines */}
      {ruled && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', marginTop:70,
          backgroundImage:`repeating-linear-gradient(transparent,transparent 39px,${
            dark ? 'rgba(255,255,255,0.08)' : 'rgba(140,110,70,0.13)'
          } 39px,${
            dark ? 'rgba(255,255,255,0.08)' : 'rgba(140,110,70,0.13)'
          } 40px)`,
        }}/>
      )}

      {/* stickers */}
      {stickers.map((s,i) => (
        <span key={i} style={{
          position:'absolute', fontSize:'1.55rem', pointerEvents:'none', userSelect:'none', zIndex:10,
          animation:'stickerPop .3s cubic-bezier(.175,.885,.32,1.275) both',
          animationDelay: i*.07+'s', ...SPOTS[i % SPOTS.length],
        }}>{s}</span>
      ))}

      {/* photo slot (composer only) */}
      {!readOnly && (
        <div
          onClick={photo ? undefined : onPhotoClick}
          style={{
            width:'100%', marginBottom:'1.1rem', borderRadius:2, overflow:'hidden',
            zIndex:3, position:'relative', transition:'border-color .2s',
            border: photo ? 'none' : `1.5px dashed ${dark ? 'rgba(255,255,255,.14)' : 'rgba(44,32,24,.14)'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            minHeight: photo ? 0 : 100, cursor: photo ? 'default' : 'pointer',
          }}
          onMouseEnter={e => { if (!photo) e.currentTarget.style.borderColor = '#c97b6e' }}
          onMouseLeave={e => { if (!photo) e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,.14)' : 'rgba(44,32,24,.14)' }}
        >
          {photo ? (
            <div style={{ position:'relative', width:'100%' }}>
              <img src={photo} alt="" style={{ width:'100%', maxHeight:400, objectFit:'cover', display:'block' }}/>
              <button
                onClick={e => { e.stopPropagation(); onRemovePhoto() }}
                style={{ position:'absolute', top:6, right:6, width:22, height:22, borderRadius:'50%',
                  background:'rgba(0,0,0,.55)', color:'#fff', border:'none', cursor:'pointer',
                  fontSize:'.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}
              >×</button>
            </div>
          ) : (
            <span style={{ fontFamily:"'Courier New',monospace", fontSize:'.58rem', letterSpacing:'.15em',
              color: dark ? 'rgba(255,255,255,.28)' : 'rgba(44,32,24,.28)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <span style={{ fontSize:'1.2rem' }}>✦</span>ADD A PHOTO
            </span>
          )}
        </div>
      )}

      {/* photo (read view) */}
      {readOnly && photo && (
        <img src={photo} alt="" style={{
          width:'100%', maxHeight:400, objectFit:'cover', borderRadius:2,
          marginBottom:'1.2rem', display:'block', position:'relative', zIndex:3,
        }}/>
      )}

      <div style={{ position:'relative', zIndex:2, color:tc, fontFamily:font }}>
        {children}
      </div>
    </div>
  )
}

/* ─── landing ───────────────────────────────────────────── */
function Landing({ onStart, onOpenCode }) {
  const [code,   setCode]   = useState('')
  const [err,    setErr]    = useState('')
  const [busy,   setBusy]   = useState(false)

  const open = async () => {
    if (!code.trim()) return
    setBusy(true); setErr('')
    try {
      const d = await loadLetter(code.trim())
      if (!d) setErr('no letter found with that code :(')
      else onOpenCode(d)
    } catch { setErr("couldn't load — try again") }
    setBusy(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', background:'#f7f0e6', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0,
        backgroundImage:'repeating-linear-gradient(transparent,transparent 38px,rgba(180,140,100,.07) 38px,rgba(180,140,100,.07) 39px)' }}/>
      <Hearts/>

      <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'2rem',
        animation:'fadeUp 1.1s ease both', maxWidth:400, width:'100%' }}>

        {/* stamp */}
        <div style={{ width:76, height:76, borderRadius:'50%', border:'2.5px solid #c9a96e',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 1.8rem', fontSize:'1.8rem', color:'#c9a96e', position:'relative' }}>
          <span style={{ position:'absolute', inset:5, borderRadius:'50%', border:'1px solid rgba(201,169,110,.22)' }}/>
          ♡
        </div>

        <h1 style={{ fontFamily:"Georgia,'Times New Roman',serif", fontSize:'clamp(3.2rem,9vw,6rem)',
          fontWeight:400, letterSpacing:'-.02em', color:'#2c1f0e', lineHeight:1, marginBottom:'.4rem' }}>
          dear<em style={{ color:'#c97b6e' }}>love</em>
        </h1>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontStyle:'italic', color:'#5a4030',
          opacity:.72, marginBottom:'2.4rem', letterSpacing:'.02em' }}>
          some things are better written.<br/>some people are worth the effort.
        </p>

        <button onClick={onStart} style={{
          display:'block', width:'100%', padding:'.95rem',
          background:'#2c1f0e', color:'#f7f0e6', border:'none', cursor:'pointer',
          fontFamily:'Georgia,serif', fontSize:'1rem', letterSpacing:'.07em',
          marginBottom:'1rem', transition:'background .22s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#c97b6e'}
          onMouseLeave={e => e.currentTarget.style.background = '#2c1f0e'}
        >write a letter →</button>

        {/* open by code */}
        <div style={{ display:'flex', gap:'.4rem' }}>
          <input
            value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && open()}
            placeholder="have a code? open a letter…"
            style={{ flex:1, border:'none', borderBottom:'1.5px solid rgba(44,32,24,.18)',
              background:'transparent', outline:'none', padding:'.4rem 0',
              fontFamily:"'Courier New',monospace", fontSize:'.85rem',
              color:'#2c1f0e', letterSpacing:'.1em' }}
          />
          <button onClick={open} disabled={busy} style={{
            background:'none', border:'1.5px solid rgba(44,32,24,.18)',
            padding:'.3rem .9rem', cursor:'pointer',
            fontFamily:"'Courier New',monospace", fontSize:'.65rem', letterSpacing:'.1em',
            color:'#5a4030', transition:'border-color .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#c97b6e'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(44,32,24,.18)'}
          >{busy ? '…' : 'open'}</button>
        </div>
        {err && <p style={{ fontFamily:"'Courier New',monospace", fontSize:'.62rem', color:'#c97b6e', marginTop:'.4rem', letterSpacing:'.08em' }}>{err}</p>}
      </div>

      <p style={{ position:'absolute', bottom:'1.6rem', fontFamily:"'Courier New',monospace",
        fontSize:'.58rem', letterSpacing:'.15em', color:'#5a4030', opacity:.38 }}>
        DEARLOVE · A SMALL LETTER · A REAL FEELING
      </p>
    </div>
  )
}

/* ─── composer ──────────────────────────────────────────── */
function Composer({ onSend, onBack }) {
  const [paper,    setPaper]    = useState(PAPERS[0])
  const [ink,      setInk]      = useState(INKS[0])
  const [font,     setFont]     = useState(FONTS[0].name)
  const [ruled,    setRuled]    = useState(false)
  const [stickers, setStickers] = useState([])
  const [photo,    setPhoto]    = useState(null)
  const [body,     setBody]     = useState('')
  const [sign,     setSign]     = useState('')
  const [to,       setTo]       = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')
  const fileRef = useRef()

  const dark = paper.id === 'midnight'
  const tc   = (ink.color === '#2c1f0e' && dark) ? '#ede8e0' : ink.color

  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return
    const img = new Image(), url = URL.createObjectURL(file)
    img.onload = () => {
      const s = img.width > 800 ? 800 / img.width : 1
      const c = document.createElement('canvas')
      c.width = img.width * s; c.height = img.height * s
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      setPhoto(c.toDataURL('image/jpeg', .78))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const send = async () => {
    if (!body.trim()) return
    setSaving(true); setErr('')
    try {
      const data = {
        paper: paper.id, inkColor: ink.color, font, ruled, stickers, photo, body, sign, to,
        date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }),
      }
      const code = await saveLetter(data)
      onSend(code, data)
    } catch { setErr("couldn't save — try again") }
    setSaving(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f7f0e6', padding:'2rem 1rem 5rem' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <BackBtn onClick={onBack}/>

        <p style={{ fontFamily:"'Courier New',monospace", fontSize:'.58rem', letterSpacing:'.2em',
          color:'#c97b6e', marginBottom:'.3rem', textTransform:'uppercase' }}>compose</p>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.65rem', fontWeight:400,
          fontStyle:'italic', color:'#2c1f0e', marginBottom:'2rem' }}>write them something real</h2>

        {/* paper picker */}
        <div style={{ marginBottom:'1rem' }}>
          <SLabel t="paper"/>
          <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
            {PAPERS.map(p => <Chip key={p.id} active={paper.id===p.id} onClick={()=>setPaper(p)}>{p.label}</Chip>)}
            <Chip active={ruled} onClick={()=>setRuled(r=>!r)}>ruled</Chip>
          </div>
        </div>

        {/* font picker */}
        <div style={{ marginBottom:'1.5rem' }}>
          <SLabel t="handwriting"/>
          <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
            {FONTS.map(f => <Chip key={f.name} active={font===f.name} onClick={()=>setFont(f.name)} extraStyle={{ fontFamily:f.name }}>{f.label}</Chip>)}
          </div>
        </div>

        {/* the paper */}
        <div style={{ marginBottom:'1.5rem' }}>
          <Paper paper={paper} ink={ink} ruled={ruled} stickers={stickers} font={font}
            photo={photo} onPhotoClick={()=>fileRef.current.click()} onRemovePhoto={()=>{ setPhoto(null); fileRef.current.value='' }}>

            {/* from / date row */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              marginBottom:'1.6rem', fontFamily:"'Courier New',monospace", fontSize:'.58rem',
              letterSpacing:'.11em', color: dark ? 'rgba(255,255,255,.28)' : 'rgba(44,32,24,.33)' }}>
              <span>from, {sign || 'someone who means it'}</span>
              <span>{new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span>
            </div>

            <textarea value={body} onChange={e=>setBody(e.target.value)}
              placeholder={"dear you,\n\ni've been meaning to tell you something..."}
              rows={9}
              style={{ width:'100%', border:'none', outline:'none', resize:'none',
                background:'transparent', fontFamily:font, fontSize:'1.08rem',
                lineHeight:'2.45rem', color:tc, caretColor:'#c97b6e' }}
            />

            <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginTop:'1.1rem',
              fontFamily:font, fontStyle:'italic', fontSize:'1.15rem', color:tc }}>
              <span>with love,</span>
              <input value={sign} onChange={e=>setSign(e.target.value)} placeholder="your name"
                style={{ border:'none', borderBottom:`1px solid ${dark?'rgba(255,255,255,.18)':'rgba(44,32,24,.18)'}`,
                  background:'transparent', outline:'none', fontFamily:font, fontStyle:'italic',
                  fontSize:'1.15rem', color:tc, width:148, padding:'0 0 2px' }}
              />
            </div>
          </Paper>
        </div>

        {/* ink + stickers */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.4rem', marginBottom:'1.4rem' }}>
          <div>
            <SLabel t="ink"/>
            <div style={{ display:'flex', gap:'.42rem', flexWrap:'wrap' }}>
              {INKS.map(k => (
                <div key={k.color} onClick={()=>setInk(k)} title={k.label} style={{
                  width:25, height:25, borderRadius:'50%', background:k.color,
                  outline:'1.5px solid rgba(44,32,24,.11)', cursor:'pointer', transition:'transform .15s',
                  border: ink.color===k.color ? '2.5px solid #2c1f0e' : '2.5px solid transparent',
                  transform: ink.color===k.color ? 'scale(1.22)' : 'scale(1)',
                }}/>
              ))}
            </div>
          </div>
          <div>
            <SLabel t={`stickers (${stickers.length}/6)`}/>
            <div style={{ display:'flex', gap:'.38rem', flexWrap:'wrap' }}>
              {STICKERS.map(s => (
                <button key={s} onClick={()=>{ if(stickers.length<6) setStickers(p=>[...p,s]) }}
                  style={{ width:33, height:33, border:'1.5px solid rgba(44,32,24,.11)', background:'#fdfaf3',
                    borderRadius:4, fontSize:'1.05rem', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .15s,border-color .15s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#c97b6e'; e.currentTarget.style.transform='scale(1.18) rotate(6deg)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(44,32,24,.11)'; e.currentTarget.style.transform='scale(1)' }}
                >{s}</button>
              ))}
              {stickers.length > 0 && (
                <button onClick={()=>setStickers([])}
                  style={{ width:33, height:33, border:'1.5px solid rgba(44,32,24,.11)', background:'transparent',
                    borderRadius:4, fontSize:'.58rem', cursor:'pointer', fontFamily:"'Courier New',monospace", color:'#c97b6e' }}
                >clr</button>
              )}
            </div>
          </div>
        </div>

        {/* to */}
        <div style={{ marginBottom:'1.4rem' }}>
          <SLabel t="send to"/>
          <input value={to} onChange={e=>setTo(e.target.value)} placeholder="their name (e.g. my love, Sarah…)"
            style={{ border:'none', borderBottom:'1.5px solid rgba(44,32,24,.18)', background:'transparent',
              outline:'none', width:'100%', fontFamily:'Georgia,serif', fontSize:'1rem',
              color:'#2c1f0e', padding:'.2rem 0', transition:'border-color .2s' }}
            onFocus={e=>e.target.style.borderBottomColor='#c97b6e'}
            onBlur={e=>e.target.style.borderBottomColor='rgba(44,32,24,.18)'}
          />
        </div>

        {err && <p style={{ fontFamily:"'Courier New',monospace", fontSize:'.62rem', color:'#c97b6e', marginBottom:'.7rem', letterSpacing:'.08em' }}>{err}</p>}

        <button onClick={send} disabled={saving || !body.trim()} style={{
          width:'100%', padding:'1.1rem',
          background: (saving || !body.trim()) ? 'rgba(44,32,24,.28)' : '#2c1f0e',
          color:'#f7f0e6', border:'none',
          cursor: (saving || !body.trim()) ? 'not-allowed' : 'pointer',
          fontFamily:'Georgia,serif', fontSize:'1.08rem', fontStyle:'italic',
          letterSpacing:'.04em', transition:'background .22s',
        }}
          onMouseEnter={e=>{ if(!saving && body.trim()) e.currentTarget.style.background='#c97b6e' }}
          onMouseLeave={e=>{ if(!saving && body.trim()) e.currentTarget.style.background='#2c1f0e' }}
        >{saving ? 'sealing your letter…' : 'seal & send the letter ♡'}</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto}/>
    </div>
  )
}

/* ─── share view ────────────────────────────────────────── */
function ShareView({ code, letter, onWriteAnother }) {
  const [copied,  setCopied]  = useState(false)
  const [preview, setPreview] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code).catch(()=>{})
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f7f0e6', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'2rem 1rem' }}>
      <div style={{ maxWidth:480, width:'100%', textAlign:'center', animation:'fadeUp .8s ease both' }}>
        <div style={{ fontSize:'3rem', marginBottom:'.8rem' }}>💌</div>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.85rem', fontWeight:400,
          fontStyle:'italic', color:'#2c1f0e', marginBottom:'.3rem' }}>your letter is sealed</h2>
        <p style={{ fontFamily:'Georgia,serif', fontStyle:'italic', color:'#5a4030', opacity:.68, marginBottom:'2rem' }}>
          share this code — they enter it on the home page to open it
        </p>

        <div style={{ background:'#fdfaf3', border:'1.5px solid rgba(44,32,24,.14)', padding:'1.5rem', marginBottom:'1.2rem' }}>
          <p style={{ fontFamily:"'Courier New',monospace", fontSize:'.57rem', letterSpacing:'.2em',
            color:'#5a4030', opacity:.48, textTransform:'uppercase', marginBottom:'.6rem' }}>letter code</p>
          <p style={{ fontFamily:"'Courier New',monospace", fontSize:'2.4rem', letterSpacing:'.4em',
            color:'#2c1f0e', marginBottom:'.9rem' }}>{code}</p>
          <button onClick={copy} style={{
            background: copied ? '#7a9e7e' : '#2c1f0e', color:'#f7f0e6',
            border:'none', padding:'.5rem 1.6rem', cursor:'pointer',
            fontFamily:"'Courier New',monospace", fontSize:'.65rem',
            letterSpacing:'.12em', transition:'background .2s',
          }}>{copied ? '✓ COPIED!' : 'COPY CODE'}</button>
        </div>

        <p style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:'.85rem',
          color:'#5a4030', opacity:.52, marginBottom:'1.1rem' }}>
          tell {letter.to || 'them'} to come here and type in the code above ↑
        </p>

        <button onClick={()=>setPreview(p=>!p)} style={{
          background:'none', border:'1.5px solid rgba(44,32,24,.16)', padding:'.6rem 1.4rem',
          cursor:'pointer', fontFamily:'Georgia,serif', fontSize:'.9rem', fontStyle:'italic',
          color:'#5a4030', width:'100%', marginBottom:'.8rem', transition:'border-color .2s',
        }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='#c97b6e'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(44,32,24,.16)'}
        >{preview ? 'hide preview' : 'preview the letter →'}</button>

        {preview && <LetterView letter={letter} minimal/>}

        <button onClick={onWriteAnother} style={{
          width:'100%', padding:'.95rem', background:'#2c1f0e', color:'#f7f0e6',
          border:'none', cursor:'pointer', fontFamily:'Georgia,serif', fontSize:'1rem',
          letterSpacing:'.06em', marginTop:'.5rem', transition:'background .22s',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='#c97b6e'}
          onMouseLeave={e=>e.currentTarget.style.background='#2c1f0e'}
        >write another →</button>
      </div>
    </div>
  )
}

/* ─── letter view ───────────────────────────────────────── */
function LetterView({ letter, onWriteBack, minimal }) {
  const paper = PAPERS.find(p => p.id === letter.paper) || PAPERS[0]
  const ink   = INKS.find(k => k.color === letter.inkColor) || INKS[0]
  const dark  = paper.id === 'midnight'
  const tc    = (ink.color === '#2c1f0e' && dark) ? '#ede8e0' : ink.color

  return (
    <div style={{ textAlign:'left', animation:'letterIn 1s ease both', marginBottom: minimal ? '1.2rem' : 0 }}>
      {!minimal && (
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <p style={{ fontFamily:"'Courier New',monospace", fontSize:'.57rem', letterSpacing:'.2em',
            textTransform:'uppercase', color:'#5a4030', opacity:.44, marginBottom:'.22rem' }}>a letter for</p>
          <h3 style={{ fontFamily:'Georgia,serif', fontSize:'1.6rem', fontStyle:'italic',
            fontWeight:400, color:'#2c1f0e' }}>{letter.to || 'you'}</h3>
        </div>
      )}

      <Paper paper={paper} ink={ink} ruled={letter.ruled} stickers={letter.stickers||[]}
        font={letter.font} photo={letter.photo} readOnly>

        {/* postmark */}
        <div style={{ textAlign:'right', marginBottom:'1.3rem' }}>
          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', width:64, height:64, borderRadius:'50%',
            border:`1.5px solid ${dark?'rgba(255,255,255,.18)':'rgba(44,32,24,.16)'}`,
            color: dark?'rgba(255,255,255,.32)':'rgba(44,32,24,.3)' }}>
            <span style={{ fontFamily:"'Courier New',monospace", fontSize:'.38rem', letterSpacing:'.1em', textTransform:'uppercase' }}>DEARLOVE</span>
            <span style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:'.6rem', margin:'1px 0' }}>♡</span>
            <span style={{ fontFamily:"'Courier New',monospace", fontSize:'.36rem', letterSpacing:'.06em' }}>{(letter.date||'').toUpperCase()}</span>
          </div>
        </div>

        <p style={{ fontFamily:"'Courier New',monospace", fontSize:'.58rem', letterSpacing:'.1em',
          color: dark?'rgba(255,255,255,.26)':'rgba(44,32,24,.27)', marginBottom:'1.1rem' }}>{letter.date}</p>

        <p style={{ fontFamily:letter.font, fontSize:'1.08rem', lineHeight:'2rem',
          whiteSpace:'pre-wrap', color:tc, wordBreak:'break-word' }}>{letter.body}</p>

        {letter.sign && (
          <p style={{ marginTop:'1.6rem', fontFamily:letter.font, fontStyle:'italic', fontSize:'1.25rem', color:tc }}>
            with love, {letter.sign}
          </p>
        )}
      </Paper>

      {!minimal && onWriteBack && (
        <div style={{ textAlign:'center', marginTop:'1.8rem' }}>
          <button onClick={onWriteBack} style={{
            padding:'.9rem 2.8rem', background:'#2c1f0e', color:'#f7f0e6',
            border:'none', cursor:'pointer', fontFamily:'Georgia,serif',
            fontSize:'1rem', letterSpacing:'.06em', transition:'background .22s',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#c97b6e'}
            onMouseLeave={e=>e.currentTarget.style.background='#2c1f0e'}
          >write one back →</button>
        </div>
      )}
    </div>
  )
}

/* ─── app ───────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState('landing')
  const [letter, setLetter] = useState(null)
  const [code,   setCode]   = useState('')

  return (
    <>
      <style>{G}</style>
      {screen === 'landing' && (
        <Landing
          onStart={() => setScreen('compose')}
          onOpenCode={d => { setLetter(d); setScreen('read') }}
        />
      )}
      {screen === 'compose' && (
        <Composer
          onSend={(c, d) => { setCode(c); setLetter(d); setScreen('share') }}
          onBack={() => setScreen('landing')}
        />
      )}
      {screen === 'share' && (
        <ShareView code={code} letter={letter} onWriteAnother={() => setScreen('compose')}/>
      )}
      {screen === 'read' && (
        <LetterView letter={letter} onWriteBack={() => setScreen('compose')}/>
      )}
    </>
  )
}
