import { useState, useRef, useCallback, useEffect } from "react";

const MENU_ITEMS = {
  "🍎": ["About This Macintosh...", "---", "Alarm Clock", "Calculator", "Control Panel", "Key Caps", "Note Pad", "Puzzle", "Scrapbook"],
  File: ["New Folder", "Open", "Print", "Close", "---", "Get Info", "Duplicate", "---", "Put Back", "---", "Page Setup...", "Print Directory..."],
  Edit: ["Undo ⌘Z", "---", "Cut ⌘X", "Copy ⌘C", "Paste ⌘V", "Clear", "---", "Select All ⌘A"],
  View: ["by Icon", "by Name", "by Date", "by Size", "by Kind"],
  Special: ["Clean Up", "Empty Trash", "Erase Disk", "Set Startup...", "---", "Restart", "Shut Down"],
};

const DESKTOP_ICONS = [
  { id: "hd", label: "Macintosh HD", emoji: "💾" },
  { id: "system", label: "System Folder", emoji: "📁" },
  { id: "docs", label: "Documents", emoji: "📄" },
  { id: "apps", label: "Applications", emoji: "🗂️" },
  { id: "trash", label: "Trash", emoji: "🗑️" },
];

const APP_ITEMS = [
  { name: "Calculator", emoji: "🧮", appId: "calculator" },
  { name: "Note Pad", emoji: "📝", appId: "notepad" },
  { name: "Puzzle", emoji: "🧩", appId: "puzzle" },
  { name: "Alarm Clock", emoji: "⏰", appId: "alarm" },
  { name: "MacPaint", emoji: "🎨", appId: "paint" },
  { name: "Control Panel", emoji: "🎛️", appId: "control" },
  { name: "Key Caps", emoji: "⌨️", appId: "keycaps" },
  { name: "Finder", emoji: "🖥️" },
];

const HD_ITEMS = [
  { name: "System Folder", emoji: "📁" },
  { name: "Applications", emoji: "🗂️", folderId: "apps" },
  { name: "Documents", emoji: "📄", folderId: "docs" },
  { name: "ReadMe", emoji: "📝", appId: "readme" },
  { name: "Fonts", emoji: "🔤" },
  { name: "Preferences", emoji: "⚙️" },
  { name: "Utilities", emoji: "🔧" },
  { name: "Games", emoji: "🎮", folderId: "games" },
];

const DOC_ITEMS = [
  { name: "Letter.txt", emoji: "📝", appId: "letter" },
  { name: "Budget.xlsx", emoji: "📊" },
  { name: "Photo.bmp", emoji: "🖼️" },
  { name: "Notes", emoji: "📋", appId: "notes" },
  { name: "Resume.txt", emoji: "📄", appId: "resume" },
];

const GAME_ITEMS = [
  { name: "Puzzle", emoji: "🧩", appId: "puzzle" },
  { name: "Solitaire", emoji: "🃏" },
  { name: "Chess", emoji: "♟️" },
];

const TEXT_FILES = {
  readme: `Welcome to Macintosh!\n\nThank you for purchasing the Apple\nMacintosh personal computer.\n\nThis system includes:\n  - 128K RAM\n  - 3.5" Floppy Disk Drive\n  - 9" B&W Display\n  - Mouse & Keyboard\n\nTo get started, double-click on\nany icon to open it.\n\nEnjoy your new Macintosh!\n  — The Macintosh Team, 1984`,
  letter: `Dear Friend,\n\nI am writing to you from my\nbrand new Macintosh computer.\n\nThe graphical interface is truly\nrevolutionary. I can see actual\nwindows and icons on screen!\n\nThe future is here.\n\nBest regards,\nA Happy Mac User`,
  notes: `Shopping List:\n- Floppy disks (box of 10)\n- Printer ribbon\n- ImageWriter paper\n- MacPaint manual\n\nTODO:\n- Learn MacWrite\n- Back up System disk\n- Try the Puzzle desk accessory`,
  resume: `RESUME\n\nName: Mac User\nComputer: Macintosh 128K\n\nSKILLS:\n- MacWrite\n- MacPaint\n- Spreadsheet\n- Filing\n\nEXPERIENCE:\n- Desktop Publishing\n- Document Creation\n- Digital Art\n\nREFERENCES:\nAvailable upon request.`,
};

function PatternDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <pattern id="dp" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#a8a8a8" />
          <rect width="1" height="1" x="0" y="0" fill="#fff" />
          <rect width="1" height="1" x="2" y="2" fill="#fff" />
        </pattern>
        <pattern id="tp" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#fff" />
          <rect width="1" height="1" x="0" y="0" fill="#000" />
          <rect width="1" height="1" x="1" y="1" fill="#000" />
        </pattern>
        <pattern id="sp" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#fff" />
          <rect width="1" height="1" x="0" y="0" fill="#bbb" />
          <rect width="1" height="1" x="1" y="1" fill="#bbb" />
        </pattern>
      </defs>
    </svg>
  );
}

/* ═══ CALCULATOR ═══ */
function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);

  const input = (d) => {
    if (fresh) { setDisplay(d); setFresh(false); }
    else setDisplay(display === "0" && d !== "." ? d : display + d);
  };
  const doOp = (next) => {
    const cur = parseFloat(display);
    if (prev !== null && op && !fresh) {
      const r = op === "+" ? prev + cur : op === "-" ? prev - cur : op === "×" ? prev * cur : op === "÷" && cur !== 0 ? prev / cur : cur;
      const str = String(parseFloat(r.toFixed(8)));
      setDisplay(str); setPrev(parseFloat(str));
    } else setPrev(cur);
    setOp(next); setFresh(true);
  };
  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setFresh(true); };

  const Btn = ({ label, action, wide }) => (
    <div onClick={action} style={{ ...st.calcBtn, ...(wide ? { gridColumn: "span 2" } : {}) }}
      onMouseDown={e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
      onMouseUp={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
    >{label}</div>
  );

  return (
    <div style={st.calcWrap}>
      <div style={st.calcDisplay}>{display}</div>
      <div style={st.calcGrid}>
        <Btn label="C" action={clear} /><Btn label="±" action={() => setDisplay(String(-parseFloat(display)))} />
        <Btn label="%" action={() => setDisplay(String(parseFloat(display) / 100))} /><Btn label="÷" action={() => doOp("÷")} />
        <Btn label="7" action={() => input("7")} /><Btn label="8" action={() => input("8")} />
        <Btn label="9" action={() => input("9")} /><Btn label="×" action={() => doOp("×")} />
        <Btn label="4" action={() => input("4")} /><Btn label="5" action={() => input("5")} />
        <Btn label="6" action={() => input("6")} /><Btn label="-" action={() => doOp("-")} />
        <Btn label="1" action={() => input("1")} /><Btn label="2" action={() => input("2")} />
        <Btn label="3" action={() => input("3")} /><Btn label="+" action={() => doOp("+")} />
        <Btn label="0" action={() => input("0")} wide /><Btn label="." action={() => input(".")} />
        <Btn label="=" action={() => doOp(null)} />
      </div>
    </div>
  );
}

/* ═══ NOTEPAD ═══ */
function NotePadApp() {
  const [text, setText] = useState("Welcome to Macintosh!\n\nType your notes here...");
  const [page, setPage] = useState(1);
  return (
    <div style={st.noteWrap}>
      <div style={st.noteBar}>
        <span onClick={() => setPage(Math.max(1, page - 1))} style={st.noteNav}>◀</span>
        <span style={{ fontSize: 11 }}>Page {page}</span>
        <span onClick={() => setPage(page + 1)} style={st.noteNav}>▶</span>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} style={st.noteArea} spellCheck={false} />
    </div>
  );
}

/* ═══ PUZZLE ═══ */
function PuzzleApp() {
  const SIZE = 4;
  const init = () => {
    let t = [...Array(15)].map((_, i) => i + 1); t.push(null);
    for (let i = t.length - 2; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[t[i], t[j]] = [t[j], t[i]]; }
    return t;
  };
  const [tiles, setTiles] = useState(init);
  const [moves, setMoves] = useState(0);
  const slide = (idx) => {
    const empty = tiles.indexOf(null);
    const r = Math.floor(idx / SIZE), c = idx % SIZE, er = Math.floor(empty / SIZE), ec = empty % SIZE;
    if ((Math.abs(r - er) === 1 && c === ec) || (Math.abs(c - ec) === 1 && r === er)) {
      const next = [...tiles];[next[idx], next[empty]] = [next[empty], next[idx]];
      setTiles(next); setMoves(moves + 1);
    }
  };
  const won = tiles.slice(0, 15).every((t, i) => t === i + 1);
  return (
    <div style={st.puzzleWrap}>
      <div style={st.puzzleInfo}>Moves: {moves} {won && " 🎉 You won!"}</div>
      <div style={st.puzzleGrid}>
        {tiles.map((t, i) => (
          <div key={i} onClick={() => t !== null && slide(i)} style={{
            ...st.puzzleTile, ...(t === null ? st.puzzleEmpty : { cursor: "pointer" }),
          }}>{t}</div>
        ))}
      </div>
      <div onClick={() => { setTiles(init()); setMoves(0); }} style={st.puzzleReset}>New Game</div>
    </div>
  );
}

