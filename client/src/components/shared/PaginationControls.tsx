import { Button } from "@/components/ui/button";
import type { Pagination } from "@/services/api";

type PaginationControlsProps = {
  pagination: Pagination;
  onPageChange: (page: number) => void;
};

/** 服务端分页的统一翻页控件，避免列表只展示默认前 20 条。 */
const PaginationControls = ({ pagination, onPageChange }: PaginationControlsProps) => {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-6" aria-label="分页导航">
      <Button variant="outline" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
        上一页
      </Button>
      <span className="text-sm text-muted-foreground">第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条</span>
      <Button variant="outline" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
        下一页
      </Button>
    </div>
  );
};

export default PaginationControls;
