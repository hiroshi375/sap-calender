import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holidayDate: string, holidayName: string) => void;
  onDelete: (id: string) => void;
  holidays: any[];
};

export default function HolidayModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  holidays,
}: Props) {
  const [holidayDate, setHolidayDate] = useState("");

  const [holidayName, setHolidayName] = useState("");

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "500px",
          padding: "20px",
          backgroundColor: "#fff",
          borderRadius: "8px",
        }}
      >
        <h2>祝日登録</h2>

        <div>
          <label>日付</label>

          <input
            type="date"
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
          />
        </div>

        <div>
          <label>祝日名</label>

          <input
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
          />
        </div>

        <br />

        <button onClick={() => onSave(holidayDate, holidayName)}>保存</button>
        <hr />

        <h3>登録済み祝日</h3>

        <div
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: "8px",
          }}
        >
          {holidays
            .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate))
            .map((holiday) => (
              <div
                key={holiday.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span>
                  {holiday.holidayDate}
                  {" : "}
                  {holiday.holidayName}
                </span>

                <button
                  style={{
                    backgroundColor: "#f44336",
                    color: "white",
                  }}
                  onClick={() => onDelete(holiday.id)}
                >
                  削除
                </button>
              </div>
            ))}
        </div>
        <hr />
        <button onClick={onClose}>キャンセル</button>
      </div>
    </div>
  );
}
