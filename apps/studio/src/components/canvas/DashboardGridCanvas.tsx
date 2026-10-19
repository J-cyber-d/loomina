import React, { useState } from 'react';
import { ResponsiveGridLayout, useContainerWidth, type LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  GripVertical,
  Trash2,
  TrendingUp,
  Lock,
  Unlock,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AreaChartWidget } from '../charts/AreaChartWidget';
import { BarChartWidget } from '../charts/BarChartWidget';
import { TanStackTableWidget } from '../charts/TanStackTableWidget';
import type { WidgetItem } from '../../App';

export interface GridWidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface DashboardGridCanvasProps {
  widgets: WidgetItem[];
  layouts: GridWidgetLayout[];
  onLayoutChange: (newLayouts: GridWidgetLayout[]) => void;
  onDeleteWidget: (id: string) => void;
  onResetLayout?: () => void;
}

export const DashboardGridCanvas: React.FC<DashboardGridCanvasProps> = ({
  widgets,
  layouts,
  onLayoutChange,
  onDeleteWidget,
  onResetLayout,
}) => {
  const { width, containerRef } = useContainerWidth();
  const [isEditable, setIsEditable] = useState(true);

  const customGridStyles = `
    .react-grid-item.react-grid-placeholder {
      background: rgba(99, 102, 241, 0.15) !important;
      border: 2px dashed #6366f1 !important;
      border-radius: 0.75rem !important;
      transition: all 0.15s ease !important;
      z-index: 2 !important;
    }

    /* Modern Visible Resize Handles */
    .react-grid-item > .react-resizable-handle {
      position: absolute !important;
      z-index: 60 !important;
      opacity: 0.6 !important;
      transition: opacity 0.15s ease, background-color 0.15s ease !important;
    }

    .react-grid-item:hover > .react-resizable-handle {
      opacity: 1 !important;
    }

    /* Southeast Corner Resize Handle */
    .react-grid-item > .react-resizable-handle.react-resizable-handle-se {
      width: 28px !important;
      height: 28px !important;
      bottom: 2px !important;
      right: 2px !important;
      cursor: se-resize !important;
    }

    .react-grid-item > .react-resizable-handle.react-resizable-handle-se::after {
      content: "" !important;
      position: absolute !important;
      right: 5px !important;
      bottom: 5px !important;
      width: 10px !important;
      height: 10px !important;
      border-right: 3px solid #6366f1 !important;
      border-bottom: 3px solid #6366f1 !important;
      border-radius: 2px !important;
      box-shadow: 0 0 6px rgba(99, 102, 241, 0.6) !important;
    }

    /* Right Border Resize Handle */
    .react-grid-item > .react-resizable-handle.react-resizable-handle-e {
      width: 8px !important;
      height: 100% !important;
      top: 0 !important;
      right: 0 !important;
      cursor: e-resize !important;
    }
    .react-grid-item:hover > .react-resizable-handle.react-resizable-handle-e:hover {
      background: rgba(99, 102, 241, 0.3) !important;
    }

    /* Bottom Border Resize Handle */
    .react-grid-item > .react-resizable-handle.react-resizable-handle-s {
      height: 8px !important;
      width: 100% !important;
      bottom: 0 !important;
      left: 0 !important;
      cursor: s-resize !important;
    }
    .react-grid-item:hover > .react-resizable-handle.react-resizable-handle-s:hover {
      background: rgba(99, 102, 241, 0.3) !important;
    }
  `;

  return (
    <div className="space-y-4">
      <style>{customGridStyles}</style>

      {/* Grid Canvas Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900/60 font-mono text-[11px]">
            12-Column Drag & Drop Visual Grid
          </Badge>
          <span className="text-xs text-zinc-500 hidden md:inline">
            {isEditable ? 'Drag cards by the handle (⋮⋮) or grab the bottom/right borders and glowing corner (◿) to resize.' : 'Canvas locked in preview mode.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onResetLayout && (
            <Button
              size="sm"
              variant="outline"
              onClick={onResetLayout}
              className="text-xs h-7 flex items-center gap-1.5 text-zinc-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Layout
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditable(!isEditable)}
            className={`text-xs h-7 flex items-center gap-1.5 ${
              isEditable ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400'
            }`}
          >
            {isEditable ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {isEditable ? 'Editing Mode (Unlocked)' : 'Preview Mode (Locked)'}
          </Button>
        </div>
      </div>

      {/* Visual Canvas Container */}
      <div
        ref={containerRef}
        className={`min-h-[620px] rounded-2xl p-4 transition-all ${
          isEditable
            ? 'bg-[#09090b] border-2 border-dashed border-indigo-500/20 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]'
            : 'bg-transparent border border-transparent'
        }`}
      >
        {width > 0 && (
          <ResponsiveGridLayout
            width={width}
            layouts={{ lg: layouts as LayoutItem[] }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={70}
            dragConfig={{
              enabled: isEditable,
              handle: '.drag-handle',
            }}
            resizeConfig={{
              enabled: isEditable,
              handles: ['se', 'e', 's'],
            }}
            onLayoutChange={(currentLayout) => {
              onLayoutChange(
                currentLayout.map((item) => ({
                  i: item.i,
                  x: item.x,
                  y: item.y,
                  w: item.w,
                  h: item.h,
                  minW: item.minW,
                  minH: item.minH,
                }))
              );
            }}
            margin={[16, 16]}
          >
            {widgets.map((widget) => {
              return (
                <div key={widget.id} className="h-full relative group">
                  <Card className="h-full flex flex-col justify-between overflow-hidden shadow-lg border-[#27272a] bg-[#18181b] group-hover:border-zinc-700 transition-colors">
                    {/* Top Action Bar with Drag Handle & Delete */}
                    <div className="px-3.5 pt-3 pb-1 flex items-center justify-between border-b border-[#27272a]/60 bg-[#151518] shrink-0">
                      <div className="flex items-center gap-2 truncate">
                        {isEditable && (
                          <button
                            type="button"
                            className="drag-handle cursor-grab active:cursor-grabbing text-zinc-500 hover:text-indigo-400 p-0.5 rounded transition-colors"
                            title="Drag to reposition widget on 12-column grid"
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                        )}
                        <span className="font-semibold text-xs text-zinc-200 truncate">
                          {widget.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-[#27272a] text-zinc-400 font-mono">
                          {widget.type.toUpperCase()}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => onDeleteWidget(widget.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                          title="Delete widget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Widget Content Body */}
                    <div className="flex-1 p-3.5 overflow-hidden flex flex-col justify-center min-h-0">
                      {widget.type === 'kpi' && (
                        <div className="space-y-1 my-auto">
                          <div className="text-2xl font-bold tracking-tight text-white">
                            {widget.value || '$48,250'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>{widget.change || '+12.4% MoM'}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-1 truncate">
                            Cube Metric: {widget.metric}
                          </div>
                        </div>
                      )}

                      {widget.type === 'area' && (
                        <div className="h-full w-full flex-1 flex flex-col min-h-[140px]">
                          <AreaChartWidget
                            title=""
                            metric={widget.metric}
                            color={widget.color || '#6366f1'}
                          />
                        </div>
                      )}

                      {widget.type === 'bar' && (
                        <div className="h-full w-full flex-1 flex flex-col min-h-[140px]">
                          <BarChartWidget
                            title=""
                            metric={widget.metric}
                            color={widget.color || '#06b6d4'}
                          />
                        </div>
                      )}

                      {widget.type === 'table' && (
                        <div className="h-full w-full flex-1 overflow-auto">
                          <TanStackTableWidget />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </div>
    </div>
  );
};
