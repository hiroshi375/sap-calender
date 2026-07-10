import { useEffect, useRef, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { client } from "../amplifyClient";
import { getCurrentUser, signOut } from "aws-amplify/auth";

import EventModal from "../components/EventModal";
import HolidayModal from "../components/HolidayModal";
import "./CalendarPage.css";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [vacationEvents, setVacationEvents] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ignoreNextDateClickRef = useRef(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    initialize();
    loadUserRole();
  }, []);

  async function initialize() {
    await loadHolidays();
    await loadEvents();
  }

  async function loadUserRole() {
    try {
      const user = await getCurrentUser();

      const profiles = await client.models.UserProfile.list({
        filter: {
          userId: {
            eq: user.userId,
          },
        },
      });

      const profile = profiles.data[0];

      if (!profile) {
        await client.models.UserProfile.create({
          userId: user.userId,
          userName: user.username,
          role: "user",
        } as any);

        setIsAdmin(false);
        return;
      }

      setIsAdmin(profile.role === "admin");
    } catch (error) {
      console.error("LOAD USER ROLE ERROR=", error);
      setIsAdmin(false);
    }
  }

  function addOneDay(dateStr: string) {
    const date = new Date(dateStr);

    date.setDate(date.getDate() + 1);

    return date.toISOString().substring(0, 10);
  }

  function isVacationType(type: any) {
    return String(type) === "VACATION";
  }

  async function loadHolidays() {
    try {
      const result = await client.models.Holiday.list();

      setHolidays(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  function formatLocalDate(date: Date) {
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

  function getWorkDay(targetDate: Date, holidays: any[]) {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    let workDay = 0;

    for (let day = 1; day <= targetDate.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();

      const dateStr = formatLocalDate(currentDate);

      const isHoliday = holidays.some(
        (holiday) => holiday.holidayDate === dateStr,
      );

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) {
        workDay++;
      }
    }

    return workDay;
  }

  async function loadEvents() {
    try {
      const eventResult = await client.models.CalendarEvent.list();
      const holidayResult = await client.models.Holiday.list();
      const vacationData = eventResult.data.filter((event) =>
        isVacationType(event.type),
      );

      setVacationEvents(vacationData);

      const calendarEvents = eventResult.data
        .filter((event) => !isVacationType(event.type))
        .map((event) => {
          let color = "#2196F3";

          if (isVacationType(event.type)) {
            color = "#757575";
          } else if (event.status === "DONE") {
            color = "#9E9E9E";
          } else {
            switch (event.type) {
              case "TASK":
                color = "#2196F3";
                break;
              case "JOB":
                color = "#FF9800";
                break;
              case "RELEASE":
                color = "#F44336";
                break;
            }
          }

          return {
            id: event.id,
            title:
              `[${isVacationType(event.type) ? "休暇" : event.type}] ${event.title}` +
              (event.assignee
                ? ` [${event.assignee.replaceAll(",", "・")}]`
                : ""),
            start: event.startDate ?? event.eventDate,
            end: addOneDay(event.endDate ?? event.eventDate),
            allDay: true,
            backgroundColor: color,
            borderColor: color,
            classNames: isVacationType(event.type) ? ["vacation-event"] : [],
            extendedProps: {
              original: event,
            },
          };
        });

      const holidayEvents = holidayResult.data.map((holiday) => ({
        id: "holiday-" + holiday.id,
        title: `🎌 ${holiday.holidayName}`,
        date: holiday.holidayDate,
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: "#d32f2f",
      }));

      setEvents([...calendarEvents, ...holidayEvents]);
    } catch (error) {
      console.error("LOAD ERROR=", error);
    }
  }

  function handleDateClick(dateStr: string) {
    if (ignoreNextDateClickRef.current) {
      ignoreNextDateClickRef.current = false;
      return;
    }

    setEditingEvent(null);
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  }

  function handleEventClick(clickInfo: any) {
    const original = clickInfo.event.extendedProps?.original;

    if (!original) {
      return;
    }

    setEditingEvent(original);
    setSelectedDate(original.startDate ?? original.eventDate);
    setIsModalOpen(true);
  }

  async function saveEvent(eventData: any) {
    try {
      if (editingEvent) {
        await client.models.CalendarEvent.update({
          id: editingEvent.id,
          eventDate: eventData.startDate,
          backlogId: eventData.backlogId,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startTime: eventData.startTime,
          type: eventData.type,
          title: eventData.title,
          assignee: eventData.assignee,
          status: eventData.status,
          remarks: eventData.remarks,
        });
      } else {
        await client.models.CalendarEvent.create({
          eventDate: eventData.startDate,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startTime: eventData.startTime,
          backlogId: eventData.backlogId,
          type: eventData.type,
          title: eventData.title,
          assignee: eventData.assignee,
          status: eventData.status,
          remarks: eventData.remarks,
        });
      }

      setIsModalOpen(false);

      await loadEvents();
    } catch (error) {
      console.error(error);
    }
  }

  async function saveHoliday(holidayDate: string, holidayName: string) {
    if (!isAdmin) {
      alert("権限がありません。");
      return;
    }

    const exists = holidays.some(
      (holiday) => holiday.holidayDate === holidayDate,
    );

    if (exists) {
      alert("その日付は既に祝日登録されています。");
      return;
    }

    await client.models.Holiday.create({
      holidayDate,
      holidayName,
    } as any);

    setHolidayModalOpen(false);

    await initialize();
  }

  async function deleteHoliday(id: string) {
    if (!isAdmin) {
      alert("権限がありません。");
      return;
    }

    if (!window.confirm("祝日を削除しますか？")) {
      return;
    }

    await client.models.Holiday.delete({
      id,
    });

    await initialize();
  }

  async function deleteEvent(id: string) {
    if (!window.confirm("削除しますか？")) {
      return;
    }

    await client.models.CalendarEvent.delete({
      id,
    });

    setIsModalOpen(false);

    await loadEvents();
  }

  async function handleSignOut() {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error("SIGN OUT ERROR=", error);
    }
  }

  function renderVacationFooters() {
    document
      .querySelectorAll(".vacation-cell-footer")
      .forEach((element) => element.remove());

    vacationEvents.forEach((vacation) => {
      const startDate = vacation.startDate ?? vacation.eventDate;
      const endDate = vacation.endDate ?? vacation.eventDate;

      const currentDate = new Date(`${startDate}T00:00:00`);
      const lastDate = new Date(`${endDate}T00:00:00`);

      while (currentDate <= lastDate) {
        const dateStr = formatLocalDate(currentDate);

        const frame = document.querySelector(
          `.fc-daygrid-day[data-date="${dateStr}"] .fc-daygrid-day-frame`,
        ) as HTMLElement | null;

        if (frame) {
          let footer = frame.querySelector(
            ".vacation-cell-footer",
          ) as HTMLElement | null;

          if (!footer) {
            footer = document.createElement("div");
            footer.className = "vacation-cell-footer";
            frame.appendChild(footer);
          }

          const item = document.createElement("div");
          item.className = "vacation-cell-event";
          item.textContent =
            `[休暇] ${vacation.title}` +
            (vacation.assignee
              ? ` [${vacation.assignee.replaceAll(",", "・")}]`
              : "");

          item.onmousedown = (event) => {
            event.preventDefault();
            event.stopPropagation();
          };

          item.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();

            ignoreNextDateClickRef.current = true;

            setEditingEvent(vacation);
            setSelectedDate(vacation.startDate ?? vacation.eventDate);
            setIsModalOpen(true);
          };

          footer.appendChild(item);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      renderVacationFooters();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [vacationEvents, events]);

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 style={{ margin: 0 }}>SAP保守開発業務カレンダー</h1>
        <button onClick={handleSignOut}>サインアウト</button>
      </div>

      {isAdmin && (
        <button onClick={() => setHolidayModalOpen(true)}>祝日登録</button>
      )}

      <br />
      <br />

      <div
        style={{
          border: "4px solid #1f2937",
          borderRadius: "16px",
          padding: "16px",
          backgroundColor: "#ffffff",
          overflow: "hidden",
          boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          datesSet={() => {
            window.setTimeout(() => {
              renderVacationFooters();
            }, 0);
          }}
          dateClick={(info) => handleDateClick(info.dateStr)}
          eventClick={handleEventClick}
          dayCellClassNames={(arg) => {
            const dateStr =
              arg.date.getFullYear() +
              "-" +
              String(arg.date.getMonth() + 1).padStart(2, "0") +
              "-" +
              String(arg.date.getDate()).padStart(2, "0");

            const holiday = holidays.find(
              (holiday) => holiday.holidayDate === dateStr,
            );

            if (holiday) {
              return ["holiday-cell"];
            }

            return [];
          }}

          eventContent={(info) => (
            <div
              style={{
                textDecoration:
                  info.event.extendedProps.original?.status === "DONE"
                    ? "line-through"
                    : "none",
              }}
            >
              {info.event.title}
            </div>
          )}
          dayCellContent={(arg) => {
            const workDay = getWorkDay(arg.date, holidays);
            const dayOfWeek = arg.date.getDay();
            const dateStr = formatLocalDate(arg.date);
            const isHoliday = holidays.some(
              (holiday) => holiday.holidayDate === dateStr,
            );
            const showWD = dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday;

            return (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    textAlign: "left",
                  }}
                >
                  {arg.date.getDate()}
                </div>
                <div
                  style={{
                    color: "#0d47a1",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textAlign: "right",
                  }}
                >
                  {showWD ? `WD${workDay}` : ""}
                </div>
              </div>
            );
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#2196F3",
            }}
          />
          <span>TASK</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#FF9800",
            }}
          />
          <span>JOB</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#F44336",
            }}
          />
          <span>RELEASE</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#757575",
            }}
          />
          <span>休暇</span>
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid #d1d5db",
          textAlign: "left",
        }}
      >
        <a
          href="https://me.sap.com/calendar"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#2563eb",
            fontWeight: "bold",
            textDecoration: "underline",
          }}
        >
          SAP for Me 運用カレンダ
        </a>
      </div>

      <EventModal
        date={selectedDate}
        isOpen={isModalOpen}
        eventData={editingEvent}
        onClose={() => setIsModalOpen(false)}
        onSave={saveEvent}
        onDelete={deleteEvent}
      />

      {isAdmin && (
        <HolidayModal
          isOpen={holidayModalOpen}
          onClose={() => setHolidayModalOpen(false)}
          onSave={saveHoliday}
          onDelete={deleteHoliday}
          holidays={holidays}
        />
      )}
    </div>
  );
}
