import React, { useState } from 'react';
import './scheduler2.css';

// ---- Types ----
interface Stylist { id: string; name: string; color: string }
interface AppointmentType { id: string; label: string; defaultMinutes: number }
interface Booking {
  id: number;
  stylistId: string;
  typeId: string;
  title: string;
  description?: string; // added
  date: string;   // YYYY-MM-DD
  start: string;  // HH:MM
  end: string;    // HH:MM
}

// ---- Static Data ----
const stylists: Stylist[] = [
  { id: 'sarah', name: 'Sarah', color: '#ec4899' },
  { id: 'mike', name: 'Mike', color: '#6366f1' },
  { id: 'lena', name: 'Lena', color: '#10b981' }
];

const apptTypes: AppointmentType[] = [
  { id: 'cut', label: 'Haircut', defaultMinutes: 45 },
  { id: 'color', label: 'Color', defaultMinutes: 90 },
  { id: 'style', label: 'Style', defaultMinutes: 30 },
  { id: 'treat', label: 'Treatment', defaultMinutes: 60 }
];

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18; // exclusive
const SLOT_MINUTES = 30;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60; // 600
const SLOT_COUNT = TOTAL_MINUTES / SLOT_MINUTES; // 20
const SLOTS: number[] = Array.from({length: SLOT_COUNT}, (_,i)=> i); // index slots

let nextId = 1000;

const todayISO = toISO(new Date());
const initial: Booking[] = [
  { id: 1, stylistId: 'sarah', typeId: 'cut',   title: 'Haircut - Sarah', description: '', date: todayISO, start: '09:00', end: '09:45' },
  { id: 2, stylistId: 'mike',  typeId: 'color', title: 'Color - Mike',    description: '', date: todayISO, start: '10:00', end: '11:30' },
  { id: 3, stylistId: 'lena',  typeId: 'style', title: 'Style - Lena',    description: '', date: todayISO, start: '13:00', end: '13:30' }
];

// ---- Helpers (pure) ----
function toISO(d: Date): string { return d.toISOString().slice(0,10); }
function pad(n: number) { return String(n).padStart(2,'0'); }
function toTime(h: number, m: number) { return `${pad(h)}:${pad(m)}`; }
function addMinutes(time: string, mins: number) { const [h, mm] = time.split(':').map(Number); const d = new Date(); d.setHours(h, mm + mins, 0,0); return toTime(d.getHours(), d.getMinutes()); }
function startOfWeek(d: Date) { const day = d.getDay(); const diff = (day+6)%7; const nd = new Date(d); nd.setDate(d.getDate()-diff); return nd; } // Monday start
function daysOfWeek(d: Date) { const s = startOfWeek(d); return Array.from({length:7},(_,i)=>{ const nd=new Date(s); nd.setDate(s.getDate()+i); return nd; }); }
function monthMatrix(d: Date) { const first = new Date(d.getFullYear(), d.getMonth(),1); const start = startOfWeek(first); const matrix: Date[][]=[]; let cur = new Date(start); for(let r=0;r<6;r++){ const row: Date[]=[]; for(let c=0;c<7;c++){ row.push(new Date(cur)); cur.setDate(cur.getDate()+1); } matrix.push(row);} return matrix; }
const weekdayShort = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function timeToMinutes(t: string){ const [h,m]=t.split(':').map(Number); return h*60+m; }
function minutesToTime(min: number){ const h = Math.floor(min/60); const m = min%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }

function assignLanes(events: Booking[]) {
  const sorted = [...events].sort((a,b)=> timeToMinutes(a.start)-timeToMinutes(b.start));
  const lanes: Booking[][] = [];
  const laneMap: Record<number, number> = {};
  sorted.forEach(ev=>{
    for(let i=0;i<=lanes.length;i++){
      if(!lanes[i]) { lanes[i]=[ev]; laneMap[ev.id]=i; break; }
      const conflict = lanes[i].some(other => !(timeToMinutes(ev.start) >= timeToMinutes(other.end) || timeToMinutes(ev.end) <= timeToMinutes(other.start)));
      if(!conflict){ lanes[i].push(ev); laneMap[ev.id]=i; break; }
    }
  });
  return { laneMap, laneCount: lanes.length };
}

// ---- Component ----
interface EditState { mode: 'create' | 'edit'; open: boolean; booking: Partial<Booking>; originHour?: number; }

type ViewMode = 'day' | 'week' | 'month';

