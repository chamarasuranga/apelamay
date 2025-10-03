import { useState, useRef } from 'react';
import {
  ScheduleComponent,
  Day, Week, WorkWeek, Month, Agenda, Inject,
  PopupOpenEventArgs, EventRenderedArgs, ActionEventArgs
} from '@syncfusion/ej2-react-schedule';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import './scheduler.css';

// Types
interface Stylist { id: string; name: string; color: string }
interface AppointmentType { id: string; text: string; durationMins: number }
interface Booking {
  Id: number;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  StylistId: string;
  AppointmentType: string;
  IsAllDay?: boolean;
}

const stylists: Stylist[] = [
  { id: 'sarah', name: 'Sarah', color: '#EC4899' },
  { id: 'mike', name: 'Mike', color: '#6366F1' },
  { id: 'lena', name: 'Lena', color: '#10B981' }
];

const apptTypes: AppointmentType[] = [
  { id: 'cut', text: 'Haircut', durationMins: 45 },
  { id: 'color', text: 'Color', durationMins: 90 },
  { id: 'style', text: 'Style', durationMins: 30 },
  { id: 'treat', text: 'Treatment', durationMins: 60 }
];

const initial: Booking[] = [
  {
    Id: 1,
    Subject: 'Haircut - Sarah',
    StartTime: new Date(new Date().setHours(9, 0, 0, 0)),
    EndTime: new Date(new Date().setHours(9, 45, 0, 0)),
    StylistId: 'sarah',
    AppointmentType: 'cut'
  },
  {
    Id: 2,
    Subject: 'Color - Mike',
    StartTime: new Date(new Date().setHours(10, 0, 0, 0)),
    EndTime: new Date(new Date().setHours(11, 30, 0, 0)),
    StylistId: 'mike',
    AppointmentType: 'color'
  },
  {
    Id: 3,
    Subject: 'Style - Lena',
    StartTime: new Date(new Date().setHours(13, 0, 0, 0)),
    EndTime: new Date(new Date().setHours(13, 30, 0, 0)),
    StylistId: 'lena',
    AppointmentType: 'style'
  }
];

export default function SalonSchedulerPage() {
  const [bookings, setBookings] = useState<Booking[]>(initial);
  const [filterStylist, setFilterStylist] = useState<string | 'all'>('all');
  const scheduleRef = useRef<ScheduleComponent | null>(null);
  const nextIdRef = useRef(100);

  const dataSource = filterStylist === 'all'
    ? bookings
    : bookings.filter(b => b.StylistId === filterStylist);

  const onEventRendered = (args: EventRenderedArgs) => {
    const data = args.data as Booking;
    const stylist = stylists.find(s => s.id === data.StylistId);
    if (stylist) {
      (args.element as HTMLElement).style.background = stylist.color;
      (args.element as HTMLElement).style.borderColor = stylist.color;
    }
  };

  const onPopupOpen = (args: PopupOpenEventArgs) => {
    if (args.type !== 'Editor' || !args.element) return;
    if (args.element.querySelector('.salon-extra-fields')) return;

    const extra = document.createElement('div');
    extra.className = 'salon-extra-fields e-row';
    extra.style.marginTop = '8px';
    extra.innerHTML = `
      <div class="e-control-wrapper">
        <label style="display:block;font-size:12px;margin-bottom:4px;">Stylist</label>
        <input id="stylistField" />
      </div>
      <div class="e-control-wrapper" style="margin-top:10px;">
        <label style="display:block;font-size:12px;margin-bottom:4px;">Appointment Type</label>
        <input id="typeField" />
      </div>
    `;
    const form = args.element.querySelector('.e-schedule-form');
    form?.appendChild(extra);

    const data = args.data as Partial<Booking>;
    const stylistVal = data.StylistId ?? (filterStylist !== 'all' ? filterStylist : stylists[0].id);
    const typeVal = data.AppointmentType ?? apptTypes[0].id;

    new DropDownListComponent({
      dataSource: stylists.map(s => ({ text: s.name, value: s.id })),
      value: stylistVal,
      change: ev => {
        (data as any).StylistId = ev.value as string;
        updateSubjectPreview(data);
      }
    }).appendTo('#stylistField');

    new DropDownListComponent({
      dataSource: apptTypes.map(t => ({ text: t.text, value: t.id })),
      value: typeVal,
      change: ev => {
        (data as any).AppointmentType = ev.value as string;
        const type = apptTypes.find(t => t.id === ev.value);
        if (type && data.StartTime && !data.Id) {
          const start = new Date(data.StartTime as any);
          data.EndTime = new Date(start.getTime() + type.durationMins * 60000);
        }
        updateSubjectPreview(data);
      }
    }).appendTo('#typeField');

    function updateSubjectPreview(d: Partial<Booking>) {
      if (d.StylistId && d.AppointmentType) {
        const sty = stylists.find(s => s.id === d.StylistId)?.name;
        const appt = apptTypes.find(a => a.id === d.AppointmentType)?.text;
        const subjInput = (args.element as HTMLElement).querySelector('[name="Subject"]') as HTMLInputElement;
        if (subjInput && !d.Id) subjInput.value = `${appt} - ${sty}`;
      }
    }
  };

  const onActionBegin = (args: ActionEventArgs) => {
    if (args.requestType === 'eventCreate' && args.addedRecords?.length) {
      const created = args.addedRecords as any as Booking[];
      const mapped = created.map(ev => ({
        ...ev,
        Id: nextIdRef.current++,
        StylistId: (ev as any).StylistId || (filterStylist !== 'all' ? filterStylist : stylists[0].id),
        AppointmentType: (ev as any).AppointmentType || 'cut',
        Subject: ev.Subject || 'Appointment'
      }));
      setBookings(prev => [...prev, ...mapped]);
    }
    if (args.requestType === 'eventChange' && args.changedRecords?.length) {
      const changed = args.changedRecords as any as Booking[];
      setBookings(prev => prev.map(p => changed.find(c => c.Id === p.Id) ?? p));
    }
    if (args.requestType === 'eventRemove' && args.deletedRecords?.length) {
      const removed = args.deletedRecords as any as Booking[];
      const ids = removed.map(r => r.Id);
      setBookings(prev => prev.filter(p => !ids.includes(p.Id)));
    }
  };

  return (
    <div className="salon-scheduler-wrapper">
      <h2>Salon Scheduler</h2>
      <div className="filter-bar">
        <label>Stylist:</label>
        <select value={filterStylist} onChange={e => setFilterStylist(e.target.value as any)}>
          <option value="all">All</option>
          {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <small style={{ marginLeft: 12, opacity: .7 }}>Click a time slot to add – click an appointment to edit.</small>
      </div>
      <ScheduleComponent
        height="700px"
        ref={scheduleRef as any}
        selectedDate={new Date()}
        eventSettings={{
          dataSource,
          fields: {
            id: 'Id',
            subject: { name: 'Subject', title: 'Title', validation: { required: true } },
            startTime: { name: 'StartTime', title: 'Start' },
            endTime: { name: 'EndTime', title: 'End' }
          }
        }}
        popupOpen={onPopupOpen}
        eventRendered={onEventRendered}
        actionBegin={onActionBegin}
      >
        <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
      </ScheduleComponent>
    </div>
  );
}
