import { convertMinutesToTimelinePercent, normalizeOpeningHours } from '../../utils/time';

const tickLabelList = [0, 6, 12, 18, 24];

function TimelineBar({ openingHours }) {
  const normalizedTimeRanges = normalizeOpeningHours(openingHours);

  if (!normalizedTimeRanges.length) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <div className="relative px-1 pb-5 pt-4">
        <div className="h-2 w-full rounded-full bg-gray-200" />

        {normalizedTimeRanges.map((timeRangeItem) => {
          const startPercent = convertMinutesToTimelinePercent(timeRangeItem.startMinutes);
          const endPercent = convertMinutesToTimelinePercent(timeRangeItem.endMinutes);
          const segmentWidthPercent = Math.max(0, endPercent - startPercent);

          return (
            <div key={timeRangeItem.id}>
              <div
                className="absolute top-4 h-2 rounded-full bg-orange-400"
                style={{ left: `${startPercent}%`, width: `${segmentWidthPercent}%` }}
              />
              <span
                className="absolute top-0 -translate-x-1/2 text-[10px] font-medium text-orange-500"
                style={{ left: `${startPercent}%` }}
              >
                {timeRangeItem.start}
              </span>
              <span
                className="absolute top-0 -translate-x-1/2 text-[10px] font-medium text-orange-500"
                style={{ left: `${endPercent}%` }}
              >
                {timeRangeItem.end}
              </span>
            </div>
          );
        })}

        <div className="absolute left-0 right-0 top-8">
          {tickLabelList.map((tickHour) => (
            <span
              key={tickHour}
              className="absolute -translate-x-1/2 text-[10px] text-gray-400"
              style={{ left: `${(tickHour / 24) * 100}%` }}
            >
              {tickHour}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimelineBar;