/* ═══ ALARM CLOCK ═══ */
function AlarmClockApp() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  const h = time.getHours(), m = time.getMinutes(), sec = time.getSeconds();
  const pad = n => String(n).padStart(2, "0");
  return (
    <div style={st.alarmWrap}>
      <div style={st.alarmDisplay}>
        <span style={st.alarmTime}>{h % 12 || 12}:{pad(m)}:{pad(sec)}</span>
        <span style={st.alarmAmpm}>{h >= 12 ? "PM" : "AM"}</span>
      </div>
      <div style={st.alarmDate}>{time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      <div style={{ fontSize: 20, letterSpacing: 8, marginTop: 4 }}>⏰ 🔔 🕐</div>
    </div>
  );
}

/* ═══ MACPAINT ═══ */
function MacPaintApp() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const [brushSize, setBrushSize] = useState(2);
  const lastPos = useRef(null);

  useEffect(() => { const c = canvasRef.current; if (c) { const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); } }, []);

  const getPos = e => { const r = canvasRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const draw = e => {
    if (!drawing) return;
    const ctx = canvasRef.current.getContext("2d"), pos = getPos(e);
    ctx.strokeStyle = tool === "eraser" ? "#fff" : "#000";
    ctx.lineWidth = tool === "eraser" ? 14 : brushSize; ctx.lineCap = "round";
    if (lastPos.current) { ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
    lastPos.current = pos;
  };
  const clearCanvas = () => { const ctx = canvasRef.current.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height); };

  return (
    <div style={st.paintWrap}>
      <div style={st.paintToolbar}>
        {[["pen", "✏️"], ["eraser", "🧹"]].map(([id, e]) => (
          <div key={id} onClick={() => setTool(id)} style={{ ...st.paintTool, ...(tool === id ? { background: "#000", filter: "invert(1)" } : {}) }}>{e}</div>
        ))}
        <div style={st.paintSep} />
        {[1, 2, 4, 8].map(sz => (
          <div key={sz} onClick={() => { setTool("pen"); setBrushSize(sz); }} style={{ ...st.paintTool, ...(brushSize === sz && tool === "pen" ? { background: "#000" } : {}) }}>
            <div style={{ width: Math.min(sz * 2 + 2, 18), height: Math.min(sz * 2 + 2, 18), borderRadius: "50%", background: brushSize === sz && tool === "pen" ? "#fff" : "#000" }} />
          </div>
        ))}
        <div style={st.paintSep} />
        <div onClick={clearCanvas} style={st.paintTool}>🗑️</div>
      </div>
      <canvas ref={canvasRef} width={400} height={280} style={st.paintCanvas}
        onMouseDown={e => { setDrawing(true); lastPos.current = getPos(e); }}
        onMouseMove={draw}
        onMouseUp={() => { setDrawing(false); lastPos.current = null; }}
        onMouseLeave={() => { setDrawing(false); lastPos.current = null; }}
      />
    </div>
  );
}

