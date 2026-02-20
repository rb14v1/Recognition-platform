import { Pagination } from "@mui/material";

interface PaginationControlProps {
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

const PaginationControl = ({ count, page, onChange }: PaginationControlProps) => {
  if (count <= 1) return null;

  return (
    <div className="flex justify-center mt-8 mb-4">
      <Pagination
        count={count}
        page={page}
        onChange={onChange}
        siblingCount={1} 
        boundaryCount={1}
        showFirstButton
        showLastButton
        sx={{
          '& .MuiPaginationItem-root': {
            borderRadius: '8px',
            color: '#64748b', 
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#f0fdfa', 
              color: '#00A8A8'
            },
            '&.Mui-selected': {
              backgroundColor: '#00A8A8 !important',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(0, 168, 168, 0.2)'
            }
          }
        }}
      />
    </div>
  );
};

export default PaginationControl;