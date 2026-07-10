import { useEffect, useState } from "react";

type Props = {
  date: string;
  isOpen: boolean;
  eventData?: any;
  onClose: () => void;
  onSave: (eventData: any) => void;
  onDelete?: (id: string) => void;
};

const ASSIGNEES = [
  "丸田",
  "佐藤希結",
  "大木",
  "中村",
  "佐藤寛",
  "木下",
  "仁瓶",
  "増田",
  "南雲",
];

export default function EventModal({
  date,
  isOpen,
  eventData,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [startTime, setStartTime] = useState("09:00");
  const [type, setType] = useState("TASK");
  const [backlogId, setBacklogId] = useState("");
  const [title, setTitle] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [status, setStatus] = useState("NOT_STARTED");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (eventData) {
      setStartTime(eventData.startTime || "");
      setType(eventData.type || "TASK");
      setTitle(eventData.title || "");
      setAssignees(eventData.assignee ? eventData.assignee.split(",") : []);
      setStatus(eventData.status || "NOT_STARTED");
      setRemarks(eventData.remarks || "");
      setStartDate(eventData.startDate ?? eventData.eventDate ?? date);
      setEndDate(eventData.endDate ?? eventData.eventDate ?? date);
      setBacklogId(eventData.backlogId || "");
    } else {
      setStartTime("09:00");
      setType("TASK");
      setTitle("");
      setAssignees([]);
      setStatus("NOT_STARTED");
      setRemarks("");
      setStartDate(date);
      setEndDate(date);
      setBacklogId("");
    }
  }, [isOpen, eventData]);

  if (!isOpen) {
    return null;
  }

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "10px",
    alignItems: "center",
    marginBottom: "12px",
  };

  const inputStyle = {
    width: "100%",
    padding: "6px",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "600px",
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <h2>登録/編集画面</h2>

        <div style={rowStyle}>
          <label>開始日</label>

          <input
            type="date"
            style={inputStyle}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <label>終了日</label>

          <input
            type="date"
            style={inputStyle}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <label>時間</label>
          <input
            type="time"
            style={inputStyle}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <label>種別</label>

          <select
            style={inputStyle}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="TASK">TASK</option>
            <option value="JOB">JOB</option>
            <option value="RELEASE">RELEASE</option>
            <option value="VACATION">休暇</option>
          </select>
        </div>

        <div style={rowStyle}>
          <label>Backlog ID</label>

          <input
            style={inputStyle}
            value={backlogId}
            onChange={(e) => setBacklogId(e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <label>イベント名</label>

          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <label>担当者</label>

          <select
            multiple
            style={{
              ...inputStyle,
              height: "100px",
            }}
            value={assignees}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(
                (option) => option.value,
              );

              setAssignees(selected);
            }}
          >
            {ASSIGNEES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div style={rowStyle}>
          <label>ステータス</label>

          <select
            style={inputStyle}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="NOT_STARTED">NOT_STARTED</option>

            <option value="IN_PROGRESS">IN_PROGRESS</option>

            <option value="DONE">DONE</option>
          </select>
        </div>

        <div style={rowStyle}>
          <label>備考</label>

          <textarea
            style={{
              ...inputStyle,
              height: "80px",
            }}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <button
            onClick={() =>
              onSave({
                eventDate: startDate,
                startDate,
                endDate,
                startTime,
                backlogId,
                type,
                title,
                assignee: assignees.join(","),
                status,
                remarks,
              })
            }
          >
            保存
          </button>

          {eventData && (
            <button
              style={{
                backgroundColor: "#F44336",
                color: "white",
              }}
              onClick={() => onDelete?.(eventData.id)}
            >
              削除
            </button>
          )}

          <button onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
}