/* ═══ CONTROL PANEL ═══ */
function ControlPanelApp() {
  const [volume, setVolume] = useState(5);
  const [speed, setSpeed] = useState(3);
  const [pattern, setPattern] = useState(0);
  const [repeat, setRepeat] = useState(1);
  return (
    <div style={st.cpWrap}>
      <div style={st.cpSection}>
        <div style={st.cpLabel}>🔊 Volume</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="range" min="0" max="7" value={volume} onChange={e => setVolume(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontSize: 13, width: 16 }}>{volume}</span>
        </div>
      </div>
      <div style={st.cpSection}>
        <div style={st.cpLabel}>🖱️ Mouse Speed</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10 }}>Slow</span>
          <input type="range" min="1" max="5" value={speed} onChange={e => setSpeed(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontSize: 10 }}>Fast</span>
        </div>
      </div>
      <div style={st.cpSection}>
        <div style={st.cpLabel}>🖥️ Desktop Pattern</div>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          {["░░░░", "▒▒▒▒", "▓▓▓▓", "████"].map((p, i) => (
            <div key={i} onClick={() => setPattern(i)} style={{ ...st.cpPat, ...(pattern === i ? { border: "3px solid #000" } : {}) }}>{p}</div>
          ))}
        </div>
      </div>
      <div style={st.cpSection}>
        <div style={st.cpLabel}>⌨️ Key Repeat Rate</div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          {["Slow", "Medium", "Fast"].map((r, i) => (
            <div key={r} onClick={() => setRepeat(i)} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #000", background: repeat === i ? "#000" : "#fff" }} />
              <span style={{ fontSize: 11 }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ KEY CAPS ═══ */
function KeyCapsApp() {
  const [pressed, setPressed] = useState(null);
  const rows = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
    ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
  ];
  return (
    <div style={st.kcWrap}>
      <div style={st.kcDisplay}>{pressed || "\u00A0"}</div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: 2, justifyContent: "center", marginLeft: ri * 10 }}>
          {row.map(k => (
            <div key={k} onMouseDown={() => setPressed(k)} onMouseUp={() => setPressed(null)} onMouseLeave={() => setPressed(null)}
              style={{ ...st.kcKey, ...(pressed === k ? { background: "#000", color: "#fff" } : {}) }}>{k}</div>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
        <div style={{ ...st.kcKey, width: 180 }} onMouseDown={() => setPressed("⎵")} onMouseUp={() => setPressed(null)}>{"\u00A0"}</div>
      </div>
    </div>
  );
}

/* ═══ TEXT VIEWER ═══ */
function TextViewer({ text }) {
  return <div style={{ padding: 12, fontFamily: "'VT323', monospace", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text}</div>;
}

/* ═══ WINDOW ═══ */
function MacWindow({ win, isActive, onFocus, onClose, onDrag, onResize, onItemOpen }) {
  const handleTitleDrag = useCallback(e => {
    e.preventDefault(); onFocus(win.id);
    const sx = e.clientX - win.x, sy = e.clientY - win.y;
    const move = ev => onDrag(win.id, ev.clientX - sx, ev.clientY - sy);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }, [win.id, win.x, win.y, onFocus, onDrag]);

  const handleResize = useCallback(e => {
    e.preventDefault(); e.stopPropagation(); onFocus(win.id);
    const sx = e.clientX, sy = e.clientY, sw = win.w, sh = win.h;
    const move = ev => onResize(win.id, Math.max(180, sw + ev.clientX - sx), Math.max(100, sh + ev.clientY - sy));
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }, [win.id, win.w, win.h, onFocus, onResize]);

  const hasItems = win.items && !win.appContent;
  const isApp = !!win.appContent;
  const count = hasItems ? win.items.length : 0;

  return (
    <div style={{ ...st.window, left: win.x, top: win.y, width: win.w, height: win.h, zIndex: isActive ? 100 : win.z || 1 }}
      onMouseDown={() => onFocus(win.id)}>
      {/* Title */}
      <div onMouseDown={win.isDialog ? undefined : handleTitleDrag} style={st.titleBar}>
        {!win.isDialog && <div onClick={e => { e.stopPropagation(); onClose(win.id); }} style={st.closeBox} />}
        <div style={st.titleStripes}>{isActive && !win.isDialog && <svg width="100%" height="100%" style={{ display: "block" }}><rect width="100%" height="100%" fill="url(#tp)" /></svg>}</div>
        <span style={st.titleText}>{win.title}</span>
        <div style={st.titleStripes}>{isActive && !win.isDialog && <svg width="100%" height="100%" style={{ display: "block" }}><rect width="100%" height="100%" fill="url(#tp)" /></svg>}</div>
      </div>
      {/* Info bar */}
      {hasItems && <div style={st.infoBar}><span>{count} items</span><span>{count * 24}K in disk</span><span>{512 - count * 24}K available</span></div>}
      {/* Content */}
      <div style={{ ...st.content, ...(isApp || win.isDialog ? { marginRight: 0, marginBottom: 0 } : {}) }}>
        {win.isDialog ? (
          <div style={st.dialogContent}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🖥️</div>
            <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 13 }}>About This Macintosh</div>
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>System Software 1.0<br />Macintosh 128K<br />Built-in Memory: 128K<br /><br />© Apple Computer, Inc. 1984</div>
            <div style={st.okBtn} onClick={() => onClose(win.id)}>OK</div>
          </div>
        ) : isApp ? win.appContent : hasItems ? (
          <div style={st.iconGrid}>
            {win.items.map((item, i) => (
              <div key={i} style={st.gridItem} onDoubleClick={() => onItemOpen && onItemOpen(item)}>
                <div style={{ fontSize: 28 }}>{item.emoji}</div>
                <div style={st.gridLabel}>{item.name}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {/* Scrollbars for file windows */}
      {!win.isDialog && !isApp && <>
        <div style={st.scrollV}>
          <div style={st.scrollArr}>▲</div>
          <div style={st.scrollTrk}><svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#sp)" /></svg></div>
          <div style={st.scrollArr}>▼</div>
        </div>
        <div style={st.scrollH}>
          <div style={{ ...st.scrollArr, width: 16, height: "100%" }}>◀</div>
          <div style={{ ...st.scrollTrk, flex: 1, height: "100%" }}><svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#sp)" /></svg></div>
          <div style={{ ...st.scrollArr, width: 16, height: "100%" }}>▶</div>
        </div>
        <div onMouseDown={handleResize} style={st.resizeHandle} />
      </>}
    </div>
  );
}

/* ═══ MENUBAR ═══ */
function MenuBar({ activeMenu, setActiveMenu, onMenuAction }) {
  return (
    <div style={st.menuBar}>
      {Object.keys(MENU_ITEMS).map(menu => (
        <div key={menu} style={{ position: "relative" }}>
          <div onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
            style={{ ...st.menuItem, ...(activeMenu === menu ? st.menuItemActive : {}), ...(menu === "🍎" ? { fontSize: 14 } : {}) }}>{menu}</div>
          {activeMenu === menu && (
            <div style={st.dropdown}>
              {MENU_ITEMS[menu].map((item, i) =>
                item === "---" ? <div key={i} style={st.menuSep} /> : (
                  <div key={i} style={st.ddItem}
                    onMouseEnter={e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
                    onClick={() => { onMenuAction(item); setActiveMenu(null); }}
                  >{item}</div>
                )
              )}
            </div>
          )}
        </div>
      ))}
      <div style={{ flex: 1 }} />
    </div>
  );
}

/* ═══ MAIN APP ═══ */
export default function Mac1() {
  const [wins, setWins] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selIcon, setSelIcon] = useState(null);
  const [zCtr, setZCtr] = useState(10);
  const [booted, setBooted] = useState(false);
  const [bootStage, setBootStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setBootStage(1), 500);
    const t2 = setTimeout(() => setBootStage(2), 1600);
    const t3 = setTimeout(() => {
      setBooted(true);
      setWins([{ id: "w-init", title: "Macintosh HD", x: 80, y: 40, w: 440, h: 300, z: 1, items: HD_ITEMS }]);
    }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const openWin = useCallback((cfg) => {
    setWins(prev => {
      const ex = prev.find(w => w.title === cfg.title);
      if (ex) {
        setZCtr(c => { const n = c + 1; setWins(ws => ws.map(w => w.id === ex.id ? { ...w, z: n } : w)); return n; });
        return prev;
      }
      const id = "w-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      setZCtr(c => c + 1);
      return [...prev, { ...cfg, id, z: zCtr + 1 }];
    });
  }, [zCtr]);

  const openApp = useCallback((appId) => {
    const cfgs = {
      calculator: { title: "Calculator", x: 260, y: 80, w: 220, h: 310, appContent: <CalculatorApp /> },
      notepad: { title: "Note Pad", x: 160, y: 60, w: 320, h: 340, appContent: <NotePadApp /> },
      puzzle: { title: "Puzzle", x: 220, y: 70, w: 260, h: 340, appContent: <PuzzleApp /> },
      alarm: { title: "Alarm Clock", x: 200, y: 90, w: 300, h: 200, appContent: <AlarmClockApp /> },
      paint: { title: "MacPaint", x: 60, y: 40, w: 440, h: 370, appContent: <MacPaintApp /> },
      control: { title: "Control Panel", x: 140, y: 80, w: 340, h: 310, appContent: <ControlPanelApp /> },
      keycaps: { title: "Key Caps", x: 120, y: 100, w: 380, h: 230, appContent: <KeyCapsApp /> },
      readme: { title: "ReadMe", x: 160, y: 60, w: 300, h: 340, appContent: <TextViewer text={TEXT_FILES.readme} /> },
      letter: { title: "Letter.txt", x: 180, y: 70, w: 300, h: 320, appContent: <TextViewer text={TEXT_FILES.letter} /> },
      notes: { title: "Notes", x: 200, y: 80, w: 280, h: 300, appContent: <TextViewer text={TEXT_FILES.notes} /> },
      resume: { title: "Resume.txt", x: 170, y: 65, w: 300, h: 340, appContent: <TextViewer text={TEXT_FILES.resume} /> },
    };
    if (cfgs[appId]) openWin(cfgs[appId]);
  }, [openWin]);

  const handleItemOpen = useCallback((item) => {
    if (item.appId) { openApp(item.appId); return; }
    if (item.folderId) {
      const f = { apps: { title: "Applications", items: APP_ITEMS }, docs: { title: "Documents", items: DOC_ITEMS }, games: { title: "Games", items: GAME_ITEMS } };
      if (f[item.folderId]) openWin({ ...f[item.folderId], x: 140 + Math.random() * 80, y: 50 + Math.random() * 60, w: 400, h: 280 });
    }
  }, [openApp, openWin]);

  const focus = useCallback((id) => setZCtr(c => { const n = c + 1; setWins(ws => ws.map(w => w.id === id ? { ...w, z: n } : w)); return n; }), []);
  const close = useCallback((id) => setWins(ws => ws.filter(w => w.id !== id)), []);
  const drag = useCallback((id, x, y) => setWins(ws => ws.map(w => w.id === id ? { ...w, x, y } : w)), []);
  const resize = useCallback((id, w, h) => setWins(ws => ws.map(win => win.id === id ? { ...win, w, h } : win)), []);

  const handleMenu = useCallback((item) => {
    if (item === "About This Macintosh...") openWin({ title: "About This Macintosh", x: 180, y: 100, w: 300, h: 220, isDialog: true });
    const map = { Calculator: "calculator", "Note Pad": "notepad", Puzzle: "puzzle", "Alarm Clock": "alarm", "Control Panel": "control", "Key Caps": "keycaps", Scrapbook: "notepad" };
    if (map[item]) openApp(map[item]);
    if (item === "Shut Down") {
      setBooted(false); setBootStage(0); setWins([]);
      setTimeout(() => setBootStage(1), 500);
      setTimeout(() => setBootStage(2), 1600);
      setTimeout(() => { setBooted(true); setWins([{ id: "w-r" + Date.now(), title: "Macintosh HD", x: 80, y: 40, w: 440, h: 300, z: 1, items: HD_ITEMS }]); }, 2600);
    }
  }, [openApp, openWin]);

  const handleIconDbl = useCallback((iconId) => {
    const folders = {
      hd: { title: "Macintosh HD", items: HD_ITEMS },
      apps: { title: "Applications", items: APP_ITEMS },
      docs: { title: "Documents", items: DOC_ITEMS },
      system: { title: "System Folder", items: [{ name: "System", emoji: "⚙️" }, { name: "Finder", emoji: "🖥️" }, { name: "Fonts", emoji: "🔤" }, { name: "DA Handler", emoji: "📎" }] },
      trash: { title: "Trash", items: [] },
    };
    const f = folders[iconId];
    if (f) openWin({ ...f, x: 80 + Math.random() * 60, y: 40 + Math.random() * 40, w: iconId === "trash" ? 300 : 440, h: iconId === "trash" ? 200 : 300 });
  }, [openWin]);

  const activeId = wins.reduce((b, w) => (!b || (w.z || 0) > (b.z || 0) ? w : b), null)?.id;

  if (!booted) {
    return (
      <div style={st.boot}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
          @keyframes bootFill { from { width: 0 } to { width: 100% } }
        `}</style>
        {bootStage >= 1 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🖥️</div>
            <div style={{ fontSize: 18, fontFamily: "'VT323', monospace", marginBottom: 20 }}>Welcome to Macintosh.</div>
            {bootStage >= 2 && (
              <div style={{ width: 200, height: 16, border: "2px solid #000", background: "#fff", margin: "0 auto", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#000", animation: "bootFill 1s linear forwards" }} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={st.screen} onClick={() => { setSelIcon(null); setActiveMenu(null); }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; background: #000; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #fff; border: 2px solid #000; cursor: pointer; }
        textarea:focus { outline: none; }
      `}</style>
      <PatternDefs />
      <MenuBar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onMenuAction={handleMenu} />
      <div style={st.desktop}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}><rect width="100%" height="100%" fill="url(#dp)" /></svg>
        <div style={st.iconCol}>
          {DESKTOP_ICONS.map(icon => (
            <div key={icon.id} style={st.deskIcon}
              onClick={e => { e.stopPropagation(); setSelIcon(icon.id); setActiveMenu(null); }}
              onDoubleClick={() => handleIconDbl(icon.id)}>
              <div style={{ ...st.iconEmoji, ...(selIcon === icon.id ? st.iconSel : {}) }}>{icon.emoji}</div>
              <div style={{ ...st.iconLabel, ...(selIcon === icon.id ? st.iconLabelSel : {}) }}>{icon.label}</div>
            </div>
          ))}
        </div>
        {wins.map(w => (
          <MacWindow key={w.id} win={w} isActive={w.id === activeId}
            onFocus={focus} onClose={close} onDrag={drag} onResize={resize} onItemOpen={handleItemOpen} />
        ))}
      </div>
    </div>
  );
}

/* ═══ STYLES ═══ */
const st = {
  screen: { width: "100vw", height: "100vh", background: "#c0c0c0", fontFamily: "'VT323', monospace", fontSize: 12, color: "#000", overflow: "hidden", cursor: "default", userSelect: "none", display: "flex", flexDirection: "column" },
  boot: { width: "100vw", height: "100vh", background: "#c0c0c0", display: "flex", alignItems: "center", justifyContent: "center" },
  menuBar: { height: 22, background: "#fff", borderBottom: "2px solid #000", display: "flex", alignItems: "stretch", paddingLeft: 4, zIndex: 9999, flexShrink: 0 },
  menuItem: { padding: "2px 12px", fontSize: 13, lineHeight: "18px", cursor: "default", fontFamily: "'VT323', monospace", fontWeight: "bold" },
  menuItemActive: { background: "#000", color: "#fff" },
  dropdown: { position: "absolute", top: "100%", left: 0, background: "#fff", border: "2px solid #000", minWidth: 200, zIndex: 10000, boxShadow: "3px 3px 0 rgba(0,0,0,0.3)" },
  ddItem: { padding: "3px 20px", fontSize: 13, fontFamily: "'VT323', monospace", cursor: "default", whiteSpace: "nowrap" },
  menuSep: { height: 1, background: "#999", margin: "2px 8px" },
  desktop: { flex: 1, position: "relative", overflow: "hidden" },
  iconCol: { position: "absolute", right: 16, top: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 1, alignItems: "center" },
  deskIcon: { display: "flex", flexDirection: "column", alignItems: "center", cursor: "default", width: 72 },
  iconEmoji: { fontSize: 32, lineHeight: 1, padding: 2 },
  iconSel: { background: "#000", borderRadius: 4, filter: "invert(1)" },
  iconLabel: { fontSize: 11, fontFamily: "'VT323', monospace", textAlign: "center", marginTop: 2, padding: "1px 4px", lineHeight: 1.2, maxWidth: 72 },
  iconLabelSel: { background: "#000", color: "#fff" },

  window: { position: "absolute", background: "#fff", border: "2px solid #000", display: "flex", flexDirection: "column", borderRadius: 3, overflow: "hidden", boxShadow: "2px 2px 0 rgba(0,0,0,0.2)" },
  titleBar: { height: 20, background: "#fff", borderBottom: "2px solid #000", display: "flex", alignItems: "center", padding: "0 4px", gap: 4, cursor: "grab", flexShrink: 0 },
  closeBox: { width: 12, height: 12, border: "2px solid #000", flexShrink: 0, cursor: "pointer", background: "#fff" },
  titleStripes: { flex: 1, height: 14, overflow: "hidden" },
  titleText: { fontSize: 13, fontWeight: "bold", fontFamily: "'VT323', monospace", whiteSpace: "nowrap", padding: "0 6px", background: "#fff", flexShrink: 0 },
  infoBar: { height: 18, borderBottom: "1px solid #000", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px", fontSize: 11, background: "#fff", flexShrink: 0 },
  content: { flex: 1, overflow: "auto", background: "#fff", marginRight: 16, marginBottom: 16 },
  iconGrid: { display: "flex", flexWrap: "wrap", padding: 10, gap: 6, alignContent: "flex-start" },
  gridItem: { width: 72, display: "flex", flexDirection: "column", alignItems: "center", padding: 4, cursor: "default" },
  gridLabel: { fontSize: 10, fontFamily: "'VT323', monospace", textAlign: "center", marginTop: 2, wordBreak: "break-word", lineHeight: 1.2 },
  dialogContent: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 20, textAlign: "center" },
  okBtn: { marginTop: 14, padding: "4px 28px", border: "2px solid #000", borderRadius: 6, fontSize: 14, fontWeight: "bold", cursor: "pointer", background: "#fff", boxShadow: "2px 2px 0 #000, inset 0 0 0 1px #000" },

  scrollV: { position: "absolute", right: 0, top: 20, bottom: 16, width: 16, borderLeft: "2px solid #000", background: "#fff", display: "flex", flexDirection: "column" },
  scrollH: { position: "absolute", bottom: 0, left: 0, right: 16, height: 16, borderTop: "2px solid #000", background: "#fff", display: "flex", alignItems: "center" },
  scrollArr: { width: "100%", height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, borderBottom: "1px solid #000", cursor: "pointer", background: "#fff", flexShrink: 0 },
  scrollTrk: { flex: 1, overflow: "hidden" },
  resizeHandle: { position: "absolute", bottom: 0, right: 0, width: 16, height: 16, cursor: "nwse-resize", borderLeft: "2px solid #000", borderTop: "2px solid #000", background: "#fff" },

  // Apps
  calcWrap: { padding: 8, display: "flex", flexDirection: "column", gap: 6, height: "100%" },
  calcDisplay: { background: "#fff", border: "2px inset #888", padding: "6px 10px", textAlign: "right", fontSize: 22, fontFamily: "'VT323', monospace", minHeight: 36, lineHeight: "28px" },
  calcGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, flex: 1 },
  calcBtn: { border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontFamily: "'VT323', monospace", cursor: "pointer", background: "#fff", borderRadius: 2, minHeight: 32 },

  noteWrap: { display: "flex", flexDirection: "column", height: "100%" },
  noteBar: { display: "flex", justifyContent: "center", gap: 12, padding: 6, borderBottom: "1px solid #000", alignItems: "center" },
  noteNav: { cursor: "pointer", fontSize: 14, padding: "0 6px" },
  noteArea: { flex: 1, border: "none", resize: "none", padding: 12, fontFamily: "'VT323', monospace", fontSize: 14, lineHeight: 1.5, background: "#fff" },

  puzzleWrap: { display: "flex", flexDirection: "column", alignItems: "center", padding: 10, gap: 8, height: "100%" },
  puzzleInfo: { fontSize: 13, fontFamily: "'VT323', monospace" },
  puzzleGrid: { display: "grid", gridTemplateColumns: "repeat(4, 52px)", gridTemplateRows: "repeat(4, 52px)", gap: 2 },
  puzzleTile: { border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: "bold", background: "#fff" },
  puzzleEmpty: { border: "2px solid #ccc", background: "#ddd" },
  puzzleReset: { marginTop: 8, padding: "4px 16px", border: "2px solid #000", borderRadius: 4, cursor: "pointer", fontSize: 13, background: "#fff" },

  alarmWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, padding: 16 },
  alarmDisplay: { display: "flex", alignItems: "baseline", gap: 6 },
  alarmTime: { fontSize: 48, fontFamily: "'VT323', monospace", letterSpacing: 2 },
  alarmAmpm: { fontSize: 20, fontFamily: "'VT323', monospace" },
  alarmDate: { fontSize: 14, fontFamily: "'VT323', monospace" },

  paintWrap: { display: "flex", flexDirection: "column", height: "100%" },
  paintToolbar: { display: "flex", gap: 3, padding: 4, borderBottom: "2px solid #000", alignItems: "center", flexWrap: "wrap" },
  paintTool: { width: 28, height: 28, border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, background: "#fff" },
  paintSep: { width: 1, height: 24, background: "#000", margin: "0 2px" },
  paintCanvas: { flex: 1, cursor: "crosshair", display: "block", imageRendering: "pixelated" },

  cpWrap: { padding: 14, display: "flex", flexDirection: "column", gap: 14, fontFamily: "'VT323', monospace" },
  cpSection: { borderBottom: "1px solid #ccc", paddingBottom: 10 },
  cpLabel: { fontSize: 13, fontWeight: "bold", marginBottom: 6 },
  cpPat: { padding: "4px 8px", border: "2px solid #888", cursor: "pointer", fontSize: 12, background: "#fff", fontFamily: "monospace" },

  kcWrap: { padding: 8, display: "flex", flexDirection: "column", gap: 4, alignItems: "center", height: "100%" },
  kcDisplay: { width: "100%", textAlign: "center", fontSize: 24, fontFamily: "'VT323', monospace", border: "2px inset #888", padding: 4, marginBottom: 4, background: "#fff", minHeight: 32 },
  kcKey: { width: 24, height: 24, border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'VT323', monospace", cursor: "pointer", background: "#fff" },
};