export default function Scheduler2Page() {
  const [bookings, setBookings] = useState<Booking[]>(initial);
  const [filterStylist, setFilterStylist] = useState<'all' | string>('all');
  const [view, setView] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [edit, setEdit] = useState<EditState>({ open:false, mode:'create', booking:{} });

  const currentISO = toISO(currentDate);

  const filteredBookings = bookings.filter(b => (filterStylist==='all' || b.stylistId===filterStylist));

  const visibleBookings = filteredBookings.filter(b => {
    if (view==='day') return b.date === currentISO;
    if (view==='week') {
      const weekDates = daysOfWeek(currentDate).map(toISO);
      return weekDates.includes(b.date);
    }
    if (view==='month') return b.date.slice(0,7) === currentISO.slice(0,7);
    return true;
  });

  // ---- Navigation ----
  function goToday() { setCurrentDate(new Date()); }
  function goPrev() { setCurrentDate(d => {
    const nd = new Date(d);
    if (view==='day') nd.setDate(nd.getDate()-1);
    else if (view==='week') nd.setDate(nd.getDate()-7);
    else nd.setMonth(nd.getMonth()-1);
    return nd;
  }); }
  function goNext() { setCurrentDate(d => {
    const nd = new Date(d);
    if (view==='day') nd.setDate(nd.getDate()+1);
    else if (view==='week') nd.setDate(nd.getDate()+7);
    else nd.setMonth(nd.getMonth()+1);
    return nd;
  }); }

  // ---- CRUD Modal ----
  function openCreate(startMinutes: number, date: string, stylistId?: string) {
    // Clamp to scheduler bounds
    if(startMinutes < DAY_START_HOUR*60) startMinutes = DAY_START_HOUR*60;
    if(startMinutes >= DAY_END_HOUR*60) startMinutes = (DAY_END_HOUR-1)*60;
    const sty = stylistId || (filterStylist !== 'all' ? filterStylist : stylists[0].id);
    const type = apptTypes[0];
    const start = minutesToTime(startMinutes - (startMinutes%SLOT_MINUTES)); // snap to slot
    const end = addMinutes(start, type.defaultMinutes);
    setEdit({ open:true, mode:'create', originHour: Math.floor(startMinutes/60), booking: { stylistId: sty, typeId: type.id, date, start, end, title: `${type.label} - ${getStylistName(sty)}`, description: '' } });
  }
  function openEdit(b: Booking) { setEdit({ open:true, mode:'edit', booking:{ ...b } }); }
  function closeModal() { setEdit({ open:false, mode:'create', booking:{} }); }

  function handleChange<K extends keyof Booking>(key: K, value: Booking[K]) { setEdit(e => ({ ...e, booking: { ...e.booking, [key]: value } })); }
  function handleTypeChange(typeId: string) {
    const type = apptTypes.find(t=>t.id===typeId)!;
    let { start, date } = edit.booking; // mutable fields
    const stylistId = edit.booking.stylistId; // separate const for stylistId
    if(!date) date = currentISO;
    if(!start) start = toTime(edit.originHour||8,0);
    const end = addMinutes(start, type.defaultMinutes);
    setEdit(e => ({ ...e, booking: { ...e.booking, typeId, date, start, end, title: `${type.label} - ${getStylistName(stylistId as string)}` }}));
  }
  function saveBooking() {
    const b = edit.booking; if(!b.stylistId || !b.typeId || !b.date || !b.start || !b.end) return;
    if (edit.mode==='create') {
      const type = apptTypes.find(t=>t.id===b.typeId)!;
      const newBooking: Booking = { id: nextId++, stylistId:b.stylistId, typeId:b.typeId, date:b.date, start:b.start, end:b.end, title: b.title || `${type.label} - ${getStylistName(b.stylistId)}`, description: b.description || '' };
      setBookings(prev => [...prev, newBooking]);
    } else if (edit.mode==='edit' && b.id!=null) {
      setBookings(prev => prev.map(p=> p.id===b.id ? { ...(p), ...(b as Booking) } : p));
    }
    closeModal();
  }
  function deleteBooking() { if (edit.mode==='edit' && edit.booking.id!=null) { setBookings(prev=>prev.filter(b=>b.id!==edit.booking.id)); closeModal(); } }

  function getStylistName(id: string | undefined) { return stylists.find(s=>s.id===id)?.name || ''; }

  // ---- Renderers ----
  function renderDayView(date: Date) {
    const iso = toISO(date);
    const dayBookings = visibleBookings.filter(b=>b.date===iso);
    const stylistsToRender = stylists.filter(s=>filterStylist==='all' || s.id===filterStylist);

    return (
      <div className="sf-day-wrapper">
        <div className="sf-day-time-col">
          {SLOTS.map(slotIdx=>{
            const minutesFromStart = slotIdx * SLOT_MINUTES;
            const absoluteMin = DAY_START_HOUR*60 + minutesFromStart;
            const label = minutesFromStart % 60 === 0 ? minutesToTime(absoluteMin) : '';
            return <div key={slotIdx} className="sf-slot sf-time-slot">{label}  </div>;
          })}
        </div>
        <div className="sf-day-cols">{/* new scroll container */}
          {stylistsToRender.map(sty=>{
            const events = dayBookings.filter(b=>b.stylistId===sty.id);
            const { laneMap, laneCount } = assignLanes(events);
            return (
              <div key={sty.id} className="sf-day-col">
                <div className="sf-col-header" style={{borderColor: sty.color}}>{sty.name}</div>
                <div className="sf-col-body" onDoubleClick={(e)=>{
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const y = e.clientY - rect.top; // px inside body
                  const slotPx = rect.height / SLOT_COUNT;
                  const clickedSlot = Math.floor(y / slotPx);
                  const absoluteMinutes = DAY_START_HOUR*60 + clickedSlot * SLOT_MINUTES;
                  openCreate(absoluteMinutes, iso, sty.id); // half-hour precision
                }}>
                  {SLOTS.map(i=> <div key={i} className="sf-slot" />)}
                  {events.map(ev=>{
                    const startM = timeToMinutes(ev.start);
                    const endM = timeToMinutes(ev.end);
                    const topPct = ((startM - DAY_START_HOUR*60)/TOTAL_MINUTES)*100;
                    const heightPct = ((endM - startM)/TOTAL_MINUTES)*100;
                    const lane = laneMap[ev.id];
                    const widthPct = 100 / laneCount;
                    const leftPct = lane * widthPct;
                    return (
                      <div
                        key={ev.id}
                        className="sf-event"
                        style={{ top: `${topPct}%`, height: `${heightPct}%`, left: `${leftPct}%`, width: `${widthPct}%`, background: sty.color }}
                        onClick={()=>openEdit(ev)}
                        title={`${ev.title} ${ev.start}-${ev.end}`}
                      >
                        <div className="sf-event-title">{ev.title} </div>
                        <div className="sf-event-time">{ev.start} - {ev.end}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderWeekView(date: Date) {
    const week = daysOfWeek(date);
    const weekDatesISO = week.map(toISO);
    const stylistsToRender = stylists.filter(s=>filterStylist==='all' || s.id===filterStylist);
    return (
      <div className="sf-week-wrapper">
        <div className="sf-week-head-row">
          <div className="sf-week-time-head" />
          {week.map(d=> <div key={d.toISOString()} className="sf-week-day-head">{weekdayShort[(d.getDay()+6)%7]} {d.getDate()}</div>)}
        </div>
        <div className="sf-week-body">
          <div className="sf-week-time-col">
            {SLOTS.map(i=>{
              const minutes = DAY_START_HOUR*60 + i*SLOT_MINUTES;
              const label = (minutes % 60 === 0) ? minutesToTime(minutes) : '';
              return <div key={i} className="sf-slot sf-time-slot">{label}</div>;
            })}
          </div>
          <div className="sf-week-cols">{/* new scroll container */}
            {weekDatesISO.map(iso => {
              const dayEvents = visibleBookings.filter(b=>b.date===iso && (filterStylist==='all' || stylistsToRender.some(s=>s.id===b.stylistId)));
              const { laneMap, laneCount } = assignLanes(dayEvents);
              return (
                <div key={iso} className="sf-week-day-col" onDoubleClick={(e)=>{
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const slotPx = rect.height / SLOT_COUNT;
                  const clickedSlot = Math.floor(y / slotPx);
                  const absMinutes = DAY_START_HOUR*60 + clickedSlot*SLOT_MINUTES;
                  openCreate(absMinutes, iso);
                }}>
                  {SLOTS.map(i=> <div key={i} className="sf-slot" />)}
                  {dayEvents.map(ev=>{
                    const startM = timeToMinutes(ev.start); const endM = timeToMinutes(ev.end);
                    const topPct = ((startM - DAY_START_HOUR*60)/TOTAL_MINUTES)*100;
                    const heightPct = ((endM - startM)/TOTAL_MINUTES)*100;
                    const lane = laneMap[ev.id];
                    const widthPct = 100 / laneCount;
                    const leftPct = lane * widthPct;
                    const sty = stylists.find(s=>s.id===ev.stylistId)!;
                    return (
                      <div key={ev.id} className="sf-event" style={{ top:`${topPct}%`, height:`${heightPct}%`, left:`${leftPct}%`, width:`${widthPct}%`, background: sty.color }} onClick={()=>openEdit(ev)}>
                        <div className="sf-event-title">{ev.title}</div>
                        <div className="sf-event-time">{ev.start}-{ev.end}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderMonthView(date: Date) {
    const matrix = monthMatrix(date);
    return (
      <div className="sf-month-wrapper">
        <div className="sf-month-weekdays">
          {weekdayShort.map(d => <div key={d} className="sf-month-weekday-head">{d}</div>)}
        </div>
        <div className="sf-month-grid">
          {matrix.map((row,i) => row.map(day => {
            const iso = toISO(day);
            const inMonth = day.getMonth()===date.getMonth();
            const dayBookings = visibleBookings.filter(b => b.date===iso).slice(0,4);
            return (
              <div key={iso+ i} className={`sf-month-cell ${inMonth? '':'faded'}`} onDoubleClick={()=>openCreate(9*60, iso)}>
                <div className="sf-month-cell-date">{day.getDate()}</div>
                <div className="sf-month-cell-events">
                  {dayBookings.map(b => (
                    <div key={b.id} className="sf-month-event" style={{ background: stylists.find(st=>st.id===b.stylistId)?.color }} onClick={(e)=>{ e.stopPropagation(); openEdit(b); }} title={`${b.title} ${b.start}-${b.end}`}>
                      {b.start} {b.title.split(' - ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    );
  }

  // ---- Main Render ----
  return (
    <div className="scheduler2-wrapper">
      <div className="scheduler2-bar">
        <div className="nav-controls">
          <button onClick={goPrev}>◀</button>
          <button onClick={goToday}>Today</button>
          <button onClick={goNext}>▶</button>
        </div>
        <h2 className="current-range">
          {view==='day' && currentISO}
          {view==='week' && `${toISO(startOfWeek(currentDate))} – ${toISO(daysOfWeek(currentDate)[6])}`}
          {view==='month' && `${currentDate.toLocaleString(undefined,{month:'long'})} ${currentDate.getFullYear()}`}
        </h2>
        <div className="view-switcher">
          <button onClick={()=>setView('day')} className={view==='day'? 'active':''}>Day</button>
          <button onClick={()=>setView('week')} className={view==='week'? 'active':''}>Week</button>
            <button onClick={()=>setView('month')} className={view==='month'? 'active':''}>Month</button>
        </div>
        <div className="filters">
          <label>Stylist:</label>
          <select value={filterStylist} onChange={e=>setFilterStylist(e.target.value as 'all' | string)}>
            <option value="all">All</option>
            {stylists.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {view==='day' && renderDayView(currentDate)}
      {view==='week' && renderWeekView(currentDate)}
      {view==='month' && renderMonthView(currentDate)}

      {edit.open && (
        <div className="scheduler2-dialog-overlay" onMouseDown={closeModal}>
          <div className="sf-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
            <div className="sf-dlg-header">
              <h3 className="sf-dlg-title">{edit.mode==='create' ? 'Add Appointment' : 'Edit Appointment'}</h3>
              <button className="sf-dlg-close" onClick={closeModal} aria-label="Close">×</button>
            </div>
            <div className="sf-dlg-content">
              <form onSubmit={e=>{ e.preventDefault(); saveBooking(); }}>
                <div className="sf-row">
                  <div className="sf-field full">
                    <label>Title</label>
                    <input value={edit.booking.title || ''} onChange={e=>handleChange('title', e.target.value)} placeholder="Title" />
                  </div>
                </div>
                <div className="sf-row">
                  <div className="sf-field full">
                    <label>Description</label>
                    <textarea value={edit.booking.description || ''} onChange={e=>handleChange('description', e.target.value)} placeholder="Description / notes" rows={3} />
                  </div>
                </div>
                <div className="sf-row">
                  <div className="sf-field">
                    <label>Date</label>
                    <input type="date" value={edit.booking.date || currentISO} onChange={e=>handleChange('date', e.target.value)} />
                  </div>
                  <div className="sf-field">
                    <label>Start</label>
                    <input type="time" value={edit.booking.start || ''} onChange={e=>handleChange('start', e.target.value)} />
                  </div>
                  <div className="sf-field">
                    <label>End</label>
                    <input type="time" value={edit.booking.end || ''} onChange={e=>handleChange('end', e.target.value)} />
                  </div>
                </div>
                <div className="sf-row">
                  <div className="sf-field">
                    <label>Stylist</label>
                    <select value={edit.booking.stylistId || ''} onChange={e=>handleChange('stylistId', e.target.value)}>
                      {stylists.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="sf-field">
                    <label>Type</label>
                    <select value={edit.booking.typeId || ''} onChange={e=>handleTypeChange(e.target.value)}>
                      {apptTypes.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="sf-dlg-footer">
                  {edit.mode==='edit' && <button type="button" className="btn danger" onClick={deleteBooking}>Delete</button>}
                  <div className="spacer" />
                  <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
