import type { TimelineEvent } from "../types";
import { formatDate } from "../utils/formatters";

const eventColors: Record<string, string> = {
  filing: "bg-blue-500",
  document: "bg-green-500",
  hearing: "bg-purple-500",
  decision: "bg-red-500",
};

const eventIcons: Record<string, string> = {
  filing: "📋",
  document: "📄",
  hearing: "🏛️",
  decision: "⚖️",
};

interface Props {
  events: TimelineEvent[];
}

export default function Timeline({ events }: Props) {
  if (!events.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">📅</div>
        <p>אין אירועים בציר הזמן</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 right-5 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="relative flex items-start gap-4 pr-12">
            {/* Dot */}
            <div
              className={`absolute right-3 top-2 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                eventColors[event.type] || "bg-gray-400"
              }`}
            />

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{eventIcons[event.type] || "📌"}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{event.title}</div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                    {event.courtroom && (
                      <p className="text-xs text-gray-400 mt-1">אולם: {event.courtroom}</p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {formatDate(event.date)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
