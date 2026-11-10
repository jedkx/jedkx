// ============================================
// CONTRIBUTION GRAPH - GitHub heatmap
// Anchored to today: current week always on the right
// ============================================

import React, { useEffect, useState } from 'react';
import { SOCIAL_LINKS } from '@/constants/data';
import { requestJson } from '@/lib/request';
import { parseContributionDays } from '@/lib/contributions';

interface ContributionGraphProps {
  accentColor: string;
}

const GITHUB_USER =
  SOCIAL_LINKS.find((l) => l.label === 'GitHub')
    ?.url.split('/')
    .pop() ?? 'jedkx';
const API_URL = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}`;

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const CELL = 10;
const GAP = 3;
const STEP = CELL + GAP;

const getLevelColor = (level: number, accentColor: string): string => {
  if (level <= 0) return 'rgba(255, 255, 255, 0.06)';
  if (level === 1) return `${accentColor}26`;
  if (level === 2) return `${accentColor}52`;
  if (level === 3) return `${accentColor}8c`;
  return accentColor;
};

const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
};

export const ContributionGraph: React.FC<ContributionGraphProps> = ({ accentColor }) => {
  const graphRef = React.useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState<number[][]>([]);
  const [monthLabels, setMonthLabels] = useState<{ weekIdx: number; label: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();

    requestJson(API_URL, ctrl.signal)
      .then(parseContributionDays)
      .then((contributions) => {
        if (ctrl.signal.aborted) return;
        const map = new Map<string, number>(contributions.map((c) => [c.date, c.level]));

        const today = new Date();
        const rollingStart = new Date(today);
        rollingStart.setDate(today.getDate() - 364);

        const todayStr = formatDate(today);
        const rollingStartStr = formatDate(rollingStart);

        setTotal(
          contributions
            .filter((c) => c.date >= rollingStartStr && c.date <= todayStr)
            .reduce((sum, c) => sum + c.count, 0)
        );

        const startDate = new Date(rollingStart);
        startDate.setDate(rollingStart.getDate() - rollingStart.getDay());

        const weeksArr: number[][] = [];
        const monthLabelArr: { weekIdx: number; label: string }[] = [];
        let lastMonth = -1;
        const cursor = new Date(startDate);

        for (let weekIndex = 0; weekIndex < 53; weekIndex += 1) {
          const week: number[] = [];

          for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
            const dateString = formatDate(cursor);
            const isOutsideWindow = dateString < rollingStartStr || dateString > todayStr;
            week.push(isOutsideWindow ? -1 : (map.get(dateString) ?? 0));

            if (dayIndex === 0) {
              const month = cursor.getMonth();
              if (month !== lastMonth) {
                monthLabelArr.push({ weekIdx: weekIndex, label: MONTH_ABBR[month] });
                lastMonth = month;
              }
            }

            cursor.setDate(cursor.getDate() + 1);
          }

          weeksArr.push(week);
        }

        setWeeks(weeksArr);
        setMonthLabels(monthLabelArr);
        setLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          setError(true);
          setLoading(false);
        }
      });

    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!weeks.length) return;
    const parent = graphRef.current?.parentElement;
    if (!parent) return;

    const frame = window.requestAnimationFrame(() => {
      parent.scrollLeft = parent.scrollWidth;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [weeks]);

  if (loading) {
    return (
      <span className="text-terminal-dark/45 text-[11px] animate-pulse">
        syncing contributions...
      </span>
    );
  }

  if (error || weeks.length === 0) {
    return <span className="text-terminal-dark/45 text-[11px]">offline - no data</span>;
  }

  const dayLabelWidth = 28;
  const gridWidth = 53 * STEP - GAP;

  return (
    <div ref={graphRef} className="font-mono select-none min-w-[calc(28px+4px+686px)]">
      <div
        className="relative mb-1"
        style={{ height: '12px', width: `${dayLabelWidth + 4 + gridWidth}px` }}
      >
        <div style={{ position: 'absolute', left: dayLabelWidth + 4, top: 0, width: gridWidth }}>
          {monthLabels.map(({ weekIdx, label }) => (
            <span
              key={`${weekIdx}-${label}`}
              className="absolute text-terminal-dark/60"
              style={{ left: `${weekIdx * STEP}px`, fontSize: '9px', lineHeight: '12px' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-start" style={{ gap: '4px' }}>
        <div className="flex flex-col" style={{ gap: `${GAP}px`, width: `${dayLabelWidth}px` }}>
          {DAY_LABELS.map((label, index) => (
            <div
              key={index}
              className="text-terminal-dark/50 text-right"
              style={{ height: `${CELL}px`, fontSize: '9px', lineHeight: `${CELL}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: `${CELL}px`,
            gap: `${GAP}px`,
          }}
        >
          {weeks.flatMap((week, weekIndex) =>
            week.map((level, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                style={{
                  background: level === -1 ? 'transparent' : getLevelColor(level, accentColor),
                  borderRadius: '2px',
                }}
              />
            ))
          )}
        </div>
      </div>

      <div
        className="flex items-center justify-between mt-2 text-terminal-dark/55 gap-4"
        style={{ fontSize: '9px', paddingLeft: `${dayLabelWidth + 4}px` }}
      >
        <span>{total} contributions in the last 12 months</span>
        <div className="flex items-center gap-1 ml-4 whitespace-nowrap">
          <span className="mr-1">less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              style={{
                width: `${CELL}px`,
                height: `${CELL}px`,
                background: getLevelColor(level, accentColor),
                borderRadius: '3px',
              }}
            />
          ))}
          <span className="ml-1">more</span>
        </div>
      </div>
    </div>
  );
};
