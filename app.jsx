
import React, {useEffect, useState, useRef} from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const LS_WORKOUTS = "treinofit_workouts_v1";
const LS_LOGS = "treinofit_logs_v1";

const uid = (p="id")=>`${p}_${Math.random().toString(36).slice(2,9)}`;

function nowISO(){return new Date().toISOString();}

function mimeTypeFromName(name){
  const n = name.toLowerCase();
  if(n.endsWith(".pdf")) return "application/pdf";
  if(n.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if(n.endsWith(".doc")) return "application/msword";
  return "application/octet-stream";
}

export default function App(){
  const [workouts, setWorkouts] = useState(()=>{
    try{
      const raw = localStorage.getItem(LS_WORKOUTS);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    // starter
    return [
      { id: uid("w"), name: "Full Body - A", type: "musculacao", exercises: [{ id: uid("ex"), name: "Supino Reto", sets:3,reps:8,weight:60 }] }
    ];
  });
  const [logs, setLogs] = useState(()=>{ try{ const r=localStorage.getItem(LS_LOGS); if(r) return JSON.parse(r);}catch(e){} return []; });
  const [selected, setSelected] = useState(workouts[0]?.id || null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(()=> localStorage.setItem(LS_WORKOUTS, JSON.stringify(workouts)),[workouts]);
  useEffect(()=> localStorage.setItem(LS_LOGS, JSON.stringify(logs)),[logs]);

  function startTimer(s=60){
    setTimer(s);
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(()=>{
      setTimer(t=>{
        if(t<=1){ clearInterval(timerRef.current); timerRef.current=null; return 0;}
        return t-1;
      });
    },1000);
  }
  function stopTimer(){ if(timerRef.current) clearInterval(timerRef.current); timerRef.current=null; setTimer(0); }

  function addWorkout(payload){
    const w = { id: uid("w"), ...payload };
    setWorkouts(prev=>[w,...prev]);
    setSelected(w.id);
  }
  function logWorkout(id, details){
    const entry = { id: uid("log"), workoutId:id, date: nowISO(), details };
    setLogs(prev=>[entry,...prev]);
  }

  // Import file handler
  async function handleFileImport(e){
    const f = e.target.files[0];
    if(!f) return;
    const name = f.name;
    const type = mimeTypeFromName(name);
    // read as base64
    const arr = await f.arrayBuffer();
    const b64 = bufferToBase64(arr);
    const imported = {
      id: uid("imp"),
      name,
      type,
      b64,
      size: f.size,
      date: nowISO()
    };
    // save as a workout item with special flag imported:true
    const workout = { id: imported.id, name: imported.name, type: "importado", exercises: [], imported };
    setWorkouts(prev=>[workout,...prev]);
    alert("Arquivo importado e salvo nos seus treinos!");
    e.target.value = "";
  }

  function bufferToBase64(buf){
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    return btoa(binary);
  }

  function openImported(workout){
    if(!workout?.imported) return;
    const { b64, type, name } = workout.imported;
    const byteCharacters = atob(b64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function aggregated(){
    const map = {};
    logs.forEach(l=>{
      const d = new Date(l.date);
      const week = `${d.getFullYear()}-W${getWeekNumber(d)}`;
      if(!map[week]) map[week]=0;
      const val = (l.details?.exercises || []).reduce((acc,ex)=> acc + (ex.sets||0)*(ex.reps||0)*(ex.weight||0), 0);
      map[week]+=val;
    });
    return Object.keys(map).sort().map(k=>({week:k,volume:Math.round(map[k])}));
  }
  function getWeekNumber(d){
    const date = new Date(d.getTime());
    date.setHours(0,0,0,0);
    date.setDate(date.getDate() + 4 - (date.getDay()||7));
    const yearStart = new Date(date.getFullYear(),0,1);
    return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  }

  const sel = workouts.find(w=>w.id===selected);

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo">TF</div>
          <div>
            <div className="header-title">TreinoFit</div>
            <div className="small">Bora treinar 💪</div>
          </div>
        </div>
        <div className="controls">
          <label className="input-file btn-ghost">
            Importar treino 📁
            <input style={{display:"none"}} type="file" accept=".pdf,.doc,.docx" onChange={handleFileImport} />
          </label>
          <button className="btn" onClick={()=> {
            const name = prompt("Nome do treino","Treino Novo");
            if(!name) return;
            addWorkout({ name, type: "musculacao", exercises: [] });
          }}>Criar</button>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h3>Treinos salvos</h3>
          <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:8}}>
            {workouts.map(w=>(
              <div key={w.id} className="list-item" onClick={()=>setSelected(w.id)}>
                <div>
                  <div style={{fontWeight:700}}>{w.name} {w.imported && <span className="tag">importado</span>}</div>
                  <div className="small">{w.type === 'cardio' ? 'Cardio' : w.type==='importado' ? 'Arquivo importado' : 'Musculação'}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {w.imported && <button className="btn-ghost" onClick={(e)=>{e.stopPropagation(); openImported(w);}}>Abrir</button>}
                  <button className="btn-ghost" onClick={(e)=>{e.stopPropagation(); if(confirm('Remover treino?')) setWorkouts(prev=>prev.filter(x=>x.id!==w.id));}}>Remover</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          {!sel && <div>Selecione um treino</div>}
          {sel && (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:800,fontSize:18}}>{sel.name}</div>
                  <div className="small">{sel.type==='importado' ? 'Arquivo importado' : sel.type}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div className="small">Timer: {timer>0? `${Math.floor(timer/60)}:${String(timer%60).padStart(2,"0")}` : '—'}</div>
                  <button className="btn-ghost" onClick={()=>startTimer(60)}>Descanso 60s</button>
                  <button className="btn" onClick={()=>{
                    if(!sel) return;
                    logWorkout(sel.id, { note:"Sessão rápida", exercises: sel.exercises || [] });
                    alert("Treino registrado!");
                  }}>Registrar</button>
                </div>
              </div>

              <div style={{marginTop:12}}>
                <h4 className="small">Exercícios</h4>
                <div style={{marginTop:8}}>
                  {(sel.exercises && sel.exercises.length>0) ? sel.exercises.map((ex,idx)=>(
                    <div key={ex.id} className="list-item">
                      <div>
                        <div style={{fontWeight:700}}>{idx+1}. {ex.name}</div>
                        <div className="small">{ex.sets? `${ex.sets}x${ex.reps} @ ${ex.weight}kg` : ''}</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn-ghost" onClick={()=>{
                          const w = prompt("Nova carga (kg)", ex.weight || 0);
                          if(w!==null){
                            setWorkouts(prev=>prev.map(p=>p.id===sel.id?{...p, exercises: p.exercises.map(e=> e.id===ex.id?{...e, weight: Number(w)}:e)}:p));
                          }
                        }}>editar</button>
                        <button className="btn" onClick={()=>{
                          logWorkout(sel.id, { note: `Realizado: ${ex.name}`, exercises:[ex] });
                          alert("Exercício registrado!");
                        }}>Registrar</button>
                      </div>
                    </div>
                  )) : <div className="small">Sem exercícios (arquivo importado ou treino vazio)</div>}
                </div>
              </div>

              <div className="logs">
                <h4 className="small">Diário</h4>
                {logs.filter(l=>l.workoutId===sel.id).length===0 && <div className="small">Nenhum registro ainda.</div>}
                {logs.filter(l=>l.workoutId===sel.id).map(l=>(
                  <div key={l.id} className="list-item" style={{alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontWeight:700}}>{new Date(l.date).toLocaleString()}</div>
                      <div className="small">{l.details?.note}</div>
                    </div>
                    <div className="small">{(l.details?.exercises||[]).length} ex</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{marginTop:12}}>
            <h4 className="small">Evolução semanal</h4>
            <div style={{height:160,marginTop:8}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregated()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="volume" stroke="#b7ff3a" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">TreinoFit • Dados salvos localmente no seu navegador</footer>
    </div>
  );
}
